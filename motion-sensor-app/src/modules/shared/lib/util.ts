import { QueryKey } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getQueryClient } from "../services/query-client";
import { ApiResponse } from "../types/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export class ApiError extends Error {
  errors: string | string[];

  constructor(errors: string | string[]) {
    super(Array.isArray(errors) ? errors.join(", ") : errors);
    this.name = "ApiError";
    this.errors = errors;
  }
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse | undefined;

    if (data?.errors && data.errors.length > 0) {
      return new ApiError(data.errors.map((err) => err.message));
    }

    if (data?.message) return new ApiError(data.message);

    if (error.message) return new ApiError(error.message);
  }

  // Non-Axios errors (e.g. BleError from react-native-ble-plx during device
  // pairing/provisioning) still carry a useful .message -- surface it
  // instead of always falling back to the fully generic string below.
  if (error instanceof Error && error.message) {
    return new ApiError(error.message);
  }

  return new ApiError("Something went wrong. Please try again later.");
}

export function validateApiResponse<T>(response: ApiResponse<T>): T {
  if (!response || !response.success) {
    throw new Error(response.message || "An error occurred");
  }
  return response.data as T;
}

export async function updateItemOptimistically<T>(
  queryKey: QueryKey,
  resolver: (old: T) => T,
) {
  const queryClient = getQueryClient();
  await queryClient.cancelQueries({ queryKey });
  const old = queryClient.getQueryData(queryKey) as T;
  const newValue = resolver(old);
  queryClient.setQueryData(queryKey, newValue);
  return { old, new: newValue };
}
