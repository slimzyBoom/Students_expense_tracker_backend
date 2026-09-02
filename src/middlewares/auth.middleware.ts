import { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/token";
import { Types } from "mongoose";
export const authenticate: RequestHandler = (req, _res, next) => {
  try {
    const value = req.headers.authorization;
    if (!value?.startsWith("Bearer ")) throw new Error("Missing bearer token");
    const claims = verifyAccessToken(value.slice(7));
    req.user = { id: new Types.ObjectId(claims.sub as string), email: claims.email };
    next();
  } catch {
    const error = new Error("Unauthorized");
    (error as Error & { statusCode?: number }).statusCode = 401;
    next(error);
  }
};
