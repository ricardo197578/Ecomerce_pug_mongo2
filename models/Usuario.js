import { createModel } from "./shared.js";

export const UsuarioModel = createModel("Usuario", {
  comercioId: { type: String, required: true, trim: true },
  tiendaId: { type: String, required: true, trim: true },
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  rol: { type: String, enum: ["ADMIN_TIENDA"], default: "ADMIN_TIENDA" },
  activo: { type: Boolean, default: true }
});
