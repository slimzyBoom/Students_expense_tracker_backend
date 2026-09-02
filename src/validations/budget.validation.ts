import { z } from "zod";
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const budgetSchema = z
  .object({
    category_id: z.string().regex(/^[a-f\d]{24}$/i),
    monthly_limit: z.number().finite().nonnegative(),
    month_year: month,
  })
  .strict();
export const monthQuery = z.object({ month }).strict();

export type MonthQuery = z.infer<typeof monthQuery>;
export type BudgetInput = z.infer<typeof budgetSchema>;