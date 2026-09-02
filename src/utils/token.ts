import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { sha256 } from "./hashGenerator";
import { JwtPayload } from "jsonwebtoken";
export interface TokenClaims extends JwtPayload {
  email: string;
}
export const createAccessToken = (claims: TokenClaims) =>
  jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
export const createRefreshToken = (claims: TokenClaims) =>
  jwt.sign(claims, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
export const verifyAccessToken = (token: string): TokenClaims =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenClaims;
export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);
export const hashToken = sha256;
