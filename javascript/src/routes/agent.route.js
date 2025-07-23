import express from "express";
import {
  createAgent,
  updateAgent,
  deleteAgent,
} from "../controllers/agent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  createAgentSchema,
  updateAgentSchema,
} from "../validation/agent.validation.js";

const router = express.Router();

// router.use(protectRoute);

router.post("/create", validateRequest(createAgentSchema), createAgent);
router.put("/update", validateRequest(updateAgentSchema), updateAgent);
router.delete("/delete", deleteAgent);

export default router;
