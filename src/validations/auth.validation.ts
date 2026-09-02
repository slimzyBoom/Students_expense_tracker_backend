import { z } from "zod";
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email(),
    password: z.string().min(8).max(128),
  })
  .strict();
export const loginSchema = z
  .object({ email: z.email(), password: z.string().min(1) })
  .strict();

  export type RegisterInput = z.infer<typeof registerSchema>;
  export type LoginInput = z.infer<typeof loginSchema>; 
