import express from "express";
import { sendCode, confirmCode } from "../controllers/auth-agent.controller.js";

const router = express.Router();

router.post("/sendCode", sendCode);
router.post("/confirmCode", confirmCode);

export default router;
