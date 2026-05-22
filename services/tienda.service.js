import { comercioRepository } from "../repositories/comercio.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { HttpError } from "../utils/httpError.js";
import { handleMongoUnique } from "./helpers.js";

export const tiendaService = {
  getAll() {
    return tiendaRepository.findAll();
  },
  async getById(id) {
    const item = await tiendaRepository.findById(id);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Tienda no encontrada.");
    return item;
  },
  async create(payload) {
    const normalized = normalizePayload(payload);
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
  async update(id, payload) {
    const current = await tiendaRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Tienda no encontrada.");
    const normalized = normalizePayload({ ...current, ...payload });
    validatePayload(normalized);
    const comercio = await comercioRepository.findById(normalized.comercioId);
    if (!comercio) throw new HttpError(404, "COMERCIO_NOT_FOUND", "Comercio no encontrado.");
    try {
      return await tiendaRepository.update(id, normalized);
    } catch (error) {
      handleMongoUnique(error, "Ya existe una tienda con ese nombre para el comercio.");
    }
  },
  async remove(id) {
    const deleted = await tiendaRepository.remove(id);
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Tienda no encontrada.");
  }
};

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
