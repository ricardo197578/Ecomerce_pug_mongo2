import { logisticaService } from "./logistica.service.js";
import { pagoRepository } from "../repositories/pago.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { HttpError } from "../utils/httpError.js";
import { handleMongoUnique } from "./helpers.js";

const MAP_ESTADO = {
  APROBADO: "APROBADA",
  RECHAZADO: "RECHAZADA",
  PENDIENTE: "PENDIENTE"
};

const ESTADOS_PAGO_VALIDOS = new Set(["PENDIENTE", "APROBADO", "RECHAZADO"]);

export const pagoService = {
  getAll() {
    return pagoRepository.findAll();
  },
  async getById(id) {
    const item = await pagoRepository.findById(id);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Pago no encontrado.");
    return item;
  },
  async create(payload) {
    const transaccionId = String(payload.transaccionId || "").trim();
    const transaccion = await transaccionRepository.findById(transaccionId);
    if (!transaccion) throw new HttpError(404, "NOT_FOUND", "Transaccion no encontrada.");
    const estado = String(payload.estado || "PENDIENTE").trim().toUpperCase();
    validateEstadoPago(estado);
    try {
      const pago = await pagoRepository.create({
        transaccionId,
        comercioId: transaccion.comercioId,
        tiendaId: transaccion.tiendaId,
        usuarioId: transaccion.usuarioId,
        monto: transaccion.monto,
        moneda: transaccion.moneda,
        estado,
        referenciaExterna: `SIM-${Date.now()}`,
        detalle: payload.detalle ? String(payload.detalle).trim() : "Pago simulado"
      });
      await syncTransaccionConPago(transaccionId, pago.id, estado);
      return pago;
    } catch (error) {
      handleMongoUnique(error, "La transaccion ya tiene un pago asociado.");
    }
  },
  async update(id, payload) {
    const current = await pagoRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Pago no encontrado.");
    const estado = String(payload.estado || current.estado).trim().toUpperCase();
    validateEstadoPago(estado);
    const detalle = payload.detalle ? String(payload.detalle).trim() : current.detalle;
    const updated = await pagoRepository.update(id, { estado, detalle });
    await syncTransaccionConPago(current.transaccionId, current.id, estado);
    return updated;
  },
  async remove(id) {
    const current = await pagoRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Pago no encontrado.");
    const deleted = await pagoRepository.remove(id);
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Pago no encontrado.");
    await transaccionRepository.update(current.transaccionId, {
      pagoId: null,
      estado: "PENDIENTE"
    });
  }
};

async function syncTransaccionConPago(transaccionId, pagoId, estadoPago) {
  await transaccionRepository.update(transaccionId, {
    pagoId,
    estado: MAP_ESTADO[estadoPago] || "PENDIENTE"
  });
  if (estadoPago === "APROBADO") {
    await logisticaService.createDesdeTransaccion(transaccionId);
  }
}

function validateEstadoPago(estado) {
  if (!ESTADOS_PAGO_VALIDOS.has(estado)) {
    throw new HttpError(400, "VALIDATION_ERROR", "Estado de pago invalido.");
  }
}
