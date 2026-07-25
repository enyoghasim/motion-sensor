import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z
    .string({
      message: "EXPO_PUBLIC_API_URL must be a valid string",
    })
    .url("EXPO_PUBLIC_API_URL must be a valid URL"),
});

type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
  try {
    return envSchema.parse({
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = error.issues
        .map((err) => `  ❌ ${err.path.join(".")}: ${err.message}`)
        .join("\n");

      throw new Error(
        `\n⚠️  Environment validation failed:\n\n${formatted}\n\nPlease check your .env.local file.\n`,
      );
    }
    throw error;
  }
};

export const env = parseEnv();
