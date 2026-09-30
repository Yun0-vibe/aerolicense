// Package aerovibe provides license client functionality for all
// AeroVibe Studio products. It handles all communication with the
// license server, including validation, heartbeats, and feature gating.
//
// The user only sees a license key — all server URLs, API keys, and
// product codes are compiled into the binary and hidden from the user.
//
// If the library cannot reach the license server, the product should
// shut down automatically.
package aerovibe

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

// Build-time variables. These are set via -ldflags at build time
// to configure the library for each specific product.
//
// Example:
//
//	go build -ldflags "-X main.productSlug=my-product \
//	  -X main.productAPIKey=my_api_key \
//	  -X main.licenseServerURL=https://license.example.com"
var (
	licenseServerURL = "https://license.aerovibestudio.com"
	productAPIKey    = "default_key"
	productSlug      = "default_product"
)

const (
	// heartbeatInterval is how often the client checks in with the server.
	heartbeatInterval = 5 * time.Minute

	// validationTimeout is the max time to wait for a server response.
	validationTimeout = 10 * time.Second

	// maxRetries is the number of attempts before giving up.
	maxRetries = 3

	// retryDelay is the base delay between retries (doubles each attempt).
	retryDelay = 2 * time.Second
)

// License holds the validated license state and manages the
// background heartbeat goroutine.
type License struct {
	key          string
	valid        bool
	tier         string
	features     Features
	expiresAt    time.Time
	customerName string
	activations  []Activation
	lastError    error

	mu       sync.RWMutex
	stopChan chan struct{}
	stopOnce sync.Once
}

// Features represents the feature flags and limits for a license.
type Features struct {
	MaxIPs            int      `json:"max_ips"`
	MaxActivations    int      `json:"max_activations"`
	BasicDetection    bool     `json:"basic_detection"`
	AdvancedDetection bool     `json:"advanced_detection"`
	L7Signatures     bool     `json:"l7_signatures"`
	BehaviorEngine    bool     `json:"behavior_engine"`
	MetricsAPI        bool     `json:"metrics_api"`
	GeoBlocking      bool     `json:"geo_blocking"`
	Alerts            []string `json:"alerts"`
	Support           string   `json:"support"`
	WhiteLabel        bool     `json:"white_label"`
}

// Activation represents a single machine activation.
type Activation struct {
	IPAddress   string    `json:"ip_address"`
	Hostname    string    `json:"hostname"`
	ActivatedAt time.Time `json:"activated_at"`
	LastSeenAt  time.Time `json:"last_seen_at"`
}

// Init initializes the license client and validates the license.
// This is the FIRST thing every product calls.
//
// If validation fails, it returns an error and the product should exit.
// On success, a background heartbeat goroutine is started automatically.
func Init(licenseKey string) (*License, error) {
	if licenseKey == "" {
		return nil, ErrNoLicenseKey
	}

	l := &License{
		key:      licenseKey,
		stopChan: make(chan struct{}),
	}

	// Validate on startup — this is blocking and will retry.
	if err := l.Validate(); err != nil {
		return nil, err
	}

	// Start heartbeat goroutine
	go l.heartbeatLoop()

	return l, nil
}

// Valid returns true if the license is currently valid.
func (l *License) Valid() bool {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.valid
}

// LastError returns the last error encountered by the client.
func (l *License) LastError() error {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.lastError
}

// CustomerName returns the name of the customer this license belongs to.
func (l *License) CustomerName() string {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.customerName
}

// Activations returns the list of current activations.
func (l *License) Activations() []Activation {
	l.mu.RLock()
	defer l.mu.RUnlock()
	result := make([]Activation, len(l.activations))
	copy(result, l.activations)
	return result
}

// httpClient returns a new HTTP client with the configured timeout.
func httpClient() *http.Client {
	return &http.Client{
		Timeout: validationTimeout,
	}
}

// serverURL returns the full URL for a given API endpoint.
func serverURL(endpoint string) string {
	return licenseServerURL + endpoint
}

// productHeaders returns the standard headers for API requests.
func productHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Product-API-Key", productAPIKey)
	req.Header.Set("X-Product-Slug", productSlug)
}

// validateRequest builds the standard validation request body.
func (l *License) validateRequest() map[string]interface{} {
	return map[string]interface{}{
		"license_key":         l.key,
		"product_slug":        productSlug,
		"ip_address":          getLocalIP(),
		"hostname":            getHostname(),
		"machine_fingerprint": getMachineFingerprint(),
		"version":            getProductVersion(),
	}
}

// String returns a human-readable summary of the license.
func (l *License) String() string {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return fmt.Sprintf("License{tier=%s, valid=%t, expires=%s, customer=%s}",
		l.tier, l.valid, l.expiresAt.Format("2006-01-02"), l.customerName)
}
