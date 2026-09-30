package aerovibe

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

// heartbeatRequest represents the JSON body sent to the /heartbeat endpoint.
type heartbeatRequest struct {
	LicenseKey string                 `json:"license_key"`
	ProductSlug string                `json:"product_slug"`
	IPAddress  string                 `json:"ip_address"`
	Stats      map[string]interface{} `json:"stats"`
}

// Heartbeat sends a heartbeat to the license server.
// This is called automatically every 5 minutes by the background
// goroutine, but can also be called manually if needed.
func (l *License) Heartbeat() error {
	if l == nil {
		return ErrNotInitialized
	}

	reqBody := heartbeatRequest{
		LicenseKey:  l.key,
		ProductSlug: productSlug,
		IPAddress:   getLocalIP(),
		Stats: map[string]interface{}{
			"uptime":  getUptime(),
			"version": getProductVersion(),
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal heartbeat: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, serverURL("/api/v1/heartbeat"), bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create heartbeat request: %w", err)
	}
	productHeaders(req)

	client := &http.Client{Timeout: validationTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("heartbeat failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp map[string]string
		json.NewDecoder(resp.Body).Decode(&errResp)
		code := errResp["error"]
		if code == "" {
			code = ErrCodeUnknown
		}
		message := errResp["message"]
		if message == "" {
			message = "heartbeat rejected"
		}
		return newError(code, message)
	}

	return nil
}

// heartbeatLoop runs in the background, sending heartbeats every
// heartbeatInterval. It stops when Close() is called.
func (l *License) heartbeatLoop() {
	ticker := time.NewTicker(heartbeatInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := l.Heartbeat(); err != nil {
				// Log but don't crash — just keep trying
				fmt.Fprintf(os.Stderr, "[aerovibe] Heartbeat error: %v\n", err)
			}
		case <-l.stopChan:
			return
		}
	}
}

// Close stops the heartbeat goroutine and releases resources.
// It is safe to call Close multiple times.
func (l *License) Close() {
	if l == nil {
		return
	}
	l.stopOnce.Do(func() {
		close(l.stopChan)
	})
}
