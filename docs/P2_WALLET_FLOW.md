# P2 Wallet Flow

## Scope

P2 covers the member wallet foundation, top-up requests, withdrawal requests, ledger history, admin wallet views, and manual wallet adjustment.

## Deploy

When only API/UI code changes, deploy API, web-member, and web-admin. No database push is required.

When Prisma schema changes, deploy API and run:

```bash
pnpm db:push
```

## Member test checklist

1. Register/login member.
2. Open member home and confirm wallet balance, locked balance, deposit, withdraw, and transaction history links.
3. Create a top-up request from `/deposit` with slip attachment.
4. Create a withdrawal request from `/withdraw` with bank details.
5. Open `/transactions` and confirm DEPOSIT/CREDIT and WITHDRAWAL/DEBIT records show balance before and after.

## Admin test checklist

1. Open `/topups`, approve a pending top-up, and confirm wallet balance increases.
2. Open `/withdrawals`, complete a pending withdrawal, and confirm wallet balance decreases and locked balance clears.
3. Open `/ledgers` and filter by username, short ID, full user ID, type, and direction.
4. Open `/wallets`, search by username, short ID, or full user ID.
5. Use Manual Wallet Adjustment to CREDIT and DEBIT a wallet with a required reason.
6. Confirm every manual adjustment creates an ADJUSTMENT ledger and admin audit log.

## Safety rules

- Amount must be greater than zero.
- Manual adjustment requires a reason.
- DEBIT cannot make balance negative.
- DEBIT cannot reduce balance below locked balance.
- Reviewed top-up and withdrawal requests cannot be processed twice.

## P2 close criteria

P2 is complete when:

- Top-up flow works from member request to admin approval.
- Withdrawal flow works from member request to admin complete/reject.
- Member transaction history displays correct ledger records.
- Admin ledger and wallet pages display correct data.
- Admin can manually adjust wallet balance with ledger and audit tracking.
- The final regression test passes on Railway production services.
