# ROADMAP

## Phase 0: Project Foundation

Status: completed

- Monorepo structure
- Member App
- Admin App
- API Backend
- Prisma
- Docker Compose
- Project docs

## Phase 1: Auth, User, Admin

Status: completed core flow, UI polish scheduled in Phase 3.5

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

### Auth UX/UI follow-up

These items must be completed before the authentication experience is considered production-ready for real users.

- Member login page UI polish
- Member register page UI polish
- Admin login page UI polish
- Auth form validation states
- Loading states during login/register
- Error states with clear Thai messages
- Success states after register/login
- Remember session behavior check
- Redirect after member login
- Redirect after admin login
- Mobile responsive auth pages
- Password visibility toggle
- Consistent branding from Website Settings

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

Status: in progress

- Finance dashboard summary
- Private media storage for slips
- Notification for review queues
- Reconciliation reports
- Export finance records
- Job lock for high-risk operations

## Phase 3.5: UX/UI Polish

Status: planned after Finance Summary baseline

### Auth Pages

- Member login page final design
- Member register page final design
- Admin login page final design
- Admin OTP/2FA page final design
- Real login/register usable flow verification
- Mobile-first form layout
- Clear Thai labels and helper text
- Loading spinner / disabled submit button
- Error alert for wrong credentials
- Error alert for validation failure
- Success feedback after register
- Redirect UX after login
- Brand logo, site name, and colors from settings

### Member UX/UI

- Member home layout polish
- Wallet card polish
- Deposit page polish
- Withdraw page polish
- Transactions page polish
- Mobile responsive layout
- Empty states
- Error states
- Toast notifications
- Confirmation modals

### Admin UX/UI

- Admin layout/sidebar
- Finance dashboard polish
- Top-up review page polish
- Withdrawal review page polish
- Wallets page polish
- Ledgers page polish
- Settings hub polish
- Tables, filters, badges, and action buttons
- Confirmation modal for approve/reject/adjust actions
- Better spacing, cards, and typography

### Design System

- Button component
- Input component
- Card component
- Table component
- Badge component
- Alert component
- Modal component
- Loading component
- Empty state component
- Shared colors, radius, spacing, and typography

## Phase 4: Admin Operation Center

- Dashboard
- Finance queues
- Member detail
- Risk alert
- Reports
- Audit log viewer
- Admin activity history

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
- Security review
- Rate limit
- Production runbook
