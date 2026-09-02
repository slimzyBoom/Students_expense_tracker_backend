import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i);
export const transactionSchema = z
  .object({
    from_account_id: id.nullable().optional(),
    to_account_id: id.nullable().optional(),
    category_id: id.nullable().optional(),
    amount: z.number().positive(),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    transaction_date: z.coerce.date(),
    raw_narrative: z.string().max(500).nullable().optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.type === "INCOME" && !v.to_account_id)
      ctx.addIssue({
        code: "custom",
        message: "Income requires to_account_id",
      });
    if (v.type === "EXPENSE" && !v.from_account_id)
      ctx.addIssue({
        code: "custom",
        message: "Expense requires from_account_id",
      });
    if (
      v.type === "TRANSFER" &&
      (!v.from_account_id ||
        !v.to_account_id ||
        v.from_account_id === v.to_account_id)
    )
      ctx.addIssue({
        code: "custom",
        message: "Transfer requires distinct accounts",
      });
  });

export const cashEntrySchema = z
  .object({
    category_id: id.nullable().optional(),
    amount: z.number().positive(),
    type: z.enum(["INCOME", "EXPENSE"]),
    transaction_date: z.coerce.date(),
    raw_narrative: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

export const dailyCashLogSchema = z
  .object({
    entries: z
      .array(
        z
          .object({
            category_id: id.nullable().optional(),
            amount: z.number().positive(),
            transaction_date: z.coerce.date(),
            raw_narrative: z.string().trim().max(500).nullable().optional(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
export const transactionQuery = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
    categoryId: id.optional(),
  })
  .strict();
export const idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export type TransactionQuery = z.infer<typeof transactionQuery>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionIdParam = z.infer<typeof idParam>;
export type CashEntryInput = z.infer<typeof cashEntrySchema>;
export type DailyCashLogInput = z.infer<typeof dailyCashLogSchema>;
