import { Router } from "express";
import * as c from "../controllers/analytics.controller";
import { validateQuery } from "../middlewares/validate.middleware";
import { month, range } from "../validations/analytics.validation";
const r = Router();

r.get("/summary", validateQuery(month), c.summary);
r.get("/category-breakdown", validateQuery(month), c.breakdown);
r.get("/daily-trends", validateQuery(range), c.trends);
export default r;
