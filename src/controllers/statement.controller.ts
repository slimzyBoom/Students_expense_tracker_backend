import { RequestHandler } from "express";
import { transactionService } from "../services/transaction.service";
import { CategoryRuleModel } from "../models/categoryRule.model";
import { ok } from "../utils/apiResponse";
import { parserService } from "../services/parser.service";
import { ConfirmInput } from "../validations/statement.validation";
export const parseStatement: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      const e = new Error("CSV file is required");
      (e as any).statusCode = 400;
      throw e;
    }
    ok(res, await parserService.parse(req.user!.id, req.file.buffer));
  } catch (e) {
    next(e);
  }
};
export const confirmStatement: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as ConfirmInput;
    const created = [];
    for (const item of body.items) {
      try {
        created.push(
          await transactionService.create(req.user!.id, {
            ...item,
            source: "STATEMENT_IMPORT",
          }),
        );
      } catch (e: any) {
        if (e.code !== 11000) throw e;
      }
    }
    if (body.rules.length)
      await CategoryRuleModel.insertMany(
        body.rules.map((r) => ({
          ...r,
          user_id: req.user!.id,
          keyword: r.keyword.toLowerCase(),
        })),
        { ordered: false },
      );
    ok(res, { created: created.length, transactions: created }, 201);
  } catch (e) {
    next(e);
  }
};
