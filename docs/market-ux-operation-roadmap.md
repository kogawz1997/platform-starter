# Market UX and Operation Roadmap

This document tracks product improvements that make the platform easier to use for members, easier to operate for admins, and closer to real market workflows.

## Goals

- Make member flows obvious on mobile: deposit, withdraw, game lobby, play, transfer, history.
- Make admin flows action-first: what needs review, what failed, what is risky, what is offline.
- Keep money operations auditable: every balance change must be explainable through ledger, transfer, webhook, reconciliation, and audit logs.
- Keep provider integration safe: test adapters before real money, gate risky features, and avoid exposing secrets.

## Phase 1: Usability and Operation Basics

### Member UX

- [ ] Improve member home with clear available balance, pending status, latest activity, quick actions, featured games, recently played games, and promotion/banner slots.
- [ ] Add game lobby categories: slots, casino, sports, fishing, popular, new, provider filter, search, favorites, and maintenance state.
- [ ] Improve game session page with wallet balance, provider/game balance when available, amount quick buttons, transfer in, transfer out, transfer status, rollback notice, transfer history, return-to-game, and close-session action.
- [ ] Improve deposit flow as a guided step flow: amount, channel, transfer instruction, slip upload, submit, and pending review.
- [ ] Improve withdraw flow as a guided step flow: selected bank account, amount, review, confirm, and pending status.
- [ ] Add unified transaction history for deposit, withdraw, transfer-in, transfer-out, adjustment, bonus, and reversal.
- [ ] Add member notifications for approved deposit, approved withdraw, rejected withdraw, successful transfer, failed transfer with rollback, and pending review.
- [ ] Improve account/security pages: profile, phone, bank accounts, password change, login history, logout all devices, and account status.

### Admin UX

- [ ] Add an operation dashboard that answers what needs attention now: pending deposits, pending withdrawals, failed game transfers, open risk alerts, invalid webhooks, reconciliation mismatches, provider offline, today's volume, and new members.
- [ ] Improve deposit queue with review slip, approve, reject, note, member history, wallet, bank account, filters, and reviewer tracking.
- [ ] Improve withdraw queue with approve, reject, note, member history, wallet, bank account, filters, and reviewer tracking.
- [ ] Polish Money Control Center to combine wallet overview, wallet ledger, deposit/withdraw status, game transfers, failed transfers, rollback, risk alerts, and reconciliation mismatch.
- [ ] Add wallet ledger detail page at `/admin/wallet-ledgers/[id]` with before/amount/after, reference, idempotency key, metadata, related transfer/deposit/withdraw, and audit timeline.
- [ ] Add admin sidebar/navigation groups for Operation, Money, Game Platform, Risk/Security, Catalog, and Settings.

## Phase 2: Provider and Money Safety

### Provider Setup

- [ ] Upgrade Provider Setup Wizard to a real step flow: choose preset, provider profile, endpoints/base URL, credentials, preview, create, preflight.
- [ ] Add Provider Preset preview/edit before apply: endpoint list, editable paths, enable/disable endpoints, required credentials, provider code duplicate validation, and metadata gate preview.
- [ ] Add Adapter Test Harness at `/admin/provider-test` to test provider methods one by one.
- [ ] Adapter Test Harness should support: healthCheck, launchGame, getBalance, transferIn, transferOut, syncGames, validateWebhook, and parseWebhook.
- [ ] Adapter Test Harness should display sanitized request, sanitized response, latency, status, errorCode, errorMessage, and signature status.
- [ ] Improve Provider Risk/Readiness into traffic-light states: READY, DRY_RUN_ONLY, NEEDS_REVIEW, BLOCKED.
- [ ] Provider readiness checklist should show adapter registered, provider active, credential complete, endpoint complete, wallet sync enabled, transfer enabled, webhook settlement state, latest reconciliation state, and unresolved risk alerts.
- [ ] Add quick-fix links from provider readiness to endpoints, credentials, preflight, reconcile, and gate settings.

### Credential Management

- [ ] Add credential rotate action.
- [ ] Add credential disable action.
- [ ] Track credential last used at.
- [ ] Track credential last rotated at.
- [ ] Warn when credentials still use placeholders such as `TODO_API_KEY`, `TODO_SECRET_KEY`, or `TODO_WEBHOOK_SECRET`.
- [ ] Add credential test action where safe.
- [ ] Audit all credential create/update/disable/rotate actions.
- [ ] Never return raw secrets to frontend; frontend should only see masked values and status metadata.

### Transfer, Ledger, Reconciliation

