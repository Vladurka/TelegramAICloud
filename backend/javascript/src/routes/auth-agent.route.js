import express from "express";
import {
  sendCode,
  confirmCode,
  getTempData,
} from "../controllers/authAgent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  sendCodeSchema,
  confirmCodeSchema,
} from "../validation/agent-auth.validation.js";

const router = express.Router();

router.post("/sendCode", validateRequest(sendCodeSchema), sendCode);
router.post("/confirmCode", validateRequest(confirmCodeSchema), confirmCode);
router.get("/:clerkId", getTempData);

export default router;
