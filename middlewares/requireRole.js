import { requireAuth } from "./requireAuth.js";

export function requireRole(roles, options = {}) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const ensureAuthenticated = requireAuth(options);

  return function roleMiddleware(req, res, next) {
    return ensureAuthenticated(req, res, () => {
      const currentRole = req.session?.auth?.role;

      if (allowedRoles.includes(currentRole)) {
        return next();
      }

      if (isApiRequest(req)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "No tenes permisos para acceder a este recurso."
          }
        });
      }

      return res.status(403).render("error", {
        title: "Error 403",
        statusCode: 403,
        errorTitle: "FORBIDDEN",
        errorMessage: "No tenes permisos para acceder a este recurso."
      });
    });
  };
}

function isApiRequest(req) {
  return req.originalUrl?.startsWith("/api/");
}
