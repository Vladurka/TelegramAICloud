import { Router } from "express";
import {
  createSubscription,
  cancelSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router.post("/create", createSubscription);
router.post("/cancel", cancelSubscription);

export default router;
