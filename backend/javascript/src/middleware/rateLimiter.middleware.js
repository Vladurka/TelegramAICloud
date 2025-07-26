import { redis } from "../lib/redis.js";

export const rateLimiter = async (req, res, next) => {
  try {
    const ip = req.ip;
    const key = `rate-limit:${ip}`;
    const maxRequests = 100;
    const windowSeconds = 15 * 60;

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (current > maxRequests) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    next();
  }
};
