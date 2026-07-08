# GitHub Actions Smoke Workflow

Workflow: `.github/workflows/smoke.yml`

ใช้สำหรับกดรัน smoke test หลัง deploy API หรือหลังแก้ production environment

## How to run

1. Open GitHub repository
2. Go to Actions
3. Select `Smoke API`
4. Click `Run workflow`
5. Set `api_url`
6. Choose whether to run admin/member token checks
7. Run

## Required repository secrets

ใช้ได้ทั้งแบบครบ production verification หรือใส่เฉพาะ token สำหรับ smoke check

### Production env verification secrets

```txt
PROD_DATABASE_URL
PROD_JWT_ACCESS_KEY
PROD_ADMIN_JWT_ACCESS_TTL
PROD_ADMIN_REFRESH_TTL_HOURS
PROD_MEMBER_WEB_URL
PROD_ADMIN_WEB_URL
PROD_PRIVATE_MEDIA_DIR
```

### Redis / storage secrets

```txt
PROD_REDIS_URL
PROD_STORAGE_DRIVER
PROD_S3_ENDPOINT
PROD_S3_REGION
PROD_S3_BUCKET
PROD_S3_ACCESS_KEY_ID
PROD_S3_SECRET_ACCESS_KEY
PROD_S3_FORCE_PATH_STYLE
```

### Smoke token secrets

```txt
PROD_ADMIN_TOKEN
PROD_MEMBER_TOKEN
```

## Token notes

`PROD_ADMIN_TOKEN` and `PROD_MEMBER_TOKEN` are short-lived access tokens. If they expire, the token checks will fail even if the API is healthy.

For quick post-deploy checks:

1. Login as admin
2. Copy current access token from browser storage/devtools
3. Update `PROD_ADMIN_TOKEN`
4. Run workflow

Same idea for member token.

## What it runs

The workflow runs:

```bash
scripts/verify-production-env.sh
scripts/smoke-api.sh
```

Smoke checks cover:

- public health/version
- protected admin endpoints without token
- protected member endpoints without token
- admin pagination endpoints with token
- admin security/session endpoint with token
- member wallet/topup/withdrawal endpoints with token

## Expected result

The workflow should finish green with:

```txt
Smoke result: <n> passed, 0 failed
```

If token checks fail because a token expired, refresh the token secret and rerun the workflow.

## Safe behavior

The smoke workflow avoids business operations that change money balances or request statuses. It is intended for post-deploy confidence checks, not full end-to-end financial testing.
