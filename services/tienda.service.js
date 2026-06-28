import { comercioRepository } from "../repositories/comercio.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { ensureTenantAccess, resolveScopedComercioId, resolveScopedTiendaId } from "../utils/authContext.js";
import { HttpError } from "../utils/httpError.js";
import { handleMongoUnique } from "./helpers.js";

export const tiendaService = {
  getAll(authContext = null) {
    const comercioId = resolveScopedComercioId(authContext, null);
    const tiendaId = resolveScopedTiendaId(authContext, null);
    const filter = comercioId ? { comercioId } : {};

    if (tiendaId) {
      filter._id = tiendaId;
    }

    return tiendaRepository.findAll(filter);
  },
  async getById(id, authContext = null) {
    const item = await tiendaRepository.findById(id);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Tienda no encontrada.");
    ensureTenantAccess(item, authContext, "Tienda");
    return item;
  },
  async create(payload, authContext = null) {
    assertCanManageStores(authContext);
    const normalized = normalizePayload(payload);
    normalized.comercioId = resolveScopedComercioId(authContext, normalized.comercioId);
    validatePayload(normalized);
    const comercioId = normalized.comercioId;
    const comercio = await comercioRepository.findById(comercioId);
    if (!comercio) throw new HttpError(404, "COMERCIO_NOT_FOUND", "Comercio no encontrado.");
    try {
      return await tiendaRepository.create(normalized);
    } catch (error) {
      handleMongoUnique(error, "Ya existe una tienda con ese nombre para el comercio.");
    }
  },
  async update(id, payload, authContext = null) {
    assertCanManageStores(authContext);
    const current = await tiendaRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Tienda no encontrada.");
    ensureTenantAccess(current, authContext, "Tienda");
    const normalized = normalizePayload({ ...current, ...payload });
    normalized.comercioId = resolveScopedComercioId(authContext, normalized.comercioId);
    validatePayload(normalized);
    const comercio = await comercioRepository.findById(normalized.comercioId);
    if (!comercio) throw new HttpError(404, "COMERCIO_NOT_FOUND", "Comercio no encontrado.");
    try {
      return await tiendaRepository.update(id, normalized);
    } catch (error) {
      handleMongoUnique(error, "Ya existe una tienda con ese nombre para el comercio.");
    }
  },
  async remove(id, authContext = null) {
    assertCanManageStores(authContext);
    const current = await tiendaRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Tienda no encontrada.");
    ensureTenantAccess(current, authContext, "Tienda");

    const deleted = await tiendaRepository.remove(id);
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Tienda no encontrada.");
  }
};

function assertCanManageStores(authContext) {
  if (authContext?.isCommerceUser) {
    throw new HttpError(403, "FORBIDDEN", "No tenes permisos para administrar tiendas.");
  }
}

function normalizePayload(payload) {
  return {
    comercioId: String(payload.comercioId || "").trim(),
    nombre: String(payload.nombre || "").trim(),
    descripcion: payload.descripcion ? String(payload.descripcion).trim() : null,
    activa: payload.activa === "true" || payload.activa === true || payload.activa === "on"
  };
}

function validatePayload(payload) {
  if (!payload.comercioId) throw new HttpError(400, "VALIDATION_ERROR", "El comercio es obligatorio.");
  if (!payload.nombre) throw new HttpError(400, "VALIDATION_ERROR", "El nombre es obligatorio.");
}
