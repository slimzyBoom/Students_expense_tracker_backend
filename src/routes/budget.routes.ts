import { Router } from "express";
import * as c from "../controllers/budget.controller";
import { validateBody, validateQuery } from "../middlewares/validate.middleware";
import { budgetSchema, monthQuery } from "../validations/budget.validation";
const r = Router();
r.get("/", validateQuery(monthQuery), c.getBudgets);
r.post("/", validateBody(budgetSchema), c.upsertBudget);
export default r;
