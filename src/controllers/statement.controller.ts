import { RequestHandler } from "express";
import { ok } from "../utils/apiResponse";
import { parserService } from "../services/parser.service";
import { ConfirmInput } from "../validations/statement.validation";
import { AppError } from "../middlewares/error.middleware";
import { insertRules } from "../controllers/category.controller";
export const parseStatement: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }
    ok(res, await parserService.parse(req.user!.id, req.file.buffer));
  } catch (e) {
    next(e);
  }
};
export const confirmStatement: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as ConfirmInput;
    const created = await parserService.importStatement(req.user!.id, body.items);
    if (body.rules.length) await insertRules(body.rules, req.user!.id);
    ok(res, { created: created, transactions: created }, 201);
  } catch (e) {
    next(e);
  }
};
