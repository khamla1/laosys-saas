import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(64, "NEXTAUTH_SECRET must be at least 64 characters long"),
  JWT_SECRET: z.string().min(64, "JWT_SECRET must be at least 64 characters long").optional(),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    // process.exit(1) works in Node, but might fail in Edge/browser builds if imported.
    // However, this will primarily be imported by prisma.ts which is server-side only.
    if (typeof process !== "undefined" && process.exit) {
        process.exit(1); 
    } else {
        throw new Error("Invalid environment variables");
    }
  }

  const dbUrl = parsed.data.DATABASE_URL;
  
  // MongoDB Security Check
  try {
    const url = new URL(dbUrl);
    
    // Check if public IP or 0.0.0.0
    const publicIPRegex = /^(?!10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|localhost).+/;
    
    if (url.hostname === "0.0.0.0" || (url.hostname && publicIPRegex.test(url.hostname))) {
      console.error("⚠️ WARNING: MongoDB is configured to use a public IP or 0.0.0.0.");
      console.error("⚠️ This is a severe security risk. Please use localhost or an internal network IP.");
    }
  } catch (e) {
    // If URL parsing fails, it might be a weird connection string, just ignore for now
  }

  return parsed.data;
}

// Call immediately when imported in a server environment
if (typeof window === 'undefined') {
  validateEnv();
}
