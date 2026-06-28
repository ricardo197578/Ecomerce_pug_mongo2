export function requireAuth(options = {}) {
  const { loginPath = "/login" } = options;

  return function authMiddleware(req, res, next) {
    if (req.session?.auth?.accountId) {
      return next();
    }

    if (isApiRequest(req)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "Autenticacion requerida."
        }
      });
    }

    return res.redirect(loginPath);
  };
}

function isApiRequest(req) {
  return req.originalUrl?.startsWith("/api/");
}
