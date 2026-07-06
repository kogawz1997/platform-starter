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

Website settings must be implemented before or alongside the Admin Panel foundation and must be clearly separated from money, wallet, deposit, withdraw, and provider balance settings.

Full specification: `docs/WEBSITE_SETTINGS.md`

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
- Admin settings APIs with RBAC permissions
- Audit log for every change
- Dual approval for high-risk changes
- Redis cache for public/theme/seo/maintenance/features settings

Required permission groups:

- settings.website.view / settings.website.update
- settings.branding.view / settings.branding.update
- settings.theme.view / settings.theme.update
- settings.seo.view / settings.seo.update
- settings.contact.view / settings.contact.update
- settings.maintenance.view / settings.maintenance.update
- settings.scripts.view / settings.scripts.update
- settings.features.view / settings.features.update
- settings.legal.view / settings.legal.update

Dual approval required for:

- Enable/disable deposit
- Enable/disable withdraw
- Enable full-site maintenance
- Update custom scripts
- Update domain settings
- Update provider feature flags
- Enable/disable registration

### Wallet Foundation

- WalletService
- Ledger
- Transaction log
- Lock balance
- Rollback
- Reconciliation

## Phase 3: Deposit and Withdraw

- Manual deposit
- Manual withdraw
- Admin queue
- Job lock
- Slip private media
- Notification

## Phase 4: Admin Operation Center

- Dashboard
- Finance queues
- Member detail
- Risk alert
- Reports

## Phase 5: Provider and Callback

- Provider adapter
- Game launch
- Bet / win / refund callback
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
