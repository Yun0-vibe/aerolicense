# Makefile for AeroDDoS Protection
# Builds with product-specific ldflags injected into the aerovibe library

BINARY_NAME=aeroddos
LDFLAGS=-X github.com/aerovibestudio/aerovibe.productSlug=aerodDos-protection \
		-X github.com/aerovibestudio/aerovibe.productAPIKey=prod_key_aeroddos_protection_abc123 \
		-X github.com/aerovibestudio/aerovibe.licenseServerURL=https://license.aerovibestudio.com

build:
	go build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME) ./cmd

clean:
	rm -f $(BINARY_NAME)

.PHONY: build clean
