# Makefile for AeroDDoS Tester
# Same library, different product slug and API key

BINARY_NAME=aeroddos-tester
LDFLAGS=-X github.com/aerovibestudio/aerovibe.productSlug=aeroddos-tester \
		-X github.com/aerovibestudio/aerovibe.productAPIKey=prod_key_aeroddos_tester_def456 \
		-X github.com/aerovibestudio/aerovibe.licenseServerURL=https://license.aerovibestudio.com

build:
	go build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME) ./cmd

clean:
	rm -f $(BINARY_NAME)

.PHONY: build clean
