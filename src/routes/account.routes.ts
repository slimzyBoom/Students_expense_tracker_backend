import { Router } from "express";
import * as c from "../controllers/account.controller";
// import { validateBody } from "../middlewares/validate.middleware";
// import { accountSchema } from "../validations/account.validation";
const r = Router();
r.get("/", c.getMyAccounts);
// r.post("/", validateBody(accountSchema), c.createAccount);
export default r;
