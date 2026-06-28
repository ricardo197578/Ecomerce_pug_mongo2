import { appConfig } from "../config/config.js";
import { authService } from "../services/auth.service.js";

const CUSTOMER_ROLES = new Set(["COMMERCE_ADMIN", "COMMERCE_USER"]);

export const authController = {
  showLogin(req, res) {
    if (req.session?.auth?.accountId) {
      return res.redirect("/");
    }

    return res.render("auth/login", {
      title: "Login comercio",
      errorMessage: null,
      formData: { email: "" }
    });
  },

  async login(req, res, next) {
    const email = String(req.body.email || req.body.user || "").trim().toLowerCase();

    try {
      const identity = await authService.authenticate({
        email,
        password: req.body.password
      });

      if (!CUSTOMER_ROLES.has(identity.role)) {
        return res.status(401).render("auth/login", {
          title: "Login comercio",
          errorMessage: "Credenciales invalidas.",
          formData: { email }
        });
      }

      const refreshedIdentity = await authService.updateLastLogin(identity._id);
      req.session.auth = {
        accountId: refreshedIdentity._id,
        id: refreshedIdentity.id,
        email: refreshedIdentity.email,
        role: refreshedIdentity.role,
        comercioId: refreshedIdentity.comercioId,
        tiendaId: refreshedIdentity.tiendaId || null
      };

      return req.session.save((error) => {
        if (error) return next(error);
        return res.redirect("/");
      });
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        return res.status(error.statusCode).render("auth/login", {
          title: "Login comercio",
          errorMessage: error.statusCode === 400 ? error.message : "Credenciales invalidas.",
          formData: { email }
        });
      }

      return next(error);
    }
  },

  logout(req, res, next) {
    if (!req.session) {
      return res.redirect("/");
    }

    return req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie(appConfig.sessionCookieName);
      return res.redirect("/");
    });
  }
};
