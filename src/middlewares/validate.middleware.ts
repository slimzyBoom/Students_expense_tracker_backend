import { RequestHandler } from "express";
import { z } from "zod";

export const validateBody = (schema: z.ZodType): RequestHandler => {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodType): RequestHandler => {
  return (req, res, next) => {
    try {
      res.locals.validatedParams = schema.parse(req.params) as Record<string, unknown>;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodType): RequestHandler => {
  return (req, res, next) => {
    try {
      res.locals.validatedQuery = schema.parse(req.query) as Record<string, unknown>;
      next();
    } catch (error) {
      next(error);
    }
  };
};
