import { CategoryRuleModel } from "../models/categoryRule.model";
import { Types } from "mongoose";
export const ruleEngine = {
  async match(userId: Types.ObjectId, narrative: string) {
    const rules = await CategoryRuleModel.find({
      $or: [{ user_id: userId }, { user_id: null }],
    }).sort({ priority: -1 });
    const text = narrative.toLowerCase();
    return rules.find((r) => text.includes(r.keyword));
  },
};
