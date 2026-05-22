import { createModel } from "./shared.js";

export const LogisticaModel = createModel("Logistica", {
  transaccionId: { type: String, required: true, trim: true, unique: true },
  comercioId: { type: String, required: true, trim: true },
  tiendaId: { type: String, required: true, trim: true },
  usuarioId: { type: String, required: true, trim: true },
  estado: {
    type: String,
    enum: ["PENDIENTE", "EN_PREPARACION", "DESPACHADA", "ENTREGADA", "CANCELADA"],
    default: "PENDIENTE"
  },
  transportista: { type: String, default: "SIM_LOGISTICS" },
  codigoSeguimiento: { type: String, required: true },
  detalle: { type: String, default: null }
});
