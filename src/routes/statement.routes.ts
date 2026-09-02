import { Router } from "express";
import * as c from "../controllers/statement.controller";
import { csvUpload } from "../middlewares/upload.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { confirmSchema } from "../validations/statement.validation";
const r = Router();
r.post("/parse", csvUpload.single("file"), c.parseStatement);
r.post("/confirm", validateBody(confirmSchema), c.confirmStatement);
export default r;
