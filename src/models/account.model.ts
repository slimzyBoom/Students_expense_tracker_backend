import { Schema, model, InferSchemaType } from "mongoose";

export enum DEFAULT_ACCOUNT_KEYS {
  CASH_WALLET = "CASH_WALLET",
  MAIN_BANK_ACCOUNT = "MAIN_BANK_ACCOUNT",
}

const schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["BANK", "CASH"], required: true },
    key: {
      type: String,
      enum: Object.values(DEFAULT_ACCOUNT_KEYS),
      default: null,
    },
    current_balance: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
schema.index({ user_id: 1, name: 1 }, { unique: true });
schema.index(
  { user_id: 1, key: 1 },
  { unique: true, partialFilterExpression: { key: { $type: "string" } } },
);
export type Account = InferSchemaType<typeof schema>;
export const AccountModel = model("Account", schema);
