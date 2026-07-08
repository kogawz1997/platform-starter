# Admin Activity Timeline

Activity Timeline เป็นหน้า read-only สำหรับรวมเหตุการณ์สำคัญจากข้อมูลเดิม โดยไม่เพิ่ม database table ใหม่

## Endpoint

```http
GET /admin/activity/timeline?page=1&take=30&type=ALL
```

Requires admin auth.

## Query params

```txt
page = page number, default 1
take = page size, default 30, max 100
type = ALL | AUDIT | LEDGER | TOPUP | WITHDRAWAL
```

## Sources

Timeline รวมข้อมูลจาก:

- `AdminAuditLog`
- `WalletLedger`
- `TopUpRequest`
- `WithdrawalRequest`

ไม่มีการเขียนข้อมูลใหม่ และไม่มีการเปลี่ยนสถานะธุรกรรม

## UI

Admin page:

```txt
/activity
```

Features:

- summary metrics
- type filters
- timeline list
- pagination
- quick links to related pages

## Smoke checks

`scripts/smoke-api.sh` now checks:

```txt
GET /admin/activity/timeline -> 401 without token
GET /admin/activity/timeline?page=1&take=1 -> 200 with ADMIN_TOKEN
```

## QA checklist

1. Build API and admin web

```bash
pnpm build:api
pnpm build:web-admin
```

2. Open admin page

```txt
/activity
```

3. Verify

- page loads
- ALL filter works
- AUDIT filter works
- LEDGER filter works
- TOPUP filter works
- WITHDRAWAL filter works
- Previous/Next works
- quick links open related pages

4. Smoke test

```bash
API_URL="https://api-service.up.railway.app" \
ADMIN_TOKEN="<admin-access-token>" \
./scripts/smoke-api.sh
```

## Notes

This page is intended for operations visibility. It is not a full immutable event sourcing ledger. Critical money-state truth should still come from wallet ledgers, audit logs, and reconciliation reports.
