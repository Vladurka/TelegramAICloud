import { z } from "zod";

const allowedModels = [
  "gpt-4o",
  "gpt-4o-mini",
  "o3",
  "o4-mini",
  "o4-mini-high",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4.5",
];

export const createAgentSchema = z.object({
  clerkId: z.string().min(5, "clerkId is required"),
  apiId: z
    .number()
    .min(10000000, "apiId must be at least 8 digits")
    .max(99999999, "apiId must be at most 8 digits"),

  apiHash: z.string().min(20, "apiHash is required"),
  sessionString: z.string().min(200, "sessionString is required"),
  prompt: z.string().min(1, "Prompt is required"),

  typingTime: z.number().min(0, "typingTime must be ≥ 0").default(0).optional(),
  reactionTime: z
    .number()
    .min(0, "reactionTime must be ≥ 0")
    .default(0)
    .optional(),

  model: z
    .enum(allowedModels, {
      message: `Model must be one of: ${allowedModels.join(", ")}`,
    })
    .default(allowedModels[0])
    .optional(),

  name: z.string().min(1, "Name is required"),
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
