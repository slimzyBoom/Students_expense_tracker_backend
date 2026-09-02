import { RequestHandler } from "express";
import { CategoryModel } from "../models/category.model";
import { CategoryRuleModel } from "../models/categoryRule.model";
import { TransactionIdParam } from "../validations/transaction.validation";
import { ok } from "../utils/apiResponse";
type CategoryInput = {
  name: string;
  type: "INCOME" | "EXPENSE";
  color_code?: string;
};
type RuleInput = {
  keyword: string;
  category_id?: string | null;
  target_type: "INCOME" | "EXPENSE" | "TRANSFER";
  priority?: number;
};
export const listCategories: RequestHandler = async (req, res, next) => {
  try {
    ok(
      res,
      await CategoryModel.find({
        $or: [{ user_id: req.user!.id }, { user_id: null }],
      }).sort({ name: 1 }),
    );
  } catch (e) {
    next(e);
  }
};
export const createCategory: RequestHandler = async (req, res, next) => {
  try {
    ok(
      res,
      await CategoryModel.create({
        user_id: req.user!.id,
        ...(req.body as CategoryInput),
      }),
      201,
    );
  } catch (e) {
    next(e);
  }
};
export const listRules: RequestHandler = async (req, res, next) => {
  try {
    ok(
      res,
      await CategoryRuleModel.find({ user_id: req.user!.id }).populate(
        "category_id",
        "name",
      ),
    );
  } catch (e) {
    next(e);
  }
};
export const createRule: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as RuleInput;
    if (body.category_id) {
      const category = await CategoryModel.findOne({
        _id: body.category_id,
        $or: [{ user_id: req.user!.id }, { user_id: null }],
      });
      if (!category) {
        res
          .status(400)
          .json({ success: false, message: "Invalid category_id" });
        return;
      }
    }
    ok(
      res,
      await CategoryRuleModel.create({
        user_id: req.user!.id,
        ...(req.body as RuleInput),
      }),
      201,
    );
  } catch (e) {
    next(e);
  }
};
export const deleteRule: RequestHandler = async (req, res, next) => {
  try {
    const params = res.locals.validatedParams as TransactionIdParam;
    const x = await CategoryRuleModel.findOneAndDelete({
      _id: params.id,
      user_id: req.user!.id,
    });
    if (!x) {
      res.status(404).json({ success: false, message: "Rule not found" });
      return;
    }

    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
