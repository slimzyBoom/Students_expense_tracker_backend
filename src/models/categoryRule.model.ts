import { Schema, model, InferSchemaType } from "mongoose";
const schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    keyword: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    target_type: {
      type: String,
      enum: ["INCOME", "EXPENSE", "TRANSFER"],
      required: true,
    },
    priority: { type: Number, default: 1 },
  },
  { versionKey: false },
);
schema.index({ user_id: 1, keyword: 1 }, { unique: true });
export type CategoryRule = InferSchemaType<typeof schema>;
export const CategoryRuleModel = model("CategoryRule", schema);
