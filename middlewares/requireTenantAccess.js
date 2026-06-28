import { getAuthContext } from "../utils/authContext.js";
import { HttpError } from "../utils/httpError.js";
import { requireAuth } from "./requireAuth.js";

export function requireTenantAccess(loadResource, options = {}) {
  const {
    loginPath = "/login",
    paramName = "id",
    resourceLabel = "Recurso",
    getComercioId = (resource) => resource?.comercioId,
    attachAs = null
  } = options;
  const ensureAuthenticated = requireAuth({ loginPath });

  return function tenantAccessMiddleware(req, res, next) {
    return ensureAuthenticated(req, res, async () => {
      try {
        const authContext = getAuthContext(req);

        if (authContext.isPlatformAdmin) {
          return next();
        }

        if (!authContext.isCommerceActor || !authContext.comercioId) {
          return next(new HttpError(403, "FORBIDDEN", "No tenes permisos para acceder a este recurso."));
        }

        const resourceId = req.params?.[paramName];
        const resource = await loadResource(resourceId, req);

        if (!resource) {
          return next(new HttpError(404, "NOT_FOUND", `${resourceLabel} no encontrado.`));
        }

        if (String(getComercioId(resource) || "") !== String(authContext.comercioId)) {
          return next(new HttpError(404, "NOT_FOUND", `${resourceLabel} no encontrado.`));
        }

        if (authContext.isCommerceUser && authContext.tiendaId) {
          const resourceTiendaId = resource.tiendaId || resource._id || null;
          if (!resourceTiendaId || String(resourceTiendaId) !== String(authContext.tiendaId)) {
            return next(new HttpError(404, "NOT_FOUND", `${resourceLabel} no encontrado.`));
          }
        }

        if (attachAs) {
          req[attachAs] = resource;
        }

        return next();
      } catch (error) {
        return next(error);
      }
    });
  };
}
