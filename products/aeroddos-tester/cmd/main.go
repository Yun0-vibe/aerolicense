// AeroDDoS Tester — main entry point
//
// This product uses the aerovibe library for all license management.
// Same library as AeroDDoS Protection, different build flags.
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/aerovibestudio/aerovibe"
)

func main() {
	licenseKey := readLicenseKey()

	if licenseKey == "" {
		fmt.Println("AeroDDoS Tester v1.0.0")
		fmt.Println("(c) AeroVibeStudio")
		fmt.Println()
		fmt.Print("Enter license key: ")

		reader := bufio.NewReader(os.Stdin)
		input, _ := reader.ReadString('\n')
		licenseKey = strings.TrimSpace(input)
	}

	// Initialize license client
	license, err := aerovibe.Init(licenseKey)
	if err != nil {
		fmt.Fprintf(os.Stderr, "\nERROR: %v\n", err)
		fmt.Fprintf(os.Stderr, "Please check your license key and internet connection.\n")
		os.Exit(1) // AUTO SHUTDOWN
	}
	defer license.Close()

	fmt.Println()
	fmt.Println("AeroDDoS Tester v1.0.0")
	fmt.Println("(c) AeroVibeStudio")
	fmt.Println()
	fmt.Printf("Licensed to: %s\n", license.Tier())
	fmt.Printf("Expires: %s\n", license.ExpiresAt().Format("2006-01-02"))
	fmt.Println()

	// Unlock tester-specific features
	if license.HasFeature("advanced_attacks") {
		fmt.Println("[OK] Advanced attacks enabled")
	}
	if license.HasFeature("custom_payloads") {
		fmt.Println("[OK] Custom payloads enabled")
	}

	fmt.Println()
	fmt.Println("Starting tester...")

	startTester(license)
}

func readLicenseKey() string {
	key := os.Getenv("AERODDOS_TESTER_LICENSE_KEY")
	if key != "" {
		return key
	}

	data, err := os.ReadFile("/etc/aeroddos-tester/license.key")
	if err == nil {
		return strings.TrimSpace(string(data))
	}

	return ""
}

func startTester(license *aerovibe.License) {
	select {} // Placeholder
}
