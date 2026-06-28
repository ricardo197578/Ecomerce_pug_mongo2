import { comercioRepository } from "../repositories/comercio.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { transaccionRepository } from "../repositories/transaccion.repository.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";
import { buildScopeFilter, ensureTenantAccess, resolveScopedComercioId, resolveScopedTiendaId } from "../utils/authContext.js";
import { HttpError } from "../utils/httpError.js";

export const transaccionService = {
  getAll(authContext = null) {
    return transaccionRepository.findAll(buildScopeFilter(authContext));
  },
  async getById(id, authContext = null) {
    const item = await transaccionRepository.findById(id);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Transaccion no encontrada.");
    ensureTenantAccess(item, authContext, "Transaccion");
    return item;
  },
  async create(payload, authContext = null) {
    const normalized = normalizePayload(payload);
    normalized.comercioId = resolveScopedComercioId(authContext, normalized.comercioId);
    normalized.tiendaId = resolveScopedTiendaId(authContext, normalized.tiendaId);
    validatePayload(normalized);
    const { comercioId, tiendaId, usuarioId } = normalized;
    const [comercio, tienda, usuario] = await Promise.all([
      comercioRepository.findById(comercioId),
      tiendaRepository.findById(tiendaId),
      usuarioRepository.findById(usuarioId)
    ]);
    if (!comercio || !tienda || !usuario) {
      throw new HttpError(404, "NOT_FOUND", "Relacion de transaccion invalida.");
    }
    if (tienda.comercioId !== comercioId || usuario.comercioId !== comercioId) {
      throw new HttpError(422, "RELATIONSHIP_ERROR", "La tienda o el usuario no pertenecen al comercio.");
    }
    return transaccionRepository.create(normalized);
  },
  async update(id, payload, authContext = null) {
    const current = await transaccionRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Transaccion no encontrada.");
    ensureTenantAccess(current, authContext, "Transaccion");
    const normalized = normalizePayload({ ...current, ...payload, estado: current.estado, pagoId: current.pagoId, logisticaId: current.logisticaId });
    normalized.comercioId = resolveScopedComercioId(authContext, normalized.comercioId);
    normalized.tiendaId = resolveScopedTiendaId(authContext, normalized.tiendaId);
    validatePayload(normalized);
    const [comercio, tienda, usuario] = await Promise.all([
      comercioRepository.findById(normalized.comercioId),
      tiendaRepository.findById(normalized.tiendaId),
      usuarioRepository.findById(normalized.usuarioId)
    ]);
    if (!comercio || !tienda || !usuario) {
      throw new HttpError(404, "NOT_FOUND", "Relacion de transaccion invalida.");
    }
    if (tienda.comercioId !== normalized.comercioId || usuario.comercioId !== normalized.comercioId) {
      throw new HttpError(422, "RELATIONSHIP_ERROR", "La tienda o el usuario no pertenecen al comercio.");
    }
    return transaccionRepository.update(id, {
      comercioId: normalized.comercioId,
      tiendaId: normalized.tiendaId,
      usuarioId: normalized.usuarioId,
      monto: normalized.monto,
      moneda: normalized.moneda,
      descripcion: normalized.descripcion
    });
  },
  async remove(id, authContext = null) {
    const current = await transaccionRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Transaccion no encontrada.");
    ensureTenantAccess(current, authContext, "Transaccion");

    const deleted = await transaccionRepository.remove(id);
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Transaccion no encontrada.");
  }
};

function normalizePayload(payload) {
  return {
    comercioId: String(payload.comercioId || "").trim(),
    tiendaId: String(payload.tiendaId || "").trim(),
    usuarioId: String(payload.usuarioId || "").trim(),
    monto: Number(payload.monto),
    moneda: String(payload.moneda || "ARS").trim().toUpperCase(),
    descripcion: payload.descripcion ? String(payload.descripcion).trim() : null,
    estado: payload.estado || "PENDIENTE",
    pagoId: payload.pagoId || null,
    logisticaId: payload.logisticaId || null
  };
}

function validatePayload(payload) {
  if (!payload.comercioId) throw new HttpError(400, "VALIDATION_ERROR", "El comercio es obligatorio.");
  if (!payload.tiendaId) throw new HttpError(400, "VALIDATION_ERROR", "La tienda es obligatoria.");
  if (!payload.usuarioId) throw new HttpError(400, "VALIDATION_ERROR", "El usuario es obligatorio.");
  if (!Number.isFinite(payload.monto) || payload.monto <= 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "El monto debe ser mayor a 0.");
  }
}
