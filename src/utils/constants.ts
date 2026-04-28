// ==============================================
// ADMIN
// ==============================================

export const ADMIN_EMAILS = [
  'your-email@example.com', // ЗАМЕНИТЕ НА СВОЙ EMAIL
];

export const isAdmin = (email: string | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// ==============================================
// LIMITS
// ==============================================

export const FREE_TIER_LIMIT = 5;

// ==============================================
// SUBSCRIPTION PLANS
// ==============================================

export const SUBSCRIPTION_PLANS = [
  { id: '1-month', label: '1 месяц', price: 490, months: 1 },
  { id: '3-months', label: '3 месяца', price: 1290, months: 3 },
  { id: '1-year', label: '1 год', price: 4490, months: 12 }
];
