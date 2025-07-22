import express from "express";
import {
  createOrUpdateAgent,
  deleteAgent,
} from "../controllers/agent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// router.use(protectRoute);

router.post("/create", createOrUpdateAgent);
router.post("/delete", deleteAgent);

export default router;
