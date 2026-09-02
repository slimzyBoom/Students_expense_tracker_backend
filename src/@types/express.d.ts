import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Locals {
      validatedQuery?: Record<string, unknown>;
      validatedParams?: Record<string, unknown>;
      validatedBody?: Record<string, unknown>;
    }
    interface Request {
      
      user?: { id: Types.ObjectId; email: string };
    }
  }
}
