export const navGroups = [
  { title: 'Overview', items: [['Dashboard', '/dashboard'], ['Finance', '/finance']] },
  { title: 'Queues', items: [['Top-ups', '/topups'], ['Withdrawals', '/withdrawals']] },
  { title: 'Money', items: [['Wallets', '/wallets'], ['Ledgers', '/ledgers'], ['Reports', '/reports'], ['Risk Alerts', '/risk-alerts']] },
  { title: 'Operations', items: [['Members', '/members'], ['Bank Accounts', '/bank-accounts'], ['Activity', '/activity'], ['Settings', '/settings']] },
  { title: 'Security', items: [['Access Control', '/access']] },
] as const;
