import { accountRepository } from "../repositories/account.repository.js";
import { comercioRepository } from "../repositories/comercio.repository.js";
import { tiendaRepository } from "../repositories/tienda.repository.js";
import { HttpError } from "../utils/httpError.js";
import { authService } from "./auth.service.js";
import { handleMongoUnique } from "./helpers.js";

const COMMERCE_ROLES = new Set(["COMMERCE_ADMIN", "COMMERCE_USER"]);

export const accountService = {
  async getAll() {
    const accounts = await accountRepository.findAll({
      role: { $in: [...COMMERCE_ROLES] }
    });

    return accounts.map(toSafeAccount);
  },

  async getById(id) {
    return loadCommerceAccount(id);
  },

  async create(payload) {
    const normalized = normalizeCreatePayload(payload);
    validateCreatePayload(normalized);
    await ensureComercioExists(normalized.comercioId);
    await ensureTiendaScope(normalized);
    normalized.passwordHash = await authService.hashPassword(normalized.password);

    try {
      const created = await accountRepository.create({
        email: normalized.email,
        passwordHash: normalized.passwordHash,
        role: normalized.role,
        comercioId: normalized.comercioId,
        tiendaId: normalized.tiendaId,
        activo: normalized.activo,
        lastLoginAt: null
      });

      return toSafeAccount(created);
    } catch (error) {
      handleMongoUnique(error, "Ya existe una cuenta con ese email.");
    }
  },

  async update(id, payload) {
    const current = await loadCommerceAccount(id, true);
    const normalized = normalizeUpdatePayload(current, payload);
    validateUpdatePayload(normalized);
    await ensureComercioExists(normalized.comercioId);
    await ensureTiendaScope(normalized);

    if (normalized.password) {
      normalized.passwordHash = await authService.hashPassword(normalized.password);
    }

    const fields = {
      email: normalized.email,
      role: normalized.role,
      comercioId: normalized.comercioId,
      tiendaId: normalized.tiendaId,
      activo: normalized.activo
    };

    if (normalized.passwordHash) {
      fields.passwordHash = normalized.passwordHash;
    }

    try {
      const updated = await accountRepository.update(id, fields);
      if (!updated) {
        throw new HttpError(404, "NOT_FOUND", "Cuenta no encontrada.");
      }
      return toSafeAccount(updated);
    } catch (error) {
      handleMongoUnique(error, "Ya existe una cuenta con ese email.");
    }
  },

  async remove(id) {
    await loadCommerceAccount(id, true);
    const deleted = await accountRepository.remove(id);
    if (!deleted) {
      throw new HttpError(404, "NOT_FOUND", "Cuenta no encontrada.");
    }
  }
};

async function loadCommerceAccount(id, includePasswordHash = false) {
  const account = await accountRepository.findById(id);

  if (!account || !COMMERCE_ROLES.has(account.role)) {
    throw new HttpError(404, "NOT_FOUND", "Cuenta no encontrada.");
  }

  return includePasswordHash ? account : toSafeAccount(account);
}

async function ensureComercioExists(comercioId) {
  const comercio = await comercioRepository.findById(comercioId);
  if (!comercio) {
    throw new HttpError(404, "COMERCIO_NOT_FOUND", "Comercio no encontrado.");
  }
}

async function ensureTiendaScope(payload) {
  if (payload.role === "COMMERCE_ADMIN") {
    payload.tiendaId = null;
    return;
  }

  if (!payload.tiendaId) {
    throw new HttpError(400, "VALIDATION_ERROR", "La tienda es obligatoria para COMMERCE_USER.");
  }

  const tienda = await tiendaRepository.findById(payload.tiendaId);
  if (!tienda || String(tienda.comercioId) !== String(payload.comercioId)) {
    throw new HttpError(422, "RELATIONSHIP_ERROR", "La tienda no pertenece al comercio indicado.");
  }
}

function normalizeBasePayload(payload) {
  return {
    email: String(payload.email || "").trim().toLowerCase(),
    role: String(payload.role || "").trim().toUpperCase(),
    comercioId: String(payload.comercioId || "").trim(),
    tiendaId: payload.tiendaId ? String(payload.tiendaId).trim() : null,
    activo: payload.activo === true || payload.activo === "true" || payload.activo === "on"
  };
}

function normalizeCreatePayload(payload) {
  return {
    ...normalizeBasePayload(payload),
    password: String(payload.password || "").trim(),
    passwordHash: payload.passwordHash || null
  };
}

function normalizeUpdatePayload(current, payload) {
  const password = payload.password === undefined ? null : String(payload.password || "").trim();
  const hasActivo = Object.prototype.hasOwnProperty.call(payload, "activo");

  return {
    ...normalizeBasePayload({
      email: payload.email ?? current.email,
      role: payload.role ?? current.role,
      comercioId: payload.comercioId ?? current.comercioId,
      tiendaId: payload.tiendaId ?? current.tiendaId,
      activo: hasActivo ? payload.activo : false
    }),
    password,
    passwordHash: null
  };
}

function validateCommonPayload(payload) {
  if (!payload.email) {
    throw new HttpError(400, "VALIDATION_ERROR", "El email es obligatorio.");
  }
  if (!COMMERCE_ROLES.has(payload.role)) {
    throw new HttpError(400, "VALIDATION_ERROR", "El rol es invalido para una cuenta de comercio.");
  }
  if (!payload.comercioId) {
    throw new HttpError(400, "VALIDATION_ERROR", "El comercio es obligatorio.");
  }
}

function validateCreatePayload(payload) {
  validateCommonPayload(payload);
  if (!payload.password) {
    throw new HttpError(400, "VALIDATION_ERROR", "La contrasena es obligatoria.");
  }
  if (payload.password.length < 8) {
    throw new HttpError(400, "VALIDATION_ERROR", "La contrasena debe tener al menos 8 caracteres.");
  }
}

function validateUpdatePayload(payload) {
  validateCommonPayload(payload);
  if (payload.password !== null && payload.password.length > 0 && payload.password.length < 8) {
    throw new HttpError(400, "VALIDATION_ERROR", "La contrasena debe tener al menos 8 caracteres.");
  }
}

function toSafeAccount(account) {
  return {
    _id: account._id,
    id: account.id,
    email: account.email,
    role: account.role,
    comercioId: account.comercioId || null,
    tiendaId: account.tiendaId || null,
    activo: account.activo,
    lastLoginAt: account.lastLoginAt || null
  };
}
