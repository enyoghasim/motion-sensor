import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth_access_token';

export function setAccessToken(token: string) {
  SecureStore.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  try {
    return SecureStore.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    return null;
  }
}

export function clearAuthSession() {
  SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

// In some cases we might want to store user data (non-sensitive) securely or in AsyncStorage.
export function setAuthSession(authResponse: any, rememberMe: boolean = true) {
  if (authResponse?.data?.access_token) {
    setAccessToken(authResponse.data.access_token);
  }
  // Store user info if returned
}
