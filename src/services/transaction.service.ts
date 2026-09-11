import mongoose, { ClientSession, Types } from "mongoose";
import { AppError } from "../middlewares/error.middleware";
import { AccountModel } from "../models/account.model";
import { TransactionModel } from "../models/transaction.model";
import { accountService } from "./account.service";
import {
  CashEntryInput,
  DailyCashLogInput,
  TransactionQuery,
} from "../validations/transaction.validation";
type Input = {
  from_account_id?: Types.ObjectId | null;
  to_account_id?: Types.ObjectId | null;
  category_id?: Types.ObjectId | string | null;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  transaction_date: Date;
  raw_narrative?: string | null;
  source?: "MANUAL" | "STATEMENT_IMPORT";
  import_hash?: string | null;
};
type BalanceInput = Pick<Input, "from_account_id" | "to_account_id" | "amount">;
async function assertOwned(
  id: Types.ObjectId | undefined | null,
  userId: Types.ObjectId,
  session: ClientSession,
) {
  if (!id) return;
  if (
    !(await AccountModel.exists({ _id: id, user_id: userId }).session(session))
  ) {
    const e = new Error("Account not found");
    (e as any).statusCode = 404;
    throw e;
  }
}
async function apply(
  input: BalanceInput,
  userId: Types.ObjectId,
  sign: 1 | -1,
  session: ClientSession,
) {
  await assertOwned(input.from_account_id, userId, session);
  await assertOwned(input.to_account_id, userId, session);
  const ops = [] as Promise<unknown>[];
    if (input.from_account_id) {
    ops.push(
      AccountModel.updateOne(
        { _id: input.from_account_id, user_id: userId },
        { $inc: { current_balance: Number((-sign * input.amount).toFixed(2)) } },
        { session },
      ),
    );
  }
  
  // Increment destination account (Income or Transfer -> Destination)
  if (input.to_account_id) {
    ops.push(
      AccountModel.updateOne(
        { _id: input.to_account_id, user_id: userId },
        { $inc: { current_balance: Number((sign * input.amount).toFixed(2)) } },
        { session },
      ),
    );
  }
  await Promise.all(ops);
}

const hasId = (
  value: Types.ObjectId | string | null | undefined,
  id: Types.ObjectId,
) => value != null && String(value) === String(id);

function assertManualCashTransaction(
  input: Input,
  cashWalletId: Types.ObjectId,
) {
  if (input.type === "TRANSFER")
    throw new AppError("Transfers cannot be recorded manually", 403);
  if (input.type === "INCOME") {
    if (input.from_account_id || !hasId(input.to_account_id, cashWalletId))
      throw new AppError("Manual income must be recorded in Cash Wallet", 403);
    return;
  }
  if (input.to_account_id || !hasId(input.from_account_id, cashWalletId))
    throw new AppError(
      "Manual expenses must be recorded from Cash Wallet",
      403,
    );
}

async function createInSession(
  userId: Types.ObjectId,
  input: Input,
  session: ClientSession,
) {
  await apply(input, userId, 1, session);
  const result = await TransactionModel.create(
    [{ user_id: userId, ...input }],
    { session },
  );
  return result[0];
}

export const transactionService = {
  async create(userId: Types.ObjectId, input: Input) {
    const s = await mongoose.startSession();
    try {
      let result;
      await s.withTransaction(async () => {
        const { cashWallet, mainBankAccount } =
          await accountService.getDefaults(userId, s);
        const transaction = { ...input, source: input.source ?? "MANUAL" };
        if (transaction.source === "MANUAL") {
          assertManualCashTransaction(transaction, cashWallet._id);
        } else if (transaction.type === "INCOME") {
          transaction.from_account_id = null;
          transaction.to_account_id = mainBankAccount._id;
        } else if (transaction.type === "EXPENSE") {
          transaction.from_account_id = mainBankAccount._id;
          transaction.to_account_id = null;
        } else {
          transaction.from_account_id = mainBankAccount._id;
          transaction.to_account_id = cashWallet._id;
        }
        result = await createInSession(userId, transaction, s);
      });
      return result;
    } finally {
      await s.endSession();
    }
  },

  async createCashEntry(userId: Types.ObjectId, input: CashEntryInput) {
    const { cashWallet } = await accountService.getDefaults(userId);
    return this.create(userId, {
      ...input,
      from_account_id: input.type === "EXPENSE" ? cashWallet._id : null,
      to_account_id: input.type === "INCOME" ? cashWallet._id : null,
      source: "MANUAL",
    });
  },

  async createDailyCashLog(userId: Types.ObjectId, input: DailyCashLogInput) {
    const s = await mongoose.startSession();
    try {
      let created: Awaited<ReturnType<typeof TransactionModel.create>> = [];
      await s.withTransaction(async () => {
        const { cashWallet } = await accountService.getDefaults(userId, s);
        const entries: Input[] = input.entries.map((entry) => ({
          ...entry,
          type: "EXPENSE",
          from_account_id: cashWallet._id,
          to_account_id: null,
          source: "MANUAL",
        }));
        created = await TransactionModel.create(
          entries.map((entry) => ({ user_id: userId, ...entry })),
          { session: s },
        );
        for (const entry of entries) await apply(entry, userId, 1, s);
      });
      return created;
    } finally {
      await s.endSession();
    }
  },

  async update(userId: Types.ObjectId, id: Types.ObjectId, input: Input) {
    const s = await mongoose.startSession();
    try {
      let updated;
      await s.withTransaction(async () => {
        const old = await TransactionModel.findOne({
          _id: id,
          user_id: userId,
        }).session(s);
        if (!old) {
          const e = new Error("Transaction not found");
          (e as any).statusCode = 404;
          throw e;
        }
        if (old.source !== "MANUAL")
          throw new AppError(
            "Imported bank transactions cannot be edited manually",
            403,
          );
        const { cashWallet } = await accountService.getDefaults(userId, s);
        assertManualCashTransaction(input, cashWallet._id);
        await apply(old.toObject(), userId, -1, s);
        await apply(input, userId, 1, s);
        updated = await TransactionModel.findOneAndUpdate(
          { _id: id, user_id: userId },
          input,
          { new: true, session: s },
        );
      });
      return updated;
    } finally {
      await s.endSession();
    }
  },
  async remove(userId: Types.ObjectId, id: Types.ObjectId) {
    const s = await mongoose.startSession();
    try {
      await s.withTransaction(async () => {
        const old = await TransactionModel.findOne({
          _id: id,
          user_id: userId,
        }).session(s);
        if (!old) {
          const e = new Error("Transaction not found");
          (e as any).statusCode = 404;
          throw e;
        }
        if (old.source !== "MANUAL")
          throw new AppError("Imported bank transactions cannot be deleted manually", 403);
        const { cashWallet } = await accountService.getDefaults(userId, s);
        assertManualCashTransaction(old.toObject(), cashWallet._id);
        await apply(old.toObject(), userId, -1, s);
        await old.deleteOne({ session: s });
      });
    } finally {
      await s.endSession();
    }
  },
  async list(userId: Types.ObjectId, q: TransactionQuery) {
    const filter: any = { user_id: userId };
    if (q.type) filter.type = q.type;
    if (q.categoryId) filter.category_id = q.categoryId;
    if (q.startDate || q.endDate)
      filter.transaction_date = {
        $gte: q.startDate ?? new Date(0),
        $lte: q.endDate ?? new Date("9999-12-31"),
      };
    const [items, total] = await Promise.all([
      TransactionModel.find(filter)
        .sort({ transaction_date: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .populate("category_id", "name color_code"),
      TransactionModel.countDocuments(filter),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  },
};
