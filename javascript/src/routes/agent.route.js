import express from "express";
import { createAgent, deleteAgent } from "../controllers/agent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/create", createAgent);
router.post("/delete", deleteAgent);

export default router;
