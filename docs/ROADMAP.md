# ROADMAP

## Phase 0: Project Foundation

Status: started

- Monorepo structure
- Member App
- Admin App
- API Backend
- Prisma
- Docker Compose
- Project docs

## Phase 1: Auth, User, Admin

Status: completed

### Member Auth

- Register
- Login
- Refresh token
- Logout
- Forgot password
- Verify phone
- Verify email
- Device tracking
- Login history

### Admin Auth

- Admin login
- 2FA verification
- RBAC
- Permission guard
- IP whitelist
- Session timeout
- Admin audit log

### Core Tables

- users
- user_profiles
- admin_users
- roles
- permissions
- admin_user_roles
- role_permissions
- auth_sessions
- login_history
- verification_tokens
- admin_audit_logs

## Phase 2: Website Settings, Wallet, Ledger, Transaction

Status: completed

Full specification: `docs/WEBSITE_SETTINGS.md`
Wallet flow checklist: `docs/P2_WALLET_FLOW.md`

### Website Settings

Admin routes:

- /admin/settings/website
- /admin/settings/branding
- /admin/settings/theme
- /admin/settings/seo
- /admin/settings/contact
- /admin/settings/maintenance
- /admin/settings/scripts
- /admin/settings/features
- /admin/settings/legal

Backend requirements:

- site_settings key-value table
- site_setting_histories table
- Public settings APIs for safe frontend values
- Admin settings APIs
- Audit log for admin changes

### Wallet Foundation

- WalletService
- Wallet ledger
- Balance and locked balance
- Member top-up request
- Admin top-up review
- Member withdrawal request
- Admin withdrawal review
- Member transaction history
- Admin ledger explorer
- Admin wallet view
- Short member ID search
- Manual wallet adjustment
- Admin audit log for wallet actions

## Phase 3: Wallet Hardening and Operation Center

Status: next

- Finance dashboard summary
- Private media storage for slips
- Notification for review queues
- Reconciliation reports
- Export finance records
- Job lock for high-risk operations

## Phase 4: Admin Operation Center

- Dashboard
- Finance queues
- Member detail
- Risk alert
- Reports

## Phase 5: Provider and Callback

- Provider adapter
- Game launch
- Callback handling
- HMAC signature
- Idempotency
- Redis lock

## Phase 6: Promotion, Event, VIP, Referral

- Promotion engine
- Coupons
- Events
- VIP levels
- Referral commission

## Phase 7: CMS, SEO, Media

- Pages
- Articles
- Banners
- SEO meta
- Sitemap
- Media library

## Phase 8: Production

- Monitoring
- Backup
- Alerts
- Deployment
