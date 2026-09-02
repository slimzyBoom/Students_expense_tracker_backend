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
