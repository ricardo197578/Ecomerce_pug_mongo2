import { createModel } from "./shared.js";

export const ComercioModel = createModel("Comercio", {
  nombre: { type: String, required: true, trim: true },
  cuit: { type: String, required: true, trim: true, unique: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  activo: { type: Boolean, default: true }
});
