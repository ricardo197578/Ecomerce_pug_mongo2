import { createModel } from "./shared.js";

export const TransaccionModel = createModel("Transaccion", {
  comercioId: { type: String, required: true, trim: true },
  tiendaId: { type: String, required: true, trim: true },
  usuarioId: { type: String, required: true, trim: true },
  monto: { type: Number, required: true, min: 0.01 },
  moneda: { type: String, required: true, default: "ARS" },
  descripcion: { type: String, default: null },
  estado: { type: String, enum: ["PENDIENTE", "APROBADA", "RECHAZADA"], default: "PENDIENTE" },
  pagoId: { type: String, default: null },
  logisticaId: { type: String, default: null }
});
