import { z } from "zod";

export const month = z
  .object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) })
  .strict();
export const range = z
  .object({ startDate: z.iso.date(), endDate: z.iso.date() })
  .strict();

export type RangeQuery = z.infer<typeof range>;
export type MonthQuery = z.infer<typeof month>;