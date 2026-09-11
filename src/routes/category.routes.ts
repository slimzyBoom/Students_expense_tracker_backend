import { Router } from "express";
import * as c from "../controllers/category.controller";
import { validateBody, validateParams } from "../middlewares/validate.middleware";
import { category, rule } from "../validations/catergory.validation";
import { idParam } from "../validations/transaction.validation";
const r = Router();

r.get("/", c.listCategories);
r.post("/", validateBody(category), c.createCategory);
r.get("/rules", c.listRules);
r.post("/rules", validateBody(rule), c.createRule);
r.delete("/rules/:id", validateParams(idParam), c.deleteRule);
export default r;
