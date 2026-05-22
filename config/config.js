import dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  port: Number(process.env.PORT) || 3002,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecomerce_pug_mongo"
};
