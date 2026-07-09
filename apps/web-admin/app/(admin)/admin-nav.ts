export const navGroups = [
  { title: 'Operation', items: [['Dashboard', '/dashboard'], ['Operations', '/operations'], ['ฝากรอตรวจ', '/topups'], ['ถอนเงิน', '/withdrawals'], ['Members', '/members'], ['Bank Accounts', '/bank-accounts']] },
  { title: 'Money', items: [['Wallets', '/wallets'], ['Wallet Ledgers', '/wallet-ledgers'], ['Money Ops', '/money-ops'], ['Risk Alerts', '/risk-alerts'], ['Finance', '/finance'], ['Reports', '/reports']] },
  { title: 'Game Platform', items: [['Provider Setup', '/provider-setup-wizard'], ['Provider Presets', '/provider-presets'], ['Adapter Test', '/adapter-test'], ['Game Providers', '/game-providers'], ['Provider Risk', '/provider-risk'], ['Game API Settings', '/game-api-settings'], ['Game Catalog', '/games'], ['Game Sessions', '/game-sessions'], ['Game Transfers', '/game-transfers'], ['Reconciliation', '/reconciliation-center'], ['Webhook Settlement', '/webhook-settlement'], ['Webhook Logs', '/webhook-logs'], ['Provider Adapters', '/provider-adapters']] },
  { title: 'Risk / Security', items: [['Access Control', '/access'], ['Admin 2FA', '/security'], ['Audit Logs', '/audit-logs'], ['Activity', '/activity']] },
  { title: 'Settings', items: [['Site Settings', '/settings']] },
] as const;
