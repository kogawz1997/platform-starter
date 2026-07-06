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

### Website Settings

- Site identity: website name, logo, favicon
- Public contact settings: support phone, email, social links
- Member web settings: maintenance mode, registration toggle, login toggle
- Admin web settings: dashboard display settings, security notice text
- Theme settings: primary color, secondary color, default language
- SEO defaults: title, description, keywords, Open Graph image
- Legal pages config: terms URL, privacy URL, responsible-use notice
- Announcement banner: message, active window, target page
- Feature flags: enable or disable features per environment
- Admin settings page with RBAC permission
- Audit log for every website setting change

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
