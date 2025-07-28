import express from "express";
import {
  createAgent,
  unfreezeAgent,
  updateAgent,
  deleteAgent,
  getAgentsByUser,
  getAgentById,
} from "../controllers/agent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  createAgentSchema,
  updateAgentSchema,
} from "../validation/agent.validation.js";

import { createSubSchema } from "../validation/subscription.validation.js";

const router = express.Router();

// router.use(protectRoute);

router.post("/", validateRequest(createAgentSchema), createAgent);
router.post("/unfreeze", validateRequest(createSubSchema), unfreezeAgent);
router.get("/getByUser/:clerkId", getAgentsByUser);
router.get("/:apiId/:clerkId", getAgentById);
router.put("/", validateRequest(updateAgentSchema), updateAgent);
router.delete("/", deleteAgent);

export default router;
