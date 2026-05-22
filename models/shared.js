import { randomUUID } from "crypto";
import mongoose from "mongoose";

export function withBaseFields(definition) {
  return {
    id: { type: String, default: randomUUID, unique: true, index: true },
    ...definition
  };
}

export function createModel(name, definition, indexes = []) {
  const schema = new mongoose.Schema(withBaseFields(definition), { timestamps: true });
  indexes.forEach((item) => schema.index(item.fields, item.options || {}));
  return mongoose.model(name, schema);
}
