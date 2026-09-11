import { Schema, model, InferSchemaType } from "mongoose";
const schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    from_account_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    to_account_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE", "TRANSFER"],
      required: true,
    },
    transaction_date: { type: Date, required: true, index: true },
    source: {
      type: String,
      enum: ["MANUAL", "STATEMENT_IMPORT"],
      default: "MANUAL",
    },
    raw_narrative: { type: String, default: null },
    import_hash: { type: String, default: null },
  },
  { versionKey: false },
);
schema.index({ user_id: 1, transaction_date: 1 });
schema.index({ user_id: 1, category_id: 1 });
schema.index({ user_id: 1, import_hash: 1 }, { unique: true, sparse: true });
export type TransactionType = InferSchemaType<typeof schema>;
export const TransactionModel = model("Transaction", schema);