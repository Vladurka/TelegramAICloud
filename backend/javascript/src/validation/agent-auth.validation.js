import { z } from "zod";

export const sendCodeSchema = z.object({
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),
  apiHash: z.string().min(20, "apiHash is required"),
  phone: z.string(),
});

export const confirmCodeSchema = z.object({
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),
  apiHash: z.string().min(20, "apiHash is required"),
  phone: z.string(),
  session: z.string().min(200, "session is required"),
  phoneCodeHash: z.string().min(15, "phoneCodeHash is required"),
  code: z
    .number()
    .min(10000, "code must be a 5-digit number")
    .max(99999, "code must be a 5-digit number"),
  password: z.string().optional(),
});
