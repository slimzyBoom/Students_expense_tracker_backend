import {
  Account,
  AccountModel,
  DEFAULT_ACCOUNT_KEYS,
} from "../models/account.model";
import { ClientSession, Types, QueryFilter } from "mongoose";

const defaultAccountFilter = (
  userId: Types.ObjectId,
): QueryFilter<Account> => ({
  user_id: userId,
  $or: [
    { key: DEFAULT_ACCOUNT_KEYS.CASH_WALLET },
    { key: DEFAULT_ACCOUNT_KEYS.MAIN_BANK_ACCOUNT },
    { name: "Cash Wallet", type: "CASH" },
    { name: "Main Bank Account", type: "BANK" },
  ],
});

const missingAccount = (name: string) => {
  const error = new Error(`${name} is missing`);
  (error as Error & { statusCode?: number }).statusCode = 500;
  return error;
};

export const accountService = {
  getMyAccounts: (userId: Types.ObjectId) =>
    AccountModel.find(defaultAccountFilter(userId)).sort({ created_at: 1 }),

  async setStartingBalances(
    userId: Types.ObjectId,
    input: { bank_balance?: number; cash_balance?: number },
  ) {
    const { cashWallet, mainBankAccount } = await this.getDefaults(userId);
    const ops: Promise<unknown>[] = [];

    if (input.bank_balance !== undefined) {
      ops.push(
        AccountModel.updateOne(
          { _id: mainBankAccount._id, user_id: userId },
          { $set: { current_balance: Number(input.bank_balance.toFixed(2)) } },
        ),
      );
    }

    if (input.cash_balance !== undefined) {
      ops.push(
        AccountModel.updateOne(
          { _id: cashWallet._id, user_id: userId },
          { $set: { current_balance: Number(input.cash_balance.toFixed(2)) } },
        ),
      );
    }

    await Promise.all(ops);
    return this.getMyAccounts(userId);
  },

  async getDefaults(userId: Types.ObjectId, session?: ClientSession) {
    let query = AccountModel.find(defaultAccountFilter(userId));
    if (session) query = query.session(session);
    const accounts = await query;
    const cashWallet = accounts.find(
      (account) =>
        account.key === DEFAULT_ACCOUNT_KEYS.CASH_WALLET ||
        (account.name === "Cash Wallet" && account.type === "CASH"),
    );
    const mainBankAccount = accounts.find(
      (account) =>
        account.key === DEFAULT_ACCOUNT_KEYS.MAIN_BANK_ACCOUNT ||
        (account.name === "Main Bank Account" && account.type === "BANK"),
    );
    if (!cashWallet) throw missingAccount("Cash Wallet");
    if (!mainBankAccount) throw missingAccount("Main Bank Account");
    return { cashWallet, mainBankAccount };
  },
};
