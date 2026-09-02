import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { env } from "../config/env"
import { defaultCategories } from "../constants/defaultCategories";
import { CategoryModel } from "../models/category.model"

mongoose.connection.on("connected", () => {
  logger.info({ message: "MongoDB connected successfully" });
});

mongoose.connection.on("disconnected", () => {
  logger.info({ message: "MongoDB disconnected" });
});

mongoose.connection.on("error", (err) => {
  logger.error({
    message: "MongoDB connection error",
    error: err instanceof Error ? err.message : String(err),
  });

});

const seedDefaultCategories = async () => {
  try {
    const operations = defaultCategories.map((cat) => ({
      updateOne: {
        filter: { name: cat.name, type: cat.type, user_id: null },
        update: { $setOnInsert: { ...cat, user_id: null } },
        upsert: true,
      },
    }));
    await CategoryModel.bulkWrite(operations);
    logger.info({ message: "Default categories verified/seeded" });
  } catch (err) {
    logger.error({
      message: "Failed to seed default categories",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const connectDatabase = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    await seedDefaultCategories();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ message: "Failed to connect to MongoDB", error: message });
    process.exit(1);
  }
};