import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Error as MongooseError } from "mongoose";

export const notFound = (_req: unknown, res: any) =>
  res.status(404).json({ success: false, message: "Route not found" });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError)
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        field: issue.path.join(".") || "root",
        message: issue.message,
      })),
    });
  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError)
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  if (err instanceof MongooseError.ValidationError)
    return res.status(400).json({ success: false, message: err.message });
  if ((err as { code?: number }).code === 11000)
    return res
      .status(409)
      .json({ success: false, message: "Resource already exists" });
  const status = (err as { statusCode?: number }).statusCode ?? 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : err.message,
  });
};
