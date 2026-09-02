import { Router } from "express";
import * as c from "../controllers/transaction.controller";
import { validateQuery, validateBody, validateParams } from "../middlewares/validate.middleware";
import {
  transactionSchema,
  transactionQuery,
  idParam,
  cashEntrySchema,
  dailyCashLogSchema,
} from "../validations/transaction.validation";
const r = Router();
r.get("/", validateQuery(transactionQuery), c.listTransactions);
r.post("/cash", validateBody(cashEntrySchema), c.createCashEntry);
r.post("/cash/daily-log", validateBody(dailyCashLogSchema), c.createDailyCashLog);
r.post("/", validateBody(transactionSchema), c.createTransaction);
r.put(
  "/:id",
  validateParams(idParam),
  validateBody(transactionSchema),
  c.updateTransaction,
);
r.delete("/:id", validateParams(idParam), c.deleteTransaction);
export default r;
