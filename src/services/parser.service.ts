import { parse as csv } from "csv-parse";
import { Readable } from "stream";
import dayjs from "dayjs";
import { normalizeNarrative } from "../utils/csvSanitizer";
import { sha256 } from "../utils/hashGenerator";
import { TransactionModel } from "../models/transaction.model";
import { CategoryRuleModel } from "../models/categoryRule.model";
import { Types } from "mongoose";

const field = (row: Record<string, string>, names: string[]) =>
  names.map((n) => row[n]).find(Boolean);

const numberFrom = (value: string | undefined) => {
  if (!value) return NaN;
  const normalized = value.replace(/[^0-9.-]/g, "");
  return Number(normalized);
};

const isCashWithdrawal = (narrative: string) =>
  /(atm|pos).*(cash\s*)?withdraw|cash\s*withdraw.*(atm|pos)|atm\s*cash|pos\s*cash/i.test(
    narrative,
  );

export const parserService = {
  async parse(userId: Types.ObjectId, buffer: Buffer) {
    const rows: Record<string, string>[] = [];
    
    // 1. Parse CSV stream into rows
    await new Promise<void>((resolve, reject) =>
      Readable.from(buffer)
        .pipe(
          csv({
            bom: true,
            columns: (headers: string[]) =>
              headers.map((header) => header.trim().toLowerCase()),
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
          }),
        )
        .on("data", (r) => rows.push(r))
        .on("end", resolve)
        .on("error", reject),
    );

    // 2. Query #1: Preload user rules once into memory
    const rules = await CategoryRuleModel.find({
      $or: [{ user_id: userId }, { user_id: null }],
    }).sort({ priority: -1 }).lean();

    // 3. Process rows in memory
    const candidates = [];
    const hashes: string[] = [];

    for (const row of rows.slice(0, 1000)) {
      const narrative = normalizeNarrative(
        field(row, [
          "narrative",
          "description",
          "details",
          "memo",
          "transaction description",
        ]),
      );

      const directAmount = numberFrom(field(row, ["amount"]));
      const debit = numberFrom(field(row, ["debit"]));
      const credit = numberFrom(field(row, ["credit"]));

      // Fix: Handle 0.00 in debit/credit properly
      let amount = NaN;
      if (Number.isFinite(directAmount) && directAmount !== 0) {
        amount = directAmount;
      } else if (Number.isFinite(debit) && debit > 0) {
        amount = -Math.abs(debit);
      } else if (Number.isFinite(credit) && credit > 0) {
        amount = Math.abs(credit);
      }

      const date = dayjs(
        field(row, ["date", "transaction_date", "transaction date"]),
      );

      if (
        !narrative ||
        !Number.isFinite(amount) ||
        amount === 0 ||
        !date.isValid()
      ) {
        continue;
      }

      // In-memory rule matching
      const rule = rules.find((r) => narrative.toLowerCase().includes(r.keyword));
      const type = rule?.target_type ?? (
        isCashWithdrawal(narrative)
          ? "TRANSFER"
          : amount < 0
            ? "EXPENSE"
            : "INCOME"
      );

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
      });
    }

    // 4. Query #2: Batch check all duplicates in one single DB query
    const existingTransactions = await TransactionModel.find({
      user_id: userId,
      import_hash: { $in: hashes },
    }).select("import_hash").lean();

    const duplicateSet = new Set(existingTransactions.map((t) => t.import_hash));

    // 5. Build final response
    return candidates.map((item) => ({
      ...item,
      duplicate: duplicateSet.has(item.import_hash),
    }));
  },
};