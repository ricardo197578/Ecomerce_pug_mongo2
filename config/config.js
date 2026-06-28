import dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 3002,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecomerce_pug_mongo",
  sessionSecret: process.env.SESSION_SECRET || "change-me-in-env",
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "codenova.sid",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10
};
