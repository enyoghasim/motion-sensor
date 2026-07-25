import { useMutation } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { ApiError, handleApiError, validateApiResponse } from '../../shared/lib/util';
import { AUTH_ENDPOINTS } from './auth.endpoints';
import { clearAuthSession, setAuthSession } from './auth-storage';
import { queryClient, buildMutationOptions } from '../../shared/services/query-client';
import { userKeys } from '../../shared/services/query-keys';
import { ForgotPasswordValues, LoginValues, RegisterValues } from '../validations/auth';
import { router } from 'expo-router';

export const useLoginMutation = () => {
  return useMutation(
    buildMutationOptions(userKeys.all, {
      mutationFn: async (values: LoginValues) => {
        try {
          const { data } = await api.post(AUTH_ENDPOINTS.login, {
            email: values.email,
            password: values.password,
          });
          setAuthSession(data);
          router.replace("/(app)/(spaces)")
          return data;
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};

export const useRegisterMutation = () => {
  return useMutation(
    buildMutationOptions(userKeys.all, {
      mutationFn: async (values: RegisterValues) => {
        try {
          const { data } = await api.post(AUTH_ENDPOINTS.register, {
            email: values.email,
            password: values.password,
            name: values.name,
          });
          setAuthSession(data);
          router.replace("/(app)/(spaces)")
          return data;
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
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
