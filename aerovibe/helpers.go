package aerovibe

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net"
	"os"
	"runtime"
	"strings"
)

// getLocalIP returns the primary non-loopback IP address of the machine.
// It does this by opening a UDP "connection" to a public address — no
// traffic is actually sent, but the OS selects the appropriate interface.
func getLocalIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()
	return conn.LocalAddr().(*net.UDPAddr).IP.String()
}

// getHostname returns the machine's hostname.
func getHostname() string {
	h, err := os.Hostname()
	if err != nil {
		return "unknown"
	}
	return h
}

// getMACAddress returns the MAC address of the first network interface
// that has one. Used for machine fingerprinting.
func getMACAddress() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "unknown"
	}
	for _, iface := range interfaces {
		if iface.HardwareAddr != nil && len(iface.HardwareAddr) > 0 {
			return iface.HardwareAddr.String()
		}
	}
	return "unknown"
}

// getMachineFingerprint creates a unique fingerprint from hostname + MAC address.
// This is used to prevent license sharing across different machines.
func getMachineFingerprint() string {
	hostname, _ := os.Hostname()
	mac := getMACAddress()
	data := hostname + "|" + mac
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// getUptime returns the system uptime in seconds.
// On Linux, reads from /proc/uptime. On other platforms, returns 0.
func getUptime() int64 {
	if runtime.GOOS != "linux" {
		return 0
	}
	data, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return 0
	}
	var uptime float64
	fmt.Sscanf(string(data), "%f", &uptime)
	return int64(uptime)
}

// getProductVersion returns the product version.
// This can be overridden at build time via:
//
//	go build -ldflags "-X github.com/aerovibestudio/aerovibe.getProductVersion=1.2.3"
func getProductVersion() string {
	return "1.0.0"
}

// getOSInfo returns a string describing the OS and architecture.
// Useful for debugging and server-side logging.
func getOSInfo() string {
	return fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH)
}

// sanitizeKey removes whitespace and converts to uppercase for consistent
// license key handling.
func sanitizeKey(key string) string {
	key = strings.TrimSpace(key)
	key = strings.ToUpper(key)
	return key
}

// isValidKeyFormat checks if a license key matches the expected format.
// Expected format: AERO-PRODUCT-XXXX where XXXX is alphanumeric.
func isValidKeyFormat(key string) bool {
	key = sanitizeKey(key)
	parts := strings.Split(key, "-")
	if len(parts) < 3 {
		return false
	}
	if parts[0] != "AERO" {
		return false
	}
	// Last part should be at least 4 characters
	lastPart := parts[len(parts)-1]
	return len(lastPart) >= 4
}
