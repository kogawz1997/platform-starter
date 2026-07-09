export const navGroups = [
  { title: 'Overview', items: [['Dashboard', '/dashboard'], ['Finance', '/finance']] },
  { title: 'Queues', items: [['Top-ups', '/topups'], ['Withdrawals', '/withdrawals']] },
  { title: 'Money', items: [['Wallets', '/wallets'], ['Ledgers', '/ledgers'], ['Reports', '/reports'], ['Risk Alerts', '/risk-alerts']] },
  { title: 'Game Platform', items: [['Game Providers', '/game-providers'], ['Provider Risk', '/provider-risk'], ['Game API Settings', '/game-api-settings'], ['Game Catalog', '/games'], ['Game Sessions', '/game-sessions'], ['Game Transfers', '/game-transfers'], ['Reconciliation', '/provider-wallet-snapshots'], ['Webhook Logs', '/webhook-logs'], ['Provider Adapters', '/provider-adapters']] },
  { title: 'Operations', items: [['Members', '/members'], ['Bank Accounts', '/bank-accounts'], ['Activity', '/activity'], ['Settings', '/settings']] },
  { title: 'Security', items: [['Access Control', '/access'], ['Admin 2FA', '/security'], ['Audit Logs', '/audit']] },
] as const;
