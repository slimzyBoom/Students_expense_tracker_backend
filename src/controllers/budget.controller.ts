import { RequestHandler } from "express";
import { budgetService } from "../services/budget.service";
import { BudgetInput, MonthQuery } from "../validations/budget.validation";
import { ok } from "../utils/apiResponse";
export const getBudgets: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as MonthQuery;
    ok(
      res,
      await budgetService.list(
        req.user!.id,
        query.month as string,
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const upsertBudget: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as BudgetInput;
    ok(
      res,
      await budgetService.upsert(
        req.user!.id,
        body
      ),
      201
    );
  } catch (e) {
    next(e);
  }
};
