package aerovibe

import (
	"errors"
	"fmt"
)

// Error codes returned by the license server.
const (
	ErrCodeInvalidLicense      = "LICENSE_INVALID"
	ErrCodeProductMismatch     = "LICENSE_PRODUCT_MISMATCH"
	ErrCodeSubscriptionExpired = "SUBSCRIPTION_EXPIRED"
	ErrCodeActivationLimit     = "ACTIVATION_LIMIT_REACHED"
	ErrCodeServerUnavailable   = "SERVER_UNAVAILABLE"
	ErrCodeNetworkError        = "NETWORK_ERROR"
	ErrCodeUnknown             = "UNKNOWN_ERROR"
)

// LicenseError represents a structured error from the license server
// or from the local validation logic.
type LicenseError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *LicenseError) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Is returns true if the target error is a LicenseError with the same code.
func (e *LicenseError) Is(target error) bool {
	var le *LicenseError
	if errors.As(target, &le) {
		return le.Code == e.Code
	}
	return false
}

// Common errors returned by the library.
var (
	ErrNoLicenseKey    = errors.New("no license key provided")
	ErrNotInitialized  = errors.New("license client not initialized")
	ErrAlreadyClosed   = errors.New("license client already closed")
	ErrServerUnreachable = errors.New("cannot connect to license server")
)

// newError creates a LicenseError with the given code and message.
func newError(code, message string) *LicenseError {
	return &LicenseError{Code: code, Message: message}
}

// errorFromResponse creates a LicenseError from an error response body.
func errorFromResponse(errResp struct {
	Error   string `json:"error"`
	Message string `json"`
}) *LicenseError {
	code := errResp.Error
	if code == "" {
		code = ErrCodeUnknown
	}
	message := errResp.Message
	if message == "" {
		message = "an unknown error occurred"
	}
	return newError(code, message)
}
