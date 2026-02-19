import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({
      required_error: "Missing NEXT_PUBLIC_SUPABASE_URL environment variable.",
    })
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL."),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({
      required_error:
        "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.",
    })
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY must not be empty."),
});

// Validate environment variables at import time.
// This will throw a descriptive error during build/startup if any are missing.
envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
