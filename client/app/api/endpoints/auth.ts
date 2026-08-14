import apiClient from '../index';
import type {
  ApiResponse,
  AuthResponse,
  User,
  UserCreateInput,
  UserLogin,
  PasswordResetRequest,
  PasswordReset,
  EmailVerificationRequest,
} from '@/lib/types';

const toSnakeCase = (data: UserCreateInput) => {
  const nameParts = data.fullName?.trim().split(/\s+/) || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  return {
    email: data.email,
    password: data.password,
    first_name: firstName,
    last_name: lastName,
    phone_number: data.phone || '',
    user_type: data.userType,
    company_name: data.companyName,
  };
};

const toCamelCase = (data: any): User => ({
  id: data.id,
  email: data.email,
  fullName: `${data.first_name} ${data.last_name}`.trim(),
  phone: data.phone_number,
  userType: data.user_type,
  companyName: data.company_name,
  bio: data.bio,
  profileImage: data.profile_image,
  isVerified: data.is_verified,
  emailVerified: data.email_verified || false,
  kycStatus: data.kyc_status || 'pending',
  needsEmailVerification: data.needs_email_verification || false,
  needsKyc: data.needs_kyc || false,
  canListBillboards: data.can_list_billboards !== undefined ? data.can_list_billboards : true,
  kycUnderReview: data.kyc_under_review || false,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const transformAuthResponse = (data: any): AuthResponse => ({
  user: toCamelCase(data.user),
  tokens: {
    accessToken: data.tokens.access_token,
    refreshToken: data.tokens.refresh_token,
    tokenType: data.tokens.token_type,
  },
});

export const authEndpoints = {
  register: async (data: UserCreateInput): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/register', toSnakeCase(data));
    return { ...response.data, data: transformAuthResponse(response.data.data) };
  },

  login: async (credentials: UserLogin): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/login', credentials);
    return { ...response.data, data: transformAuthResponse(response.data.data) };
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    return (await apiClient.post('/auth/logout')).data;
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<{ tokens: AuthResponse['tokens'] }>> => {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    const tokens = response.data.data.tokens;
    return {
      ...response.data,
      data: {
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: tokens.token_type,
        },
      },
    };
  },

  requestPasswordReset: async (data: PasswordResetRequest): Promise<ApiResponse<{ message: string }>> => {
    return (await apiClient.post('/auth/forgot-password', data)).data;
  },

  resetPassword: async (data: PasswordReset): Promise<ApiResponse<{ message: string }>> => {
    return (await apiClient.post('/auth/reset-password', {
      token: data.token,
      new_password: data.newPassword,
    })).data;
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/users/me');
    return { ...response.data, data: toCamelCase(response.data.data) };
  },

  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    return (await apiClient.post(`/auth/verify-email?token=${token}`)).data;
  },

  resendVerification: async (data: EmailVerificationRequest): Promise<ApiResponse<{ message: string }>> => {
    return (await apiClient.post('/auth/resend-verification', data)).data;
  },
};
