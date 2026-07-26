import { useMutation } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { ApiError, handleApiError, validateApiResponse } from '../../shared/lib/util';
import { AUTH_ENDPOINTS } from './auth.endpoints';
import { clearAuthSession, setAuthSession } from './auth-storage';
import { queryClient, buildMutationOptions } from '../../shared/services/query-client';
import { userKeys } from '../../shared/services/query-keys';
import { ForgotPasswordValues, LoginValues, RegisterValues } from '../validations/auth';
import { User } from '../types';
import { router } from 'expo-router';

type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export const useLoginMutation = () => {
  return useMutation<AuthResponse, ApiError, LoginValues>({
    mutationFn: async (values: LoginValues) => {
      try {
        const { data } = await api.post(AUTH_ENDPOINTS.login, {
          email: values.email,
          password: values.password,
        });
        const authData = validateApiResponse<AuthResponse>(data);
        setAuthSession(data);
        queryClient.setQueryData(userKeys.detail('me'), authData.user);
        router.replace("/(app)/(tabs)")
        return authData;
      } catch (error) {
        throw handleApiError(error);
      }
    },
  });
};

export const useRegisterMutation = () => {
  return useMutation<AuthResponse, ApiError, RegisterValues>({
    mutationFn: async (values: RegisterValues) => {
      try {
        const { data } = await api.post(AUTH_ENDPOINTS.register, {
          email: values.email,
          password: values.password,
          name: values.name,
        });
        const authData = validateApiResponse<AuthResponse>(data);
        setAuthSession(data);
        queryClient.setQueryData(userKeys.detail('me'), authData.user);
        router.replace("/(app)/(tabs)")
        return authData;
      } catch (error) {
        throw handleApiError(error);
      }
    },
  });
};

export const useRequestPasswordResetMutation = () => {
  return useMutation<{ request_id: string }, ApiError, ForgotPasswordValues>({
    mutationFn: async (values) => {
      try {
        const { data } = await api.post(AUTH_ENDPOINTS.resetPasswordRequest, values);
        return validateApiResponse<{ request_id: string }>(data);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  });
};

type VerifyPasswordResetValues = {
  requestId: string;
  otp: string;
  newPassword: string;
};

export const useVerifyPasswordResetMutation = () => {
  return useMutation<null, ApiError, VerifyPasswordResetValues>({
    mutationFn: async (values) => {
      try {
        const { data } = await api.post(AUTH_ENDPOINTS.resetPasswordVerify, {
          request_id: values.requestId,
          otp: values.otp,
          new_password: values.newPassword,
        });
        return validateApiResponse<null>(data);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  });
};

export const useRequestEmailVerificationMutation = () => {
  return useMutation<null, ApiError, void>({
    mutationFn: async () => {
      try {
        const { data } = await api.post(AUTH_ENDPOINTS.otpRequest, {
          scope: 'email_verification',
        });
        return validateApiResponse<null>(data);
      } catch (error) {
        throw handleApiError(error);
      }
    },
  });
};

export const useVerifyEmailMutation = () => {
  return useMutation<null, ApiError, string>(
    buildMutationOptions(userKeys.all, {
      mutationFn: async (otp: string) => {
        try {
          const { data } = await api.post(AUTH_ENDPOINTS.otpVerify, {
            otp,
            scope: 'email_verification',
          });
          return validateApiResponse<null>(data);
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};

export const useChangeEmailMutation = () => {
  return useMutation<null, ApiError, string>(
    buildMutationOptions(userKeys.all, {
      mutationFn: async (email: string) => {
        try {
          const { data } = await api.post(AUTH_ENDPOINTS.changeEmail, { email });
          return validateApiResponse<null>(data);
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};

export const useLogoutMutation = () => {
  return useMutation(
    buildMutationOptions(userKeys.all, {
      mutationFn: async () => {
        try {
          await api.post(AUTH_ENDPOINTS.logout);
        } catch (error) {
          // Ignore error
        }
        clearAuthSession();
      },
      onError: () => {
        clearAuthSession();
      },
    })
  );
};
