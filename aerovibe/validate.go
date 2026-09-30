package aerovibe

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// validateResponse represents the JSON response from the /validate endpoint.
type validateResponse struct {
	Valid      bool      `json:"valid"`
	Tier       tierInfo  `json:"tier"`
	Features   Features  `json:"features"`
	ExpiresAt  time.Time `json:"expires_at"`
	Customer   custInfo  `json:"customer"`
	Activation activationInfo `json:"activation"`
}

type tierInfo struct {
	Name string `json:"name"`
}

type custInfo struct {
	Name string `json:"name"`
}

type activationInfo struct {
	IPAddress   string    `json:"ip_address"`
	Hostname    string    `json:"hostname"`
	ActivatedAt time.Time `json:"activated_at"`
	LastSeenAt  time.Time `json:"last_seen_at"`
}

// Validate checks if the license is valid by contacting the license server.
// It will retry up to maxRetries times before returning an error.
//
// This is called automatically on Init and can be called periodically
// to re-validate the license.
func (l *License) Validate() error {
	if l == nil {
		return ErrNotInitialized
	}

	body, err := json.Marshal(l.validateRequest())
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff: 2s, 4s, 8s...
			delay := retryDelay * time.Duration(1<<(attempt-1))
			time.Sleep(delay)
		}

		result, err := l.doValidate(body)
		if err != nil {
			lastErr = err
			continue
		}

		// Success — update license state
		l.mu.Lock()
		l.valid = true
		l.tier = result.Tier.Name
		l.features = result.Features
		l.expiresAt = result.ExpiresAt
		l.customerName = result.Customer.Name
		l.lastError = nil
		if result.Activation.IPAddress != "" {
			l.activations = []Activation{
				{
					IPAddress:   result.Activation.IPAddress,
					Hostname:    result.Activation.Hostname,
					ActivatedAt: result.Activation.ActivatedAt,
					LastSeenAt:  result.Activation.LastSeenAt,
				},
			}
		}
		l.mu.Unlock()

		return nil
	}

	// All retries failed
	l.mu.Lock()
	l.valid = false
	l.lastError = lastErr
	l.mu.Unlock()

	return lastErr
}

// doValidate performs a single validation request to the server.
func (l *License) doValidate(body []byte) (*validateResponse, error) {
	req, err := http.NewRequest(http.MethodPost, serverURL("/api/v1/validate"), bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	productHeaders(req)

	resp, err := httpClient().Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrServerUnreachable, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp struct {
			Error   string `json:"error"`
			Message string `json:"message"`
		}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return nil, errorFromResponse(errResp)
	}

	var result validateResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// HasFeature checks if a feature is enabled for this license.
// Returns false if the license is not valid.
func (l *License) HasFeature(feature string) bool {
	if l == nil {
		return false
	}

	l.mu.RLock()
	defer l.mu.RUnlock()

	if !l.valid {
		return false
	}

	switch feature {
	case "basic_detection":
		return l.features.BasicDetection
	case "advanced_detection":
		return l.features.AdvancedDetection
	case "l7_signatures":
		return l.features.L7Signatures
	case "behavior_engine":
		return l.features.BehaviorEngine
	case "metrics_api":
		return l.features.MetricsAPI
	case "geo_blocking":
		return l.features.GeoBlocking
	case "white_label":
		return l.features.WhiteLabel
	default:
		return false
	}
}

// Tier returns the tier name (e.g., "professional", "enterprise").
func (l *License) Tier() string {
	if l == nil {
		return ""
	}
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.tier
}

// MaxIPs returns the maximum number of IPs allowed under this license.
func (l *License) MaxIPs() int {
	if l == nil {
		return 0
	}
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.features.MaxIPs
}

// MaxActivations returns the maximum number of activations allowed.
func (l *License) MaxActivations() int {
	if l == nil {
		return 0
	}
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.features.MaxActivations
}

// ExpiresAt returns the license expiry date.
func (l *License) ExpiresAt() time.Time {
	if l == nil {
		return time.Time{}
	}
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.expiresAt
}

// IsExpired returns true if the license has expired.
func (l *License) IsExpired() bool {
	if l == nil {
		return true
	}
	l.mu.RLock()
	defer l.mu.RUnlock()
	return time.Now().After(l.expiresAt)
}
