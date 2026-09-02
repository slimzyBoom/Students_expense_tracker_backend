import { z } from "zod";
const id = z.string().regex(/^[a-f\d]{24}$/i);
export const confirmSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            category_id: id.nullable().optional(),
            amount: z.number().positive(),
            type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
            transaction_date: z.coerce.date(),
            raw_narrative: z.string().max(500),
            import_hash: z.string().length(64),
          })
          .strict(),
      )
      .min(1)
      .max(1000),
    rules: z
      .array(
        z
          .object({
            keyword: z.string().trim().min(1).max(100),
            category_id: id.nullable().optional(),
            target_type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
            priority: z.number().int().min(1).max(100).default(1),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

export type ConfirmInput = z.infer<typeof confirmSchema>;
