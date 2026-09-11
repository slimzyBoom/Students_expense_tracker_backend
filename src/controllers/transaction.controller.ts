import { RequestHandler } from "express";
import { transactionService } from "../services/transaction.service";
import {
  CashEntryInput,
  DailyCashLogInput,
  TransactionIdParam,
  TransactionQuery,
} from "../validations/transaction.validation";
import { ok } from "../utils/apiResponse";
import { Types } from "mongoose";

export const listTransactions: RequestHandler = async (req, res, next) => {
  try {
    const query = res.locals.validatedQuery as TransactionQuery;
    ok(
      res,
      await transactionService.list(
        req.user!.id,
        query,
      ),
    );
  } catch (e) {
    next(e);
  }
};

export const createCashEntry: RequestHandler = async (req, res, next) => {
  try {
    ok(
      res,
      await transactionService.createCashEntry(
        req.user!.id,
        req.body as CashEntryInput,
      ),
      201,
    );
  } catch (e) {
    next(e);
  }
};
export const createDailyCashLog: RequestHandler = async (req, res, next) => {
  try {
    ok(
      res,
      await transactionService.createDailyCashLog(
        req.user!.id,
        req.body as DailyCashLogInput,
      ),
      201,
    );
  } catch (e) {
    next(e);
  }
};
export const updateTransaction: RequestHandler= async (req, res, next) => {
  try {
    const params = res.locals.validatedParams as TransactionIdParam;
    ok(
      res,
      await transactionService.update(
        req.user!.id,
        new Types.ObjectId(params.id),
        req.body,
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const deleteTransaction: RequestHandler = async (req, res, next) => {
  try {
    const params = res.locals.validatedParams as TransactionIdParam;
    await transactionService.remove(req.user!.id, new Types.ObjectId(params.id));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
