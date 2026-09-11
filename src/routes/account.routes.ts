import { Router } from "express";
import * as c from "../controllers/account.controller";
import { validateBody } from "../middlewares/validate.middleware";
import { accountUpdateSchema } from "../validations/account.validation";
const r = Router();
r.get("/", c.getMyAccounts);
r.post("/starting-balances", validateBody(accountUpdateSchema), c.setStartingBalances);
export default r;
