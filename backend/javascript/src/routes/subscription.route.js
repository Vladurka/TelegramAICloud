import { Router } from "express";
import {
  createSubscription,
  cancelSubscription,
} from "../controllers/subscription.controller.js";

import { validateRequest } from "../middleware/validation.middleware.js";
import { createSubSchema } from "../validation/subscription.validation.js";

const router = Router();

router.post("/create", validateRequest(createSubSchema), createSubscription);
router.post("/cancel", cancelSubscription);

export default router;
