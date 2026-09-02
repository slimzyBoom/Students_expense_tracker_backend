import { Schema, model, InferSchemaType } from "mongoose";
import { defaultCategories } from "../constants/defaultCategories";
const schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    color_code: { type: String, default: "#64748B" },
  },
  { versionKey: false },
);
schema.index({ user_id: 1, name: 1, type: 1 }, { unique: true });
export type Category = InferSchemaType<typeof schema>;
export const CategoryModel = model("Category", schema);
