import { logisticaRepository } from "../repositories/logistica.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { buildScopeFilter, ensureTenantAccess } from "../utils/authContext.js";
import { HttpError } from "../utils/httpError.js";

const ESTADOS_LOGISTICA = new Set(["PENDIENTE", "EN_PREPARACION", "DESPACHADA", "ENTREGADA", "CANCELADA"]);

const TRANSICIONES_VALIDAS = {
  PENDIENTE: new Set(["EN_PREPARACION", "DESPACHADA", "CANCELADA"]),
  EN_PREPARACION: new Set(["DESPACHADA", "CANCELADA"]),
  DESPACHADA: new Set(["ENTREGADA", "CANCELADA"]),
  ENTREGADA: new Set([]),
  CANCELADA: new Set([])
};

function trackingCode(id) {
  return `TRK-${id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export const logisticaService = {
  getAll(authContext = null) {
    return logisticaRepository.findAll(buildScopeFilter(authContext));
  },
  async getById(id, authContext = null) {
    const item = await logisticaRepository.findById(id);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Logistica no encontrada.");
    ensureTenantAccess(item, authContext, "Logistica");
    return item;
  },
  async create(payload, authContext = null) {
    const transaccionId = String(payload.transaccionId || "").trim();
    if (!transaccionId) {
      throw new HttpError(400, "VALIDATION_ERROR", "La transaccion es obligatoria.");
    }
    const created = await this.createDesdeTransaccion(transaccionId, authContext);
    const hasCustomData = payload.estado || payload.transportista || payload.detalle;
    if (!hasCustomData) return created;
    return this.update(created._id, payload, authContext);
  },
  async createDesdeTransaccion(transaccionId, authContext = null) {
    const transaccion = await transaccionRepository.findById(transaccionId);
    if (!transaccion) throw new HttpError(404, "NOT_FOUND", "Transaccion no encontrada.");
    ensureTenantAccess(transaccion, authContext, "Transaccion");
    if (transaccion.estado !== "APROBADA") {
      throw new HttpError(422, "TRANSACCION_NOT_APPROVED", "La transaccion debe estar aprobada.");
    }
    const current = await logisticaRepository.findByTransaccionId(transaccionId);
    if (current) return current;
    const created = await logisticaRepository.create({
      transaccionId,
      comercioId: transaccion.comercioId,
      tiendaId: transaccion.tiendaId,
      usuarioId: transaccion.usuarioId,
      estado: "PENDIENTE",
      codigoSeguimiento: trackingCode(transaccionId),
      detalle: "Operacion logistica generada automaticamente."
    });
    await transaccionRepository.update(transaccionId, { logisticaId: created.id });
    return created;
  },
  async update(id, payload, authContext = null) {
    const current = await this.getById(id, authContext);
    const nextEstado = payload.estado
      ? String(payload.estado).trim().toUpperCase()
      : current.estado;
    validateEstado(nextEstado);
    validateTransition(current.estado, nextEstado);
    const updated = await logisticaRepository.update(id, {
      estado: nextEstado,
      transportista: payload.transportista
        ? String(payload.transportista).trim()
        : current.transportista,
      detalle: payload.detalle !== undefined
        ? (payload.detalle ? String(payload.detalle).trim() : null)
        : current.detalle
    });
    return updated;
  },
  async despachar(id, authContext = null) {
    return this.update(id, { estado: "DESPACHADA" }, authContext);
  },
  async remove(id, authContext = null) {
    const current = await this.getById(id, authContext);
    const deleted = await logisticaRepository.remove(id);
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Logistica no encontrada.");
    await transaccionRepository.update(current.transaccionId, { logisticaId: null });
  }
};

function validateEstado(estado) {
  if (!ESTADOS_LOGISTICA.has(estado)) {
    throw new HttpError(400, "VALIDATION_ERROR", "Estado logistico invalido.");
  }
}

function validateTransition(currentEstado, nextEstado) {
  if (currentEstado === nextEstado) return;
  const allowed = TRANSICIONES_VALIDAS[currentEstado] || new Set();
  if (!allowed.has(nextEstado)) {
    throw new HttpError(422, "INVALID_STATE_TRANSITION", "Transicion de estado logistico invalida.");
  }
}
