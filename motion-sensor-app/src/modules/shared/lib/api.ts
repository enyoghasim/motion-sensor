import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  clearAuthSession,
  getAccessToken,
} from "../../auth/services/auth-storage";
import { AUTH_ENDPOINTS } from "../../auth/services/auth.endpoints";
import { DEVICE_ENDPOINTS } from "../../devices/services/device.endpoints";
import { env } from "./env";

const api = axios.create({
  baseURL: env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

function shouldSkipTokenRefresh(url?: string) {
  return (
    !url ||
    url.includes(AUTH_ENDPOINTS.login) ||
    url.includes(AUTH_ENDPOINTS.logout) ||
    url.includes(AUTH_ENDPOINTS.register) ||
    // claim/start and claim/finish 401 to mean "this device's signature is
    // invalid" (a business-logic failure of the device claim, checked in
    // DeviceService), not "your session is invalid" -- don't sign the user
    // out over a bad device pairing attempt.
    url.includes(DEVICE_ENDPOINTS.claimStart) ||
    url.includes(DEVICE_ENDPOINTS.claimFinish)
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
  async (response) => {
    //  mimic network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return response;
  },
  async (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      !shouldSkipTokenRefresh(error.config?.url)
    ) {
      clearAuthSession();
    }

    return Promise.reject(error);
  },
);

export default api;
