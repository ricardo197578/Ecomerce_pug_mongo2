import { comercioRepository } from "../repositories/comercio.repository.js";
import { HttpError } from "../utils/httpError.js";
import { handleMongoUnique } from "./helpers.js";

export const comercioService = {
  getAll() {
    return comercioRepository.findAll();
  },
  async getById(id) {
    const item = await comercioRepository.findById(id);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Comercio no encontrado.");
    return item;
  },
  async create(payload) {
    const normalized = normalizePayload(payload);
    validatePayload(normalized);
    try {
      return await comercioRepository.create(normalized);
    } catch (error) {
      handleMongoUnique(error, "Ya existe un comercio con ese CUIT.");
    }
  },
  async update(id, payload) {
    const current = await comercioRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Comercio no encontrado.");
    const normalized = normalizePayload({ ...current, ...payload });
    validatePayload(normalized);
    try {
      return await comercioRepository.update(id, normalized);
    } catch (error) {
      handleMongoUnique(error, "Ya existe un comercio con ese CUIT.");
    }
  },
  async remove(id) {
    const deleted = await comercioRepository.remove(id);
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Comercio no encontrado.");
  }
};

function normalizePayload(payload) {
  return {
    nombre: String(payload.nombre || "").trim(),
    cuit: String(payload.cuit || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    activo: payload.activo === "true" || payload.activo === true || payload.activo === "on"
  };
}

function validatePayload(payload) {
  if (!payload.nombre) throw new HttpError(400, "VALIDATION_ERROR", "El nombre es obligatorio.");
  if (!payload.cuit) throw new HttpError(400, "VALIDATION_ERROR", "El CUIT es obligatorio.");
  if (!payload.email) throw new HttpError(400, "VALIDATION_ERROR", "El email es obligatorio.");
}
