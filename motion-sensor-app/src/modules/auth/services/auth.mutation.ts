import { useMutation } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { AUTH_ENDPOINTS } from './auth.endpoints';
import { clearAuthSession, setAuthSession } from './auth-storage';
import { queryClient, buildMutationOptions } from '../../shared/services/query-client';
import { userKeys } from '../../shared/services/query-keys';
import { LoginValues, RegisterValues } from '../validations/auth';

export const useLoginMutation = () => {
  return useMutation(
    buildMutationOptions(userKeys.all, {
      mutationFn: async (values: LoginValues) => {
        const { data } = await api.post(AUTH_ENDPOINTS.login, {
          email: values.email,
          password: values.password,
        });
        setAuthSession(data);
        return data;
      },
    })
  );
};

export const useRegisterMutation = () => {
  return useMutation(
    buildMutationOptions(userKeys.all, {
      mutationFn: async (values: RegisterValues) => {
        const { data } = await api.post(AUTH_ENDPOINTS.register, {
          email: values.email,
          password: values.password,
          name: values.name,
        });
        setAuthSession(data);
        return data;
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
