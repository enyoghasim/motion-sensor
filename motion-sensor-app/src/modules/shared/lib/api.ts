import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  clearAuthSession,
  getAccessToken,
} from '../../auth/services/auth-storage';
import { AUTH_ENDPOINTS } from '../../auth/services/auth.endpoints';

// Use environment variable or fallback to localhost (for iOS simulator)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

function resolveApiBaseUrl() {
  return API_URL;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

function shouldSkipTokenRefresh(url?: string) {
  return (
    !url ||
    url.includes(AUTH_ENDPOINTS.login) ||
    url.includes(AUTH_ENDPOINTS.logout) ||
    url.includes(AUTH_ENDPOINTS.register)
  );
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      !shouldSkipTokenRefresh(error.config?.url)
    ) {
      clearAuthSession();
    }

    return Promise.reject(error);
  }
);

export default api;
