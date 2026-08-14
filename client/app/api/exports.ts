
// Auth
export * from './hooks/useAuth';
export { authEndpoints } from './endpoints/auth';

// Billboards
export * from './hooks/useBillboards';
export { billboardEndpoints } from './endpoints/billboards';

// Users
export * from './hooks/useUsers';
export { userEndpoints } from './endpoints/users';

// Payments
export * from './hooks/usePayments';
export { paymentEndpoints } from './endpoints/payments';

// Reviews
export * from './hooks/useReviews';
export { reviewEndpoints } from './endpoints/reviews';

// Uploads
export * from './hooks/useUploads';
export { uploadEndpoints } from './endpoints/uploads';

// Admin
export * from './hooks/useAdmin';
export { adminEndpoints } from './endpoints/admin';

// Config
export * from './hooks/useConfig';
export { configEndpoints } from './endpoints/config';

// Main client and token manager
export { default as apiClient, tokenManager } from './index';
