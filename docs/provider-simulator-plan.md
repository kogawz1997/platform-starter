# Provider Simulator Plan

The provider simulator lets the platform test launch, transfer, webhook, timeout, and duplicate behavior without connecting to a real provider.

## Goals

- Test game launch without real provider credentials.
- Test balance response behavior.
- Test transfer in/out success and failure.
- Test duplicate webhook idempotency.
- Test invalid signature handling.
- Test timeout/ambiguous provider responses.

## Simulator scenarios

- `launch_success`
- `balance_success`
- `transfer_in_success`
- `transfer_out_success`
- `timeout`
- `duplicate_webhook`
- `invalid_signature`

## API scaffold

Current scaffold:

```text
GET /admin/money-ops/provider-simulator/scenarios
```

Next implementation phase:

```text
POST /simulator/launch
POST /simulator/balance
POST /simulator/transfer-in
POST /simulator/transfer-out
POST /simulator/webhook/send
POST /simulator/timeout
```

## No-go rule

Simulator endpoints must never mutate real wallet balance.
