import { createModel } from "./shared.js";

export const PagoModel = createModel("Pago", {
  transaccionId: { type: String, required: true, trim: true, unique: true },
  comercioId: { type: String, required: true, trim: true },
  tiendaId: { type: String, required: true, trim: true },
  usuarioId: { type: String, required: true, trim: true },
  monto: { type: Number, required: true, min: 0.01 },
  moneda: { type: String, required: true },
  estado: { type: String, enum: ["PENDIENTE", "APROBADO", "RECHAZADO"], default: "PENDIENTE" },
  referenciaExterna: { type: String, required: true },
  detalle: { type: String, default: null }
});
