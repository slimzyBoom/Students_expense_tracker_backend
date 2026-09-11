import { RequestHandler } from "express";
import { accountService } from "../services/account.service";
import { ok } from "../utils/apiResponse";
export const getMyAccounts: RequestHandler = async (req, res, next) => {
  try {
    ok(res, await accountService.getMyAccounts(req.user!.id));
  } catch (e) {
    next(e);
  }
};

export const setStartingBalances: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as { bank_balance?: number; cash_balance?: number };
    ok(res, await accountService.setStartingBalances(req.user!.id, body));
  } catch (e) {
    next(e);
  }
}
