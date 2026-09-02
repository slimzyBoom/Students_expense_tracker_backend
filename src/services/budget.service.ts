import dayjs from "dayjs";
import { BudgetModel } from "../models/budget.model";
import { Types } from "mongoose";
export const budgetService = {
  async list(userId: Types.ObjectId, month: string) {
    const start = dayjs(`${month}-01`).startOf("month").toDate(),
      end = dayjs(start).endOf("month").toDate();
    return BudgetModel.aggregate([
      {
        $match: {
          user_id: userId,
          month_year: month,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "transactions",
          let: { c: "$category_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$user_id", userId],
                    },
                    { $eq: ["$category_id", "$$c"] },
                    { $eq: ["$type", "EXPENSE"] },
                    { $gte: ["$transaction_date", start] },
                    { $lte: ["$transaction_date", end] },
                  ],
                },
              },
            },
            { $group: { _id: null, spent: { $sum: "$amount" } } },
          ],
          as: "usage",
        },
      },
      {
        $project: {
          monthly_limit: 1,
          month_year: 1,
          category: 1,
          spent: { $ifNull: [{ $arrayElemAt: ["$usage.spent", 0] }, 0] },
        },
      },
      {
        $addFields: {
          percentage: {
            $cond: [
              { $gt: ["$monthly_limit", 0] },
              { $multiply: [{ $divide: ["$spent", "$monthly_limit"] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          state: {
            $switch: {
              branches: [
                { case: { $gte: ["$percentage", 100] }, then: "Exceeded" },
                { case: { $gte: ["$percentage", 80] }, then: "Warning" },
              ],
              default: "Safe",
            },
          },
        },
      },
    ]);
  },
  upsert: (userId: Types.ObjectId, input: any) =>
    BudgetModel.findOneAndUpdate(
      {
        user_id: userId,
        category_id: input.category_id,
        month_year: input.month_year,
      },
      { $set: { monthly_limit: input.monthly_limit } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
};
