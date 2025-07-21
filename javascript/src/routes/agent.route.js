import express from "express";
import { createAgent, deleteAgent } from "../controllers/agent.controller.js";

const router = express.Router();

router.post("/create", createAgent);
router.post("/delete", deleteAgent);

export default router;
