import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Error as MongooseError } from "mongoose";
import multer from "multer"

export const notFound = (_req: unknown, res: any) =>
  res.status(404).json({ success: false, message: "Route not found" });

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError){
    res.status(400).json({
      success: false,
      message: "Upload failed",
      errors: err.message
    });
  }
  if (err instanceof ZodError)
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        field: issue.path.join(".") || "root",
        message: issue.message,
      })),
    });
  // JWT
  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // Mongoose validation
  if (err instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((error) => ({
        field: error.path,
        message: error.message,
      })),
    });
  }

  if ((err as { code?: number }).code === 11000)
    return res
      .status(409)
      .json({ success: false, message: "Resource already exists" });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  const status = (err as { statusCode?: number }).statusCode ?? 500;

  console.error(err);
  
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : err.message,
  });
};
