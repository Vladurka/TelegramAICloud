import { z } from "zod";

const allowedModels = [
  "gpt-3.5-turbo",
  "gpt-4o",
  "gpt-4o-mini",
  "o4-mini",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
];

export const createAgentSchema = z.object({
  clerkId: z.string().min(25).max(40).startsWith("user_"),
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),

  apiHash: z.string().min(30).max(40),
  sessionString: z.string().min(200).max(400),
  prompt: z.string().min(1).max(1000),

  typingTime: z.number().min(0).max(10).default(0).optional(),
  reactionTime: z.number().min(0).max(120).default(0).optional(),

  model: z.enum(allowedModels).default(allowedModels[0]).optional(),

  name: z.string().min(1).max(40),
  planType: z.enum(["month", "year"]),
});

export const updateAgentSchema = z.object({
  clerkId: z.string().min(5, "clerkId is required"),
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),

  name: z.string().min(1, "Name is required").optional(),
  prompt: z.string().min(1, "Prompt is required").optional(),
  typingTime: z.coerce.number().min(0, "typingTime must be ≥ 0").optional(),
  reactionTime: z.coerce.number().min(0, "reactionTime must be ≥ 0").optional(),
  model: z
    .enum(allowedModels, {
      message: `Model must be one of: ${allowedModels.join(", ")}`,
    })
    .optional(),
});
