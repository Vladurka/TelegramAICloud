import { z } from "zod";

export const createSubSchema = z.object({
  clerkId: z.string().min(5, "clerkId is required"),
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),
  planType: z.enum(["month", "year"]),
});
