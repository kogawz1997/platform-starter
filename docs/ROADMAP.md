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

Status: completed core flow, UI polish completed in Phase 3.5

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

- Member login page UI polish
- Member register page UI polish
- Admin login page UI polish
- Auth form validation states
- Loading states during login/register
- Error states with clear Thai messages
- Success states after register/login
- Redirect after member login
- Redirect after admin login
- Mobile responsive auth pages
- Password visibility toggle
- Consistent member branding from Website Settings

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

Status: in progress, operation center first pass expanded

- Finance dashboard summary: completed
- Reconciliation reports: completed first pass
- Export finance records: completed first pass
- Job lock for high-risk operations: completed first pass
- Private media storage for slips: first pass completed
- Notification for review queues: queue summary endpoint completed

### ABC hardening pass

- A: top-up review guards, withdrawal review guards, and manual adjustment idempotency from admin UI completed
- B: reports include queue counters, reconciliation checked count, and exports shortcut completed
- C: top-up and withdrawal review UX now removes reviewed pending items and hides duplicate action buttons completed

### Parallel operation pass

- Private Slip Storage: member uploads slips to a private server path and admin loads slips through a guarded endpoint completed first pass
- Queue Badge: admin drawer/topbar now uses /admin/queues/summary completed
- Operation Dashboard: /dashboard aggregates wallet totals, finance queues, and recent ledgers completed first pass
- Activity History: /activity and /admin/operations/history completed first pass

## Phase 3.5: UX/UI Polish

Status: completed after production mobile regression test

### Auth Pages

- Member login page final design: completed
- Member register page final design: completed
- Admin login page final design: completed
- Admin OTP/2FA page final design: first pass completed
- Mobile-first form layout: completed
- Clear Thai labels and helper text: completed
- Loading / disabled submit button: completed
- Error alert for wrong credentials: completed
- Error alert for validation failure: completed
- Success feedback after register/login: completed
- Redirect UX after login: completed
- Password visibility toggle: completed

### Member UX/UI

- Member home layout polish: completed
- Wallet card polish: completed
- Deposit page polish: completed
- Withdraw page polish: completed
- Transactions page polish: completed
- Mobile responsive layout: completed
- Empty states: completed first pass
- Error states: completed first pass
- Shared dark market-style visual direction: completed

### Admin UX/UI

- Admin layout/sidebar: completed
- Operation dashboard first pass: completed
- Finance dashboard polish: completed
- Top-up review page polish: completed
- Withdrawal review page polish: completed
- Wallets page polish: completed
- Ledgers page polish: completed
- Reports page polish: completed
- Activity page first pass: completed
- Exports page first pass: completed
- Settings hub polish: completed
- Tables, filters, badges, and action buttons: completed first pass
- Better spacing, cards, and typography: completed
- Shared dark market-style visual direction: completed

### Design System

- Button baseline: completed
- Input baseline: completed
- Card baseline: completed
- Badge baseline: completed
- Alert/notice baseline: completed
- Loading/empty state baseline: completed
- Shared colors, radius, spacing, and typography: completed

## Phase 4: Admin Operation Center

Status: started

- Dashboard: first pass completed
- Finance queues: first pass completed
- Member detail
- Risk alert
- Reports: first pass completed
- Audit log viewer: first pass completed as Activity
- Admin activity history: first pass completed

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
- Error logging
- Security review
- Deployment checklist
- Runbook
