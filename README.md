# AeroVibe Studio — License Library

This repository contains the `aerovibe` Go library that handles **all** communication with the AeroVibe Studio license server. Every AeroVibe Studio product embeds this library.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User's Product                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              aerovibe library                 │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────────┐  │  │
│  │  │ Validate│ │ Heartbeat│ │   Helpers     │  │  │
│  │  └────┬────┘ └────┬─────┘ └───────────────┘  │  │
│  │       │           │                          │  │
│  │  ┌────┴───────────┴──────────────────────┐   │  │
│  │  │         HTTP Client (hidden)          │   │  │
│  │  └────────────────┬──────────────────────┘   │  │
│  └───────────────────┼──────────────────────────┘  │
│                      │                              │
└──────────────────────┼──────────────────────────────┘
                       │ HTTPS
                       ▼
         ┌─────────────────────────────┐
         │   license.aerovibestudio.com │
         │       License Server          │
         └─────────────────────────────┘
```

## File Structure

```
aerovibe/
├── go.mod               # Module definition
├── aerovibe.go          # Main library: types, Init, public API
├── validate.go          # Validation logic: HTTP POST, retry, parse
├── heartbeat.go         # Heartbeat logic: background goroutine
├── helpers.go           # Helpers: IP, hostname, fingerprint, uptime
├── errors.go            # Error types, codes, and messages
└── aerovibe_test.go     # Unit tests

products/
├── aeroddos-protection/  # Example product: AeroDDoS Protection
│   ├── go.mod
│   ├── cmd/main.go
│   └── Makefile
└── aeroddos-tester/      # Example product: AeroDDoS Tester
    ├── go.mod
    ├── cmd/main.go
    └── Makefile
```

## Library API

### `func Init(licenseKey string) (*License, error)`

The **first** thing every product calls. Validates the license key against the server and starts the background heartbeat.

- If validation fails → returns error → **product must exit**
- On success → returns a `*License` handle

### `func (l *License) Validate() error`

Re-validates the license. Called automatically on `Init` and can be called periodically.

### `func (l *License) HasFeature(feature string) bool`

Checks if a feature is enabled. Returns `false` if license is invalid.

Feature names: `basic_detection`, `advanced_detection`, `l7_signatures`, `behavior_engine`, `metrics_api`, `geo_blocking`, `white_label`

### `func (l *License) Tier() string`

Returns the tier name (e.g., `"professional"`, `"enterprise"`).

### `func (l *License) MaxIPs() int`

Returns the maximum number of IPs allowed.

### `func (l *License) ExpiresAt() time.Time`

Returns the license expiry date.

### `func (l *License) Heartbeat() error`

Sends a heartbeat to the server. Called automatically every 5 minutes.

### `func (l *License) Close()`

Stops the heartbeat goroutine. Called on product shutdown.

## Build System

Each product injects its own configuration via `-ldflags`:

```makefile
# AeroDDoS Protection
go build -ldflags "-X github.com/aerovibestudio/aerovibe.productSlug=aeroddos-protection \
    -X github.com/aerovibestudio/aerovibe.productAPIKey=prod_key_aeroddos_protection_abc123 \
    -X github.com/aerovibestudio/aerovibe.licenseServerURL=https://license.aerovibestudio.com" \
    -o aeroddos ./cmd

# AeroDDoS Tester
go build -ldflags "-X github.com/aerovibestudio/aerovibe.productSlug=aeroddos-tester \
    -X github.com/aerovibestudio/aerovibe.productAPIKey=prod_key_aeroddos_tester_def456 \
    -X github.com/aerovibestudio/aerovibe.licenseServerURL=https://license.aerovibestudio.com" \
    -o aeroddos-tester ./cmd
```

## Auto-Shutdown Scenarios

| Scenario | Error Code | Behavior |
|----------|-----------|----------|
| No internet | `NETWORK_ERROR` | Retry 3x, then exit |
| Invalid key | `LICENSE_INVALID` | Exit immediately |
| Wrong product | `LICENSE_PRODUCT_MISMATCH` | Exit immediately |
| Expired | `SUBSCRIPTION_EXPIRED` | Exit immediately |
| Too many activations | `ACTIVATION_LIMIT_REACHED` | Exit immediately |

## Adding to a New Product

1. Create a new directory under `products/`
2. Copy the `go.mod` pattern with `replace` directive
3. Import `github.com/aerovibestudio/aerovibe`
4. Call `aerovibe.Init(licenseKey)` at startup
5. Exit if it returns an error
6. Use `license.HasFeature(...)` to gate features
7. Create a `Makefile` with product-specific ldflags

## Running Tests

```bash
cd aerovibe
go test -v ./...
```

## Key Design Principles

1. **User only sees a license key** — no server URLs, API keys, or product codes
2. **Compiled into binary** — config injected at build time via ldflags
3. **No connection = auto shutdown** — if server is unreachable, product exits
4. **Same library for all products** — just change build flags
5. **Heartbeat keeps license fresh** — periodic check-ins prevent offline bypass
6. **Machine fingerprint** — prevents license sharing across servers
