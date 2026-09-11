import { parse as csv } from "csv-parse";
import { Readable } from "stream";
import { AppError } from "../middlewares/error.middleware";
import dayjs from "dayjs";
import { normalizeNarrative } from "../utils/csvSanitizer";
import { sha256 } from "../utils/hashGenerator";
import { TransactionModel, TransactionType } from "../models/transaction.model";
import { CategoryRuleModel } from "../models/categoryRule.model";
import { UserModel } from "../models/user.model";
import { AccountModel } from "../models/account.model";
import { accountService } from "./account.service";
import { Types } from "mongoose";
import mongoose from "mongoose";

// interface Candidates {
//   transaction_date: string;
//   amount: number;
//   raw_narrative: string;
//   type: "INCOME" | "EXPENSE" | "TRANSFER";
//   category_id: Types.ObjectId | null;
//   import_hash: string;
//   pre_registration?: boolean;
//   duplicate?: boolean;
// }

interface ItemsType {
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  transaction_date: Date;
  raw_narrative: string;
  import_hash: string;
  category_id?: string | null | undefined;
}

const cleanHeader = (header: string) =>
  header
    .toLowerCase()
    .replace(/[\(₦$€£\)\.]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Extracts field value using multiple potential column aliases
const getFieldByAliases = (row: Record<string, string>, aliases: string[]) => {
  for (const key of Object.keys(row)) {
    const cleanedKey = cleanHeader(key);
    if (aliases.some((alias) => cleanedKey === alias || cleanedKey.includes(alias))) {
      const val = row[key];
      if (val && val.trim() !== "" && val.trim() !== "--" && val.trim() !== "-") {
        return val.trim();
      }
    }
  }
  return undefined;
};

// Strips currency symbols (₦, $, €, £), commas, and double dashes
const numberFrom = (value: string | undefined) => {
  if (!value || value === "--" || value === "-") return NaN;
  const normalized = value.replace(/[^0-9.-]/g, "");
  return Number(normalized);
};

const isCashWithdrawal = (narrative: string) =>
  /(atm|pos).*(cash\s*)?withdraw|cash\s*withdraw.*(atm|pos)|atm\s*cash|pos\s*cash/i.test(
    narrative,
  );

// Checks if a row is the real transaction table header row
const isHeaderRow = (cells: string[]) => {
  const cleaned = cells.map(cleanHeader);
  const hasDate = cleaned.some((c) => c.includes("date") || c === "time");
  const hasDescription = cleaned.some(
    (c) =>
      c.includes("desc") ||
      c.includes("narrat") ||
      c.includes("remark") ||
      c.includes("particular") ||
      c.includes("detail") ||
      c.includes("memo"),
  );
  const hasAmount = cleaned.some(
    (c) =>
      c.includes("debit") ||
      c.includes("credit") ||
      c.includes("amount") ||
      c.includes("withdrawal") ||
      c.includes("deposit"),
  );

  return hasDate && (hasDescription || hasAmount);
};


export const parserService = {
  // Parses a CSV buffer and returns an array of candidate transactions with duplicate flags
 async parse(userId: Types.ObjectId, buffer: Buffer) {
    const rawRows: string[][] = [];

    // 1. Parse raw CSV stream into rows
    await new Promise<void>((resolve, reject) =>
      Readable.from(buffer)
        .pipe(
          csv({
            bom: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
          }),
        )
        .on("data", (row: string[]) => rawRows.push(row))
        .on("end", resolve)
        .on("error", (error) => {
          console.error("CSV parsing failed:", error);
          reject(new AppError("Failed to parse CSV file", 400));
        }),
    );

    // 2. Locate the real table header row (skipping metadata lines)
    let headerIndex = rawRows.findIndex((row) => isHeaderRow(row));
    if (headerIndex === -1) {
      headerIndex = 0; // Fallback to first line if clean CSV
    }

    const headers = rawRows[headerIndex] ?? [];
    const dataRows = rawRows.slice(headerIndex + 1);

    // Map raw data rows to objects
    const rows: Record<string, string>[] = [];
    for (const rawRow of dataRows) {
      if (rawRow.every((cell) => !cell || !cell.trim())) continue; // Skip empty rows

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) rowObj[h] = rawRow[idx] || "";
      });
      rows.push(rowObj);
    }



    // 3. Fetch user registration date and category rules in parallel
    const [user, rules] = await Promise.all([
      UserModel.findById(userId).select("created_at").lean(),
      CategoryRuleModel.find({
        $or: [{ user_id: userId }, { user_id: null }],
      })
        .sort({ priority: -1 })
        .lean(),
    ]);

    const registrationDate = dayjs(user?.created_at ?? 0).startOf("day");

    // 4. Process transaction rows in memory (up to 1,000 items)
    const candidates = [];
    const hashes: string[] = [];

    for (const row of rows.slice(0, 1000)) {
      const narrative = normalizeNarrative(
        getFieldByAliases(row, [
          "description",
          "narrative",
          "details",
          "remarks",
          "particulars",
          "memo",
          "transaction description",
        ]),
      );

      const directAmount = numberFrom(getFieldByAliases(row, ["amount", "txn amount"]));
      const debit = numberFrom(getFieldByAliases(row, ["debit", "withdrawal", "money out", "paid out"]));
      const credit = numberFrom(getFieldByAliases(row, ["credit", "deposit", "money in", "paid in"]));

      let amount = NaN;
      if (Number.isFinite(directAmount) && directAmount !== 0) {
        amount = directAmount;
      } else if (Number.isFinite(debit) && debit > 0) {
        amount = -Math.abs(debit);
      } else if (Number.isFinite(credit) && credit > 0) {
        amount = Math.abs(credit);
      }

      const dateStr = getFieldByAliases(row, [
        "trans date",
        "transaction date",
        "date",
        "value date",
        "post date",
        "posting date",
        "time",
      ]);

      const date = dayjs(dateStr);

      if (
        !narrative ||
        !Number.isFinite(amount) ||
        amount === 0 ||
        !date.isValid()
      ) {
        continue;
      }

      const isPreRegistration = date.isBefore(registrationDate);

      // Rule matching
      const rule = rules.find((r) =>
        narrative.toLowerCase().includes(r.keyword),
      );

      const type =
        rule?.target_type ??
        (isCashWithdrawal(narrative)
          ? "TRANSFER"
          : amount < 0
            ? "EXPENSE"
            : "INCOME");

      const hash = sha256(
        `${userId}|${date.toISOString()}|${Math.abs(amount).toFixed(2)}|${narrative.toLowerCase()}`,
      );

      hashes.push(hash);
      candidates.push({
        transaction_date: date.toISOString(),
        amount: Math.abs(amount),
        raw_narrative: narrative,
        type,
        category_id: rule?.category_id ?? null,
        import_hash: hash,
        pre_registration: isPreRegistration,
      });
    }

    // 5. Batch duplicate check in 1 query
    const existingTransactions = await TransactionModel.find({
      user_id: userId,
      import_hash: { $in: hashes },
    })
      .select("import_hash")
      .lean();

    const duplicateSet = new Set(existingTransactions.map((t) => t.import_hash));

    return candidates.map((item) => ({
      ...item,
      duplicate: duplicateSet.has(item.import_hash),
    }));
  },

  async importStatement(
    userId: Types.ObjectId,
    items: ItemsType[],
  ): Promise<number> {
    if (!items.length)
      throw new AppError("No valid transactions to import", 400);

    const session = await mongoose.startSession();
    try {
      const returnedTransactions = await session.withTransaction(async () => {
        const { cashWallet, mainBankAccount } =
          await accountService.getDefaults(userId, session);

        let bankDelta = 0;
        let cashDelta = 0;

        // 1. Prepare transactions & calculate net balance changes in memory
        const prepared: TransactionType[] = items.map((item) => {
          let from_account_id: Types.ObjectId | null = null;
          let to_account_id: Types.ObjectId | null = null;

          if (item.type === "INCOME") {
            to_account_id = mainBankAccount._id;
            bankDelta += item.amount;
          } else if (item.type === "EXPENSE") {
            from_account_id = mainBankAccount._id;
            bankDelta -= item.amount;
          } else {
            // ATM / Transfer (Bank -> Cash)
            from_account_id = mainBankAccount._id;
            to_account_id = cashWallet._id;
            bankDelta -= item.amount;
            cashDelta += item.amount;
          }

          return {
            user_id: userId,
            from_account_id,
            to_account_id,
            category_id: item.category_id
              ? new Types.ObjectId(String(item.category_id))
              : null,
            amount: item.amount,
            type: item.type,
            transaction_date: item.transaction_date,
            raw_narrative: item.raw_narrative,
            source: "STATEMENT_IMPORT",
            import_hash: item.import_hash,
          };
        });

        // 2. Single batch update for Main Bank Account balance
        if (bankDelta !== 0) {
          await AccountModel.updateOne(
            { _id: mainBankAccount._id, user_id: userId },
            { $inc: { current_balance: Number(bankDelta.toFixed(2)) } },
            { session },
          );
        }

        // 3. Single batch update for Cash Wallet (if any ATM transfers occurred)
        if (cashDelta !== 0) {
          await AccountModel.updateOne(
            { _id: cashWallet._id, user_id: userId },
            { $inc: { current_balance: Number(cashDelta.toFixed(2)) } },
            { session },
          );
        }

        // 4. Single bulk insert for all transactions
        await TransactionModel.insertMany(prepared, {
          session,
          ordered: false,
        });

        return prepared;
      });
      return returnedTransactions.length;
    } finally {
      await session.endSession();
    }
  },
};
