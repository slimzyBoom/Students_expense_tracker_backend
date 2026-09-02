import { Schema, model, InferSchemaType } from 'mongoose';
const schema = new Schema({ user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true }, monthly_limit: { type: Number, required: true, min: 0 }, month_year: { type: String, required: true } }, { versionKey: false });
schema.index({ user_id: 1, category_id: 1, month_year: 1 }, { unique: true }); export type Budget = InferSchemaType<typeof schema>; export const BudgetModel = model('Budget', schema);
