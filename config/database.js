import mongoose from "mongoose";
import { appConfig } from "./config.js";

export async function connectDatabase() {
  await mongoose.connect(appConfig.mongoUri);
  console.log("MongoDB conectado");
}
