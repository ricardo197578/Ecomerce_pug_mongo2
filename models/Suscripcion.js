import { createModel } from "./shared.js";

export const SuscripcionModel = createModel("Suscripcion", {
  comercioId: { type: String, required: true, trim: true, unique: true },
  planNombre: { type: String, required: true, trim: true },
  cuotaMensual: { type: Number, required: true, min: 0 },
  comisionPorcentaje: { type: Number, required: true, min: 0, max: 100 },
  moneda: { type: String, required: true, default: "ARS" },
  estado: { type: String, enum: ["ACTIVA", "PAUSADA", "CANCELADA"], default: "ACTIVA" },
  fechaInicio: { type: String, required: true },
  fechaRenovacion: { type: String, required: true }
});
