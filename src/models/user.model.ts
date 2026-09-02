import { Schema, model, InferSchemaType } from 'mongoose';
const schema = new Schema({ name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, password_hash: { type: String, required: true }, created_at: { type: Date, default: Date.now } }, { versionKey: false });
export type User = InferSchemaType<typeof schema>; export const UserModel = model('User', schema);
