import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { UserModel } from "../models/user.model";
import { AccountModel } from "../models/account.model";
import { DEFAULT_ACCOUNT_KEYS } from "../models/account.model";
import { RefreshTokenModel } from "../models/refreshToken.model";
import { AppError } from "../middlewares/error.middleware";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../utils/token";
import mongoose, { Types } from "mongoose";
const expiry = () => new Date(Date.now() + 7 * 864e5);
const issue = async (user: { _id: Types.ObjectId; email: string }) => {
  const refreshToken = createRefreshToken({
    sub: String(user._id),
    email: user.email,
    jti: randomUUID(),
  });
  await RefreshTokenModel.create({
    user_id: user._id,
    token_hash: hashToken(refreshToken),
    expires_at: expiry(),
  });
  return {
    accessToken: createAccessToken({
      sub: String(user._id),
      email: user.email,
    }),
    refreshToken,
  };
};

export const authService = {
  async register(name: string, email: string, password: string) {
    if (await UserModel.exists({ email })) {
      throw new AppError("Email already registered", 409);
    }

    const password_hash = await bcrypt.hash(password, 12);

    const session = await mongoose.startSession();

    try {
      const newUser = await session.withTransaction(async () => {
        const user = new UserModel({
          name,
          email,
          password_hash,
        });

        await user.save({ session })

        const accounts = await AccountModel.create(
          [
            {
              user_id: user._id,
              key: DEFAULT_ACCOUNT_KEYS.CASH_WALLET,
              name: "Cash Wallet",
              type: "CASH",
            },
            {
              user_id: user._id,
              key: DEFAULT_ACCOUNT_KEYS.MAIN_BANK_ACCOUNT,
              name: "Main Bank Account",
              type: "BANK",
            },
          ],
          { session, ordered: true },
        );

        return user;
      });

      const tokens = await issue(newUser);

      return {
        user: newUser,
        ...tokens,
      };
    } catch (error) {
      throw error;
    } finally {
      await session.endSession();
    }
  },
  async login(email: string, password: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError("Invalid email or password", 401);
    }
    return { user, ...(await issue(user)) };
  },
  async rotate(token: string) {
    if (!token) {
      const e = new Error("Refresh token is required");
      (e as any).statusCode = 400;
      throw e;
    }
    const claims = verifyRefreshToken(token);
    const existing = await RefreshTokenModel.findOne({
      token_hash: hashToken(token),
    });
    if (!existing) {
      await RefreshTokenModel.deleteMany({
        user_id: new Types.ObjectId(claims.sub as string),
      });
      const e = new Error("Refresh-token reuse detected; sessions revoked");
      (e as any).statusCode = 401;
      throw e;
    }
    await RefreshTokenModel.deleteOne({ _id: existing._id });
    const user = await UserModel.findById(claims.sub);
    if (!user) throw new Error("User not found");
    return issue(user);
  },
  async logout(token?: string) {
    if (token)
      await RefreshTokenModel.deleteOne({ token_hash: hashToken(token) });
  },
};
