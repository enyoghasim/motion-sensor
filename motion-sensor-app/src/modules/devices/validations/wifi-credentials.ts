import { z } from "zod";

// Buffer sizes must stay under the firmware's WiFiCredentials struct
// (ssid[32], password[64], both null-terminated) in storage_manager.h.
export const wifiCredentialsSchema = z.object({
  ssid: z
    .string()
    .min(1, "Enter the network name")
    .max(31, "Network name is too long"),
  password: z.string().max(63, "Password is too long"),
});

export type WifiCredentialsValues = z.infer<typeof wifiCredentialsSchema>;
