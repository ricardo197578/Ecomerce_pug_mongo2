import { HttpError } from "./httpError.js";

const COMMERCE_ROLES = new Set(["COMMERCE_ADMIN", "COMMERCE_USER"]);

export function getAuthContext(req) {
  return createAuthContext(req.session?.auth);
}

export function createAuthContext(auth) {
  const role = auth?.role || null;

  return {
    accountId: auth?.accountId || null,
    role,
    comercioId: auth?.comercioId || null,
    tiendaId: auth?.tiendaId || null,
    isAuthenticated: Boolean(auth?.accountId),
    isPlatformAdmin: role === "PLATFORM_ADMIN",
    isCommerceActor: COMMERCE_ROLES.has(role),
    isCommerceAdmin: role === "COMMERCE_ADMIN",
    isCommerceUser: role === "COMMERCE_USER"
  };
}

export function resolveScopedComercioId(authContext, comercioId) {
  if (authContext?.isCommerceActor) {
    return authContext.comercioId || null;
  }

  return comercioId ? String(comercioId).trim() : null;
}

export function resolveScopedTiendaId(authContext, tiendaId) {
  if (authContext?.isCommerceUser) {
    return authContext.tiendaId || null;
  }

  return tiendaId ? String(tiendaId).trim() : null;
}

export function buildScopeFilter(authContext, baseFilter = {}) {
  const filter = { ...baseFilter };
  const comercioId = resolveScopedComercioId(authContext, null);
  const tiendaId = resolveScopedTiendaId(authContext, null);

  if (comercioId) {
    filter.comercioId = comercioId;
  }

  if (tiendaId && "tiendaId" in filter === false) {
    filter.tiendaId = tiendaId;
  }

  return filter;
}

export function ensureTenantAccess(resource, authContext, resourceLabel = "Recurso") {
  if (!resource) {
    throw new HttpError(404, "NOT_FOUND", `${resourceLabel} no encontrado.`);
  }

  if (authContext?.isPlatformAdmin) {
    return resource;
  }

  if (!authContext?.isAuthenticated) {
    throw new HttpError(401, "AUTH_REQUIRED", "Autenticacion requerida.");
  }

  if (!authContext.isCommerceActor || !authContext.comercioId) {
    throw new HttpError(403, "FORBIDDEN", "No tenes permisos para acceder a este recurso.");
  }

  if (String(resource.comercioId || "") !== String(authContext.comercioId)) {
    throw new HttpError(404, "NOT_FOUND", `${resourceLabel} no encontrado.`);
  }

  if (authContext.isCommerceUser && authContext.tiendaId) {
    const resourceTiendaId = resource.tiendaId || resource._id || null;
    if (!resourceTiendaId || String(resourceTiendaId) !== String(authContext.tiendaId)) {
      throw new HttpError(404, "NOT_FOUND", `${resourceLabel} no encontrado.`);
    }
  }

  return resource;
}
