import { Schema, model, InferSchemaType } from "mongoose";
const schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token_hash: { type: String, required: true, index: true },
    expires_at: { type: Date, required: true, expires: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
schema.index({ user_id: 1, token_hash: 1 }, { unique: true });
export type RefreshToken = InferSchemaType<typeof schema>;
export const RefreshTokenModel = model("RefreshToken", schema);
