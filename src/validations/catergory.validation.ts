import { z } from "zod";
export const category = z
  .object({
    name: z.string().min(1).max(80),
    type: z
      .string()
      .trim()
      .toUpperCase()
      .pipe(z.enum(["INCOME", "EXPENSE"])),
    color_code: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
  })
  .strict();

export const rule = z
  .object({
    keyword: z.string().min(1).max(100),
    category_id: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .nullable()
      .optional(),
    target_type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    priority: z.number().int().min(1).max(100).optional(),
  })
  .strict();

  export type CategoryInput = z.infer<typeof category>;
  export type RuleInput = z.infer<typeof rule>;
