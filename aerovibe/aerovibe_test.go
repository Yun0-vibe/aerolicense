package aerovibe

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestInit_NoKey(t *testing.T) {
	_, err := Init("")
	if err == nil {
		t.Fatal("expected error for empty license key")
	}
	if err != ErrNoLicenseKey {
		t.Fatalf("expected ErrNoLicenseKey, got %v", err)
	}
}

func TestInit_InvalidKey(t *testing.T) {
	// Create a test server that always returns invalid
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"error":   ErrCodeInvalidLicense,
			"message": "License key is invalid or expired",
		})
	}))
	defer server.Close()

	// Override the server URL for testing
	oldURL := licenseServerURL
	licenseServerURL = server.URL
	defer func() { licenseServerURL = oldURL }()

	_, err := Init("AERO-TEST-INVALID")
	if err == nil {
		t.Fatal("expected error for invalid license")
	}

	var lerr *LicenseError
	if !isLicenseError(err, &lerr) {
		t.Fatalf("expected LicenseError, got %T: %v", err, err)
	}
	if lerr.Code != ErrCodeInvalidLicense {
		t.Fatalf("expected code %s, got %s", ErrCodeInvalidLicense, lerr.Code)
	}
}

func TestInit_ValidKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/validate" {
			json.NewEncoder(w).Encode(map[string]interface{}{
				"valid": true,
				"tier":  map[string]string{"name": "professional"},
				"features": map[string]interface{}{
					"max_ips":            100,
					"max_activations":    3,
					"basic_detection":    true,
					"advanced_detection": true,
					"l7_signatures":     true,
					"behavior_engine":    false,
					"metrics_api":        true,
					"geo_blocking":      false,
					"alerts":            []string{"email"},
					"support":           "priority",
					"white_label":        false,
				},
				"expires_at": time.Now().Add(30 * 24 * time.Hour),
				"customer":   map[string]string{"name": "Test Customer"},
				"activation": map[string]interface{}{
					"ip_address":   "192.168.1.1",
					"hostname":     "test-server",
					"activated_at": time.Now(),
					"last_seen_at":  time.Now(),
				},
			})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	oldURL := licenseServerURL
	licenseServerURL = server.URL
	defer func() { licenseServerURL = oldURL }()

	license, err := Init("AERO-TEST-a1b2c3d4")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer license.Close()

	if !license.Valid() {
		t.Fatal("expected license to be valid")
	}
	if license.Tier() != "professional" {
		t.Fatalf("expected tier 'professional', got '%s'", license.Tier())
	}
	if license.MaxIPs() != 100 {
		t.Fatalf("expected MaxIPs 100, got %d", license.MaxIPs())
	}
	if license.CustomerName() != "Test Customer" {
		t.Fatalf("expected customer 'Test Customer', got '%s'", license.CustomerName())
	}
}

func TestHasFeature(t *testing.T) {
	license := &License{
		valid: true,
		features: Features{
			BasicDetection:    true,
			AdvancedDetection: true,
			L7Signatures:     true,
			BehaviorEngine:    false,
			MetricsAPI:        true,
			GeoBlocking:      false,
			WhiteLabel:        false,
		},
	}

	tests := []struct {
		feature string
		want    bool
	}{
		{"basic_detection", true},
		{"advanced_detection", true},
		{"l7_signatures", true},
		{"behavior_engine", false},
		{"metrics_api", true},
		{"geo_blocking", false},
		{"white_label", false},
		{"nonexistent", false},
	}

	for _, tt := range tests {
		t.Run(tt.feature, func(t *testing.T) {
			got := license.HasFeature(tt.feature)
			if got != tt.want {
				t.Errorf("HasFeature(%q) = %v, want %v", tt.feature, got, tt.want)
			}
		})
	}
}

func TestHasFeature_InvalidLicense(t *testing.T) {
	license := &License{valid: false}
	if license.HasFeature("basic_detection") {
		t.Fatal("expected false for invalid license")
	}
}

