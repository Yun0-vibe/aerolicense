// AeroDDoS Protection — main entry point
//
// This product uses the aerovibe library for all license management.
// The user only sees a license key — all server details are hidden.
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/aerovibestudio/aerovibe"
)

func main() {
	// Read license key from env, config file, or prompt
	licenseKey := readLicenseKey()

	if licenseKey == "" {
		fmt.Println("AeroDDoS Protection v1.0.0")
		fmt.Println("(c) AeroVibeStudio")
		fmt.Println()
		fmt.Print("Enter license key: ")

		reader := bufio.NewReader(os.Stdin)
		input, _ := reader.ReadString('\n')
		licenseKey = strings.TrimSpace(input)
	}

	// Initialize license client
	// If this fails → product exits immediately
	license, err := aerovibe.Init(licenseKey)
	if err != nil {
		fmt.Fprintf(os.Stderr, "\nERROR: %v\n", err)
		fmt.Fprintf(os.Stderr, "Please check your license key and internet connection.\n")
		os.Exit(1) // AUTO SHUTDOWN
	}
	defer license.Close()

	// License is valid — display info
	fmt.Println()
	fmt.Println("AeroDDoS Protection v1.0.0")
	fmt.Println("(c) AeroVibeStudio")
	fmt.Println()
	fmt.Printf("Licensed to: %s\n", license.Tier())
	fmt.Printf("Expires: %s\n", license.ExpiresAt().Format("2006-01-02"))
	fmt.Println()

	// Unlock features based on license
	if license.HasFeature("basic_detection") {
		fmt.Println("[OK] Basic detection enabled")
	}
	if license.HasFeature("advanced_detection") {
		fmt.Println("[OK] Advanced detection enabled")
	}
	if license.HasFeature("l7_signatures") {
		fmt.Println("[OK] L7 signatures enabled")
	}
	if license.HasFeature("behavior_engine") {
		fmt.Println("[OK] Behavior engine enabled")
	}
	if license.HasFeature("metrics_api") {
		fmt.Println("[OK] Metrics API enabled")
	}
	if license.HasFeature("geo_blocking") {
		fmt.Println("[OK] Geo-blocking enabled")
	}

	fmt.Println()
	fmt.Printf("Max IPs: %d\n", license.MaxIPs())
	fmt.Println()
	fmt.Println("Starting firewall...")

	// Start the firewall (product-specific logic)
	startFirewall(license)
}

// readLicenseKey tries to read the key from env, then config file.
func readLicenseKey() string {
	// Try environment variable first
	key := os.Getenv("AERODDOS_LICENSE_KEY")
	if key != "" {
		return key
	}

	// Try config file
	data, err := os.ReadFile("/etc/aeroddos/license.key")
	if err == nil {
		return strings.TrimSpace(string(data))
	}

	return ""
}

// startFirewall is a placeholder for the actual firewall logic.
func startFirewall(license *aerovibe.License) {
	// Product-specific implementation goes here
	// The license object is passed to gate features at runtime
	select {} // Block forever (placeholder)
}
