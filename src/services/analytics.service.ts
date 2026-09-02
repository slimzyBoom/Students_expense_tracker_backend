import dayjs from "dayjs";
import { TransactionModel } from "../models/transaction.model";
import { Types } from "mongoose";
const dates = (month: string) => ({
  $gte: dayjs(`${month}-01`).startOf("month").toDate(),
  $lte: dayjs(`${month}-01`).endOf("month").toDate(),
});

export const analyticsService = {
  async summary(userId: Types.ObjectId, month: string) {
    const r = await TransactionModel.aggregate([
      {
        $match: {
          user_id: userId,
          transaction_date: dates(month),
          type: { $ne: "TRANSFER" },
        },
      },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]);
    const income = r.find((x) => x._id === "INCOME")?.total ?? 0,
      expense = r.find((x) => x._id === "EXPENSE")?.total ?? 0;
    return {
      totalIncome: income,
      totalExpense: expense,
      netSavings: income - expense,
      burnRate: income ? Number(((expense / income) * 100).toFixed(2)) : 0,
    };
  },
  breakdown: (userId: Types.ObjectId, month: string) =>
    TransactionModel.aggregate([
      {
        $match: {
          user_id: userId,
          type: "EXPENSE",
          transaction_date: dates(month),
        },
      },
      { $group: { _id: "$category_id", amount: { $sum: "$amount" } } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          items: {
            $push: {
              category_id: "$_id",
              name: "$category.name",
              color_code: "$category.color_code",
              amount: "$amount",
            },
          },
        },
      },
      { $unwind: "$items" },
      {
        $project: {
          _id: 0,
          category_id: "$items.category_id",
          name: { $ifNull: ["$items.name", "Uncategorized"] },
          color_code: "$items.color_code",
          amount: "$items.amount",
          percentage: {
            $multiply: [{ $divide: ["$items.amount", "$total"] }, 100],
          },
        },
      },
    ]),
  trends: (userId: Types.ObjectId, startDate: Date, endDate: Date) =>
    TransactionModel.aggregate([
      {
        $match: {
          user_id: userId,
          type: { $ne: "TRANSFER" },
          transaction_date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$transaction_date" },
            },
            type: "$type",
          },
          amount: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          income: {
            $sum: { $cond: [{ $eq: ["$_id.type", "INCOME"] }, "$amount", 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ["$_id.type", "EXPENSE"] }, "$amount", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
};
