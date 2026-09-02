import { RequestHandler, CookieOptions } from "express";
import { authService } from "../services/auth.service";
import { ok } from "../utils/apiResponse";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";
const cookie: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax" as const,
  maxAge: 7 * 864e5,
};
const present = (x: any) => ({
  id: x._id,
  name: x.name,
  email: x.email,
  created_at: x.created_at,
});
export const register: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body;
    const x = await authService.register(body.name, body.email, body.password);
    res.cookie("refreshToken", x.refreshToken, cookie);
    ok(res, { user: present(x.user), accessToken: x.accessToken }, 201);
  } catch (e) {
    next(e);
  }
};
export const login: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body;
    const x = await authService.login(body.email, body.password);
    res.cookie("refreshToken", x.refreshToken, cookie);
    ok(res, { user: present(x.user), accessToken: x.accessToken });
  } catch (e) {
    next(e);
  }
};
export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const x = await authService.rotate(req.cookies.refreshToken);
    res.cookie("refreshToken", x.refreshToken, cookie);
    ok(res, { accessToken: x.accessToken });
  } catch (e) {
    res.clearCookie("refreshToken");
    next(e);
  }
};
export const logout: RequestHandler = async (req, res, next) => {
  try {
    await authService.logout(req.cookies.refreshToken);
    res.clearCookie("refreshToken");
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    ok(res, { user: present(user) });
  } catch (e) {
    next(e);
  }
};
