import { comercioRepository } from "../repositories/comercio.repository.js";
import { pagoRepository } from "../repositories/pago.repository.js";
import { suscripcionRepository } from "../repositories/suscripcion.repository.js";
import { HttpError } from "../utils/httpError.js";
import { handleMongoUnique } from "./helpers.js";

export const suscripcionService = {
  getAll() {
    return suscripcionRepository.findAll();
  },
  async getById(id) {
    const item = await suscripcionRepository.findById(id);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Suscripcion no encontrada.");
    return item;
  },
  async create(payload) {
    const normalized = normalizePayload(payload);
    validatePayload(normalized);
    const comercioId = normalized.comercioId;
    const comercio = await comercioRepository.findById(comercioId);
    if (!comercio) throw new HttpError(404, "COMERCIO_NOT_FOUND", "Comercio no encontrado.");
    try {
      return await suscripcionRepository.create(normalized);
    } catch (error) {
      handleMongoUnique(error, "El comercio ya tiene una suscripcion.");
    }
  },
  async update(id, payload) {
    const current = await suscripcionRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Suscripcion no encontrada.");
    const normalized = normalizePayload({ ...current, ...payload });
    validatePayload(normalized);
    const comercio = await comercioRepository.findById(normalized.comercioId);
    if (!comercio) throw new HttpError(404, "COMERCIO_NOT_FOUND", "Comercio no encontrado.");
    try {
      return await suscripcionRepository.update(id, normalized);
    } catch (error) {
      handleMongoUnique(error, "El comercio ya tiene una suscripcion.");
    }
  },
  async remove(id) {
    const deleted = await suscripcionRepository.remove(id);
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Suscripcion no encontrada.");
  },
  async getFacturacionResumen() {
    const [suscripciones, pagos, comercios] = await Promise.all([
      suscripcionRepository.findAll(),
      pagoRepository.findAll({ estado: "APROBADO" }),
      comercioRepository.findAll()
    ]);
    const comerciosById = new Map(comercios.map((item) => [String(item._id), item]));
    const facturas = suscripciones.map((s) => {
      const pagosComercio = pagos.filter((p) => String(p.comercioId) === String(s.comercioId));
      const baseComisionable = pagosComercio.reduce((acc, p) => acc + Number(p.monto), 0);
      const montoComision = (baseComisionable * s.comisionPorcentaje) / 100;
      const total = s.cuotaMensual + montoComision;
      const comercio = comerciosById.get(String(s.comercioId));
      return {
        comercioId: s.comercioId,
        comercioNombre: comercio ? comercio.nombre : "-",
        planNombre: s.planNombre,
        cuotaMensual: Number(s.cuotaMensual.toFixed(2)),
        baseComisionable,
        comisionPorcentaje: Number(s.comisionPorcentaje.toFixed(2)),
        montoComision: Number(montoComision.toFixed(2)),
        totalFacturar: Number(total.toFixed(2))
      };
    });
    const montoTotalCuotas = Number(
      facturas.reduce((acc, item) => acc + Number(item.cuotaMensual), 0).toFixed(2)
    );
    const montoTotalComisiones = Number(
      facturas.reduce((acc, item) => acc + Number(item.montoComision), 0).toFixed(2)
    );
    const montoTotalFacturar = Number(
      facturas.reduce((acc, f) => acc + f.totalFacturar, 0).toFixed(2)
    );
    return {
      cantidadSuscripciones: facturas.length,
      montoTotalCuotas,
      montoTotalComisiones,
      montoTotalFacturar,
      facturas
    };
  }
};

function normalizePayload(payload) {
  return {
    comercioId: String(payload.comercioId || "").trim(),
    planNombre: String(payload.planNombre || "").trim(),
    cuotaMensual: Number(payload.cuotaMensual || 0),
    comisionPorcentaje: Number(payload.comisionPorcentaje || 0),
    moneda: String(payload.moneda || "ARS").toUpperCase(),
    estado: String(payload.estado || "ACTIVA").toUpperCase(),
    fechaInicio: String(payload.fechaInicio || ""),
    fechaRenovacion: String(payload.fechaRenovacion || "")
  };
}

function validatePayload(payload) {
  if (!payload.comercioId) throw new HttpError(400, "VALIDATION_ERROR", "El comercio es obligatorio.");
  if (!payload.planNombre) throw new HttpError(400, "VALIDATION_ERROR", "El plan es obligatorio.");
  if (!payload.fechaInicio) throw new HttpError(400, "VALIDATION_ERROR", "La fecha de inicio es obligatoria.");
  if (!payload.fechaRenovacion) throw new HttpError(400, "VALIDATION_ERROR", "La fecha de renovacion es obligatoria.");
}
