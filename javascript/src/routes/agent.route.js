import express from "express";
import {
  createAgent,
  updateAgent,
  deleteAgent,
} from "../controllers/agent.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// router.use(protectRoute);

router.post("/create", createAgent);
router.put("/update", updateAgent);
router.delete("/delete", deleteAgent);

export default router;
