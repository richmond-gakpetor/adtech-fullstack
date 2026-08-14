/**
 * Axios API Client with Interceptors
 * Handles authentication, token refresh, and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// ============= Axios Instance =============

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ============= Token Management =============

const AUTH_STORAGE_KEY = 'xposure_auth_tokens';

export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Backward compatible: accept both snake_case and camelCase.
      return parsed?.access_token ?? parsed?.accessToken ?? null;
    } catch {
      return null;
    }
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Backward compatible: accept both snake_case and camelCase.
      return parsed?.refresh_token ?? parsed?.refreshToken ?? null;
    } catch {
      return null;
    }
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    // Guard against storing invalid tokens; this causes refresh/login loops on reload.
    if (!accessToken || !refreshToken) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    );
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
};

// ============= Request Interceptor =============

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============= Response Interceptor =============

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        // No refresh token, clear auth and redirect
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        // Attempt token refresh
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        // Accept multiple response shapes defensively.
        const tokens =
          (response.data as any)?.data?.tokens ??
          (response.data as any)?.tokens ??
          (response.data as any)?.data;

        const access_token = tokens?.access_token ?? tokens?.accessToken;
        const new_refresh_token = tokens?.refresh_token ?? tokens?.refreshToken;

        if (!access_token || !new_refresh_token) {
          throw new Error('Token refresh response missing tokens');
        }

        tokenManager.setTokens(access_token, new_refresh_token);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        processQueue(null, access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;
        
        tokenManager.clearTokens();
        
        if (typeof window !== 'undefined') {
          toast.error('Session expired. Please login again.');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    handleApiError(error);
    return Promise.reject(error);
  }
);

// ============= Error Handler =============

/**
 * Format validation errors from FastAPI (Pydantic)
 * Returns a readable error message string
 */
const formatValidationErrors = (detail: any): string => {
  if (Array.isArray(detail)) {
    // FastAPI validation errors: array of {type, loc, msg, input}
    return detail
      .map((err) => {
        const field = err.loc?.join('.') || 'field';
        return `${field}: ${err.msg}`;
      })
      .join(', ');
  }
  
  if (typeof detail === 'object' && detail !== null) {
    // Single validation error object
    if (detail.msg) return detail.msg;
    if (detail.message) return detail.message;
    return JSON.stringify(detail);
  }
  
  return String(detail);
};

const handleApiError = (error: AxiosError<any>) => {
  if (typeof window === 'undefined') return;

  const status = error.response?.status;
  const data = error.response?.data;

  // Don't show toast for 401 (handled by interceptor)
  if (status === 401) return;

  // Network errors
  if (!error.response) {
    toast.error('Network error. Please check your connection.');
    return;
  }

  // Extract error message
  let message: string;
  
  if (data?.detail) {
    // Handle FastAPI validation errors or detail messages
    message = formatValidationErrors(data.detail);
  } else if (data?.message) {
    message = data.message;
  } else {
    message = error.message || 'Something went wrong';
  }

  // 4xx errors
  if (status && status >= 400 && status < 500) {
    toast.error(message || 'Request failed');
    return;
  }

  // 5xx errors
  if (status && status >= 500) {
    toast.error('Server error. Please try again later.');
    return;
  }

  // Generic error
  toast.error(message);
};

// ============= Exports =============

export default apiClient;
