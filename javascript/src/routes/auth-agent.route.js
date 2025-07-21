import express from "express";
import { sendCode, confirmCode } from "../controllers/auth-agent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/sendCode", sendCode);
router.post("/confirmCode", confirmCode);

export default router;
