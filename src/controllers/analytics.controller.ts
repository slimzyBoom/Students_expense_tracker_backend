import { RequestHandler } from "express";
import { analyticsService } from "../services/analytics.service";
import { ok } from "../utils/apiResponse";
import { RangeQuery, MonthQuery } from "../validations/analytics.validation";
export const summary: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as MonthQuery;
    ok(
      res,
      await analyticsService.summary(
        req.user!.id,
        query.month as string,
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const breakdown: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as MonthQuery;
    ok(
      res,
      await analyticsService.breakdown(
        req.user!.id,
        query.month as string,
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const trends: RequestHandler = async (req, res, next) => {
  try {
    const q  = res.locals.validatedQuery as RangeQuery;
    ok(
      res,
      await analyticsService.trends(
        req.user!.id,
        new Date(q.startDate),
        new Date(q.endDate),
      ),
    );
  } catch (e) {
    next(e);
  }
};
