import express from "express";
import { sendCode, confirmCode } from "../controllers/authAgent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  sendCodeSchema,
  confirmCodeSchema,
} from "../validation/agent-auth.validation.js";

const router = express.Router();

// router.use(protectRoute);

router.post("/sendCode", validateRequest(sendCodeSchema), sendCode);
router.post("/confirmCode", validateRequest(confirmCodeSchema), confirmCode);

export default router;