- [ ] Improve game transfer detail with retry, manual reverse, force failed, mark reviewed, admin note, related wallet ledger, and rollback ledger.
- [ ] Add safety blockers for retry/reverse when wallet state is unsafe.
- [ ] Require admin note and audit log for manual reverse, force failed, and real-money transfer recovery actions.
- [ ] Add reconciliation snapshot detail page with compare against WalletLedger/GameTransfer, related RiskAlert, resolve note, reviewer, and timeline.
- [ ] Auto-resolve related risk alert when a reconciliation snapshot is resolved.
- [ ] Improve Risk Alert workflow with assignee, note timeline, related transfer/ledger/webhook links, severity filters, status filters, type filters, and safe bulk actions for low-risk alerts.
- [ ] Add idempotency dashboard for transfer idempotency keys, webhook idempotency keys, ledger idempotency keys, and duplicate attempts.

## Phase 3: Webhook and Incident Operations

### Webhook Center

- [ ] Add webhook detail page.
- [ ] Add safe webhook replay/test action.
- [ ] Add parse test action.
- [ ] Add signature test action.
- [ ] Add duplicate webhook view.
- [ ] Add invalid signature view.
- [ ] Add webhook settlement readiness view.
- [ ] Add mock webhook generator for BET_SETTLED, WIN, ROLLBACK, duplicate, invalid signature, and delayed webhook scenarios.
- [ ] Keep real settlement behind explicit gates until staging validation passes.

### Monitoring and Alerts

- [ ] Alert admins when transfer failures exceed threshold.
- [ ] Alert admins when webhook invalid signatures exceed threshold.
- [ ] Alert admins when provider is offline or degraded.
- [ ] Alert admins when reconciliation mismatch is created.
- [ ] Alert admins when withdrawal is pending longer than threshold.
- [ ] Alert admins when deposit is pending longer than threshold.
- [ ] Alert admins when real-money gates are enabled.

### Security and Permissions

- [ ] Add granular permissions: `deposit.approve`, `withdraw.approve`, `wallet.view`, `wallet.adjust`, `game.provider.manage`, `game.transfer.retry`, `game.transfer.reverse`, `risk.resolve`, `credential.rotate`, `webhook.replay`, `real_money.enable`.
- [ ] Add rate limits for login, transfer, withdraw request, webhook request size, and sensitive admin actions.
- [ ] Ensure audit logs exist for admin login, deposit approve/reject, withdraw approve/reject, wallet mutation, transfer retry, transfer reverse, mismatch resolve, provider edit, endpoint edit, credential edit, realMoneyEnabled gate changes, and webhookSettlementEnabled gate changes.
- [ ] Add incident playbooks for provider outage, wallet mismatch, credential leak, failed deployment, and database restore.

## Phase 4: Market-like Product Features

### Promotions and Bonus

- [ ] Add bonus wallet.
- [ ] Add promotion campaign management.
- [ ] Add turnover requirement tracking.
- [ ] Add member bonus claim flow.
- [ ] Add bonus history.
- [ ] Add admin bonus approval/reject flow.

### Affiliate and Agent

- [ ] Add agent code.
- [ ] Add referral link.
- [ ] Add commission tracking.
- [ ] Add downline view.
- [ ] Add agent report.
- [ ] Add agent settlement workflow.

### CMS and Content

- [ ] Add mobile banner management.
- [ ] Add announcement management.
- [ ] Add popup management.
- [ ] Add maintenance notice management.
- [ ] Add game category ordering.
- [ ] Add featured games management.

### KYC and Risk

- [ ] Add phone verification.
- [ ] Add bank account verification.
- [ ] Add duplicate bank detection.
- [ ] Add account risk status.
- [ ] Add user blacklist.

### Customer Support

- [ ] Add support ticket flow.
- [ ] Add live chat or LINE contact config.
- [ ] Add FAQ/content page.
- [ ] Add deposit/withdraw issue templates.

## Recommended Next Implementation Order

1. Adapter Test Harness.
2. Admin Operation Dashboard.
3. Member Game Session UX polish.
4. Wallet Ledger Detail page.
5. Provider Setup Wizard v2.
6. Provider Preset preview/edit before apply.
7. Admin Sidebar Navigation.
8. Game Transfer retry/reverse workflow.
9. Reconciliation detail workflow.
10. Credential Management production actions.
11. Webhook Center test mode.
12. Risk Alert workflow expansion.
13. Promotion/Bonus.
14. Affiliate/Agent.
15. CMS Banner/Popup.
16. KYC/Bank verification.
17. Support Ticket/LINE contact.

## Notes

- Work that requires real provider documents should stay outside this roadmap until the provider gives API docs, UAT endpoints, credentials, signature rules, webhook format, and IP whitelist requirements.
- Generic transfer wallet and simulator providers should be used to build and validate workflows before real-money integration.
- Real money, webhook settlement, manual reverse, and credential rotation must remain behind permission and audit controls.
