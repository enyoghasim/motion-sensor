import { QueryKey } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getQueryClient } from "../services/query-client";
import { ApiResponse } from "../types/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function handleApiError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const apiMessage = error.response?.data?.message;

    if (apiMessage) return new Error(apiMessage);

    if (error.message) return new Error(error.message);
  }

  return new Error("Something went wrong. Please try again later.");
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
