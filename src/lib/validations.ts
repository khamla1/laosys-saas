import { z } from "zod";

// Password requires at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").max(50),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: passwordSchema,
});

// Example generic user update schema
export const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone format").optional(),
});
