export const AUTH_ENDPOINTS = {
  login: '/auth/signin',
  register: '/auth/signup',
  logout: '/auth/signout',
  otpRequest: '/auth/otp/request',
  otpVerify: '/auth/otp/verify',
  changePassword: '/auth/change-password',
  resetPasswordRequest: '/auth/reset-password/request',
  resetPasswordVerify: '/auth/reset-password/verify',
} as const;

export const USER_ENDPOINTS = {
  me: '/user/me',
} as const;
