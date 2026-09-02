import { z } from "zod";
export const accountSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    type: z.enum(["BANK", "CASH"]),
    current_balance: z.number().finite().default(0),
  })
  .strict();

export type AccountInput = z.infer<typeof accountSchema>;