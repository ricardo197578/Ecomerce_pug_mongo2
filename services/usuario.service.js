import { comercioRepository } from "../repositories/comercio.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { usuarioRepository } from "../repositories/usuario.repository.js";
import { HttpError } from "../utils/httpError.js";
import { handleMongoUnique } from "./helpers.js";

export const usuarioService = {
  getAll() {
    return usuarioRepository.findAll();
  },
  async getById(id) {
    const item = await usuarioRepository.findById(id);
    if (!item) throw new HttpError(404, "NOT_FOUND", "Usuario no encontrado.");
    return item;
  },
  async create(payload) {
    const normalized = normalizePayload(payload);
    validatePayload(normalized);
    const comercioId = normalized.comercioId;
    const tiendaId = normalized.tiendaId;
    const [comercio, tienda] = await Promise.all([
      comercioRepository.findById(comercioId),
      tiendaRepository.findById(tiendaId)
    ]);
    if (!comercio) throw new HttpError(404, "COMERCIO_NOT_FOUND", "Comercio no encontrado.");
    if (!tienda || tienda.comercioId !== comercioId) {
      throw new HttpError(422, "RELATIONSHIP_ERROR", "La tienda no pertenece al comercio.");
    }
    try {
      return await usuarioRepository.create(normalized);
    } catch (error) {
      handleMongoUnique(error, "Ya existe un usuario con ese email.");
    }
  },
  async update(id, payload) {
    const current = await usuarioRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Usuario no encontrado.");
    const normalized = normalizePayload({ ...current, ...payload });
    validatePayload(normalized);
    const [comercio, tienda] = await Promise.all([
      comercioRepository.findById(normalized.comercioId),
      tiendaRepository.findById(normalized.tiendaId)
    ]);
    if (!comercio) throw new HttpError(404, "COMERCIO_NOT_FOUND", "Comercio no encontrado.");
    if (!tienda || tienda.comercioId !== normalized.comercioId) {
      throw new HttpError(422, "RELATIONSHIP_ERROR", "La tienda no pertenece al comercio.");
    }
    try {
      return await usuarioRepository.update(id, normalized);
    } catch (error) {
      handleMongoUnique(error, "Ya existe un usuario con ese email.");
    }
  },
  async remove(id) {
    const deleted = await usuarioRepository.remove(id);
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Usuario no encontrado.");
  }
};

function normalizePayload(payload) {
  return {
    comercioId: String(payload.comercioId || "").trim(),
    tiendaId: String(payload.tiendaId || "").trim(),
    nombre: String(payload.nombre || "").trim(),
    email: String(payload.email || "").trim().toLowerCase(),
    rol: "ADMIN_TIENDA",
    activo: payload.activo === "true" || payload.activo === true || payload.activo === "on"
  };
}

function validatePayload(payload) {
  if (!payload.comercioId) throw new HttpError(400, "VALIDATION_ERROR", "El comercio es obligatorio.");
  if (!payload.tiendaId) throw new HttpError(400, "VALIDATION_ERROR", "La tienda es obligatoria.");
  if (!payload.nombre) throw new HttpError(400, "VALIDATION_ERROR", "El nombre es obligatorio.");
  if (!payload.email) throw new HttpError(400, "VALIDATION_ERROR", "El email es obligatorio.");
}
