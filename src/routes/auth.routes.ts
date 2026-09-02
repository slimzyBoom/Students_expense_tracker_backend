import { Router } from "express";
import * as c from "../controllers/auth.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { authRateLimiter } from "../middlewares/rateLimiter.middleware";
import { registerSchema, loginSchema } from "../validations/auth.validation";
import { authenticate } from "../middlewares/auth.middleware";
const r = Router();
r.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  c.register,
);
r.post("/login", authRateLimiter, validateBody(loginSchema), c.login);
r.post("/refresh-token", authRateLimiter, c.refresh);
r.post("/logout", c.logout);
r.get("/me", authenticate, c.me);
export default r;
