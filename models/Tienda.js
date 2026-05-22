import { createModel } from "./shared.js";

export const TiendaModel = createModel(
  "Tienda",
  {
    comercioId: { type: String, required: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: null },
    activa: { type: Boolean, default: true }
  },
  [{ fields: { comercioId: 1, nombre: 1 }, options: { unique: true } }]
);