func TestIsExpired(t *testing.T) {
	tests := []struct {
		name      string
		expiresAt time.Time
		want      bool
	}{
		{"expired", time.Now().Add(-1 * time.Hour), true},
		{"not expired", time.Now().Add(1 * time.Hour), false},
		{"expires now", time.Now(), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			l := &License{expiresAt: tt.expiresAt}
			if got := l.IsExpired(); got != tt.want {
				t.Errorf("IsExpired() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestLicenseError_Is(t *testing.T) {
	err1 := newError(ErrCodeInvalidLicense, "test")
	err2 := newError(ErrCodeInvalidLicense, "different message")
	err3 := newError(ErrCodeSubscriptionExpired, "test")

	if !err1.Is(err2) {
		t.Fatal("expected err1.Is(err2) to be true (same code)")
	}
	if err1.Is(err3) {
		t.Fatal("expected err1.Is(err3) to be false (different code)")
	}
}

func TestSanitizeKey(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"  aero-test-abc123  ", "AERO-TEST-ABC123"},
		{"AERO-TEST-ABC123", "AERO-TEST-ABC123"},
		{"aero-test-abc123", "AERO-TEST-ABC123"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got := sanitizeKey(tt.input)
			if got != tt.want {
				t.Errorf("sanitizeKey(%q) = %q, want %q", tt.input, got, tt.want)
			}
		})
	}
}

func TestIsValidKeyFormat(t *testing.T) {
	tests := []struct {
		key  string
		want bool
	}{
		{"AERO-PROD-a1b2c3d4", true},
		{"AERO-DDOS-PRO-a1b2c3d4", true},
		{"aero-ddos-pro-a1b2c3d4", true},
		{"INVALID", false},
		{"AERO", false},
		{"AERO-PROD", false},
		{"", false},
	}

	for _, tt := range tests {
		t.Run(tt.key, func(t *testing.T) {
			got := isValidKeyFormat(tt.key)
			if got != tt.want {
				t.Errorf("isValidKeyFormat(%q) = %v, want %v", tt.key, got, tt.want)
			}
		})
	}
}

func TestGetLocalIP(t *testing.T) {
	ip := getLocalIP()
	if ip == "" {
		t.Fatal("expected non-empty IP")
	}
	if ip == "127.0.0.1" {
		// This is acceptable but unusual in test environments
		t.Log("got loopback IP — this may be expected in some environments")
	}
}

func TestGetHostname(t *testing.T) {
	h := getHostname()
	if h == "" {
		t.Fatal("expected non-empty hostname")
	}
}

func TestGetMachineFingerprint(t *testing.T) {
	fp := getMachineFingerprint()
	if len(fp) != 64 {
		t.Fatalf("expected 64-char SHA256 hex string, got %d chars", len(fp))
	}
}

func TestClose_Idempotent(t *testing.T) {
	l := &License{
		stopChan: make(chan struct{}),
	}
	// Should not panic on double close
	l.Close()
	l.Close()
}

func TestHeartbeat(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/v1/heartbeat" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	oldURL := licenseServerURL
	licenseServerURL = server.URL
	defer func() { licenseServerURL = oldURL }()

	l := &License{key: "AERO-TEST-a1b2c3d4"}
	if err := l.Heartbeat(); err != nil {
		t.Fatalf("unexpected heartbeat error: %v", err)
	}
}

func TestHeartbeat_ServerError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error":   ErrCodeServerUnavailable,
			"message": "Internal server error",
		})
	}))
	defer server.Close()

	oldURL := licenseServerURL
	licenseServerURL = server.URL
	defer func() { licenseServerURL = oldURL }()

	l := &License{key: "AERO-TEST-a1b2c3d4"}
	err := l.Heartbeat()
	if err == nil {
		t.Fatal("expected error from server error")
	}
}

// isLicenseError checks if err is or contains a LicenseError.
func isLicenseError(err error, target **LicenseError) bool {
	if le, ok := err.(*LicenseError); ok {
		*target = le
		return true
	}
	return false
}
