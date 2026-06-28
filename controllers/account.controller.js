import { comercioService } from "../services/comercio.service.js";
import { accountService } from "../services/account.service.js";
import { tiendaService } from "../services/tienda.service.js";
import { getAuthContext } from "../utils/authContext.js";

const formDefaults = {
  email: "",
  password: "",
  role: "COMMERCE_ADMIN",
  comercioId: "",
  tiendaId: "",
  activo: true
};

async function loadFormOptions(authContext = null) {
  const [comercios, tiendas] = await Promise.all([
    comercioService.getAll(authContext),
    tiendaService.getAll(authContext)
  ]);
  const comerciosById = new Map(comercios.map((comercio) => [String(comercio._id), comercio]));
  const tiendasView = tiendas.map((tienda) => {
    const comercio = comerciosById.get(String(tienda.comercioId));
    return {
      ...tienda,
      comercioNombre: comercio ? comercio.nombre : "Sin comercio"
    };
  });
  return { comercios, tiendas: tiendasView };
}

export const accountController = {
  async list(_req, res, next) {
    try {
      const authContext = getAuthContext(_req);
      const [items, comercios, tiendas] = await Promise.all([
        accountService.getAll(authContext),
        comercioService.getAll(authContext),
        tiendaService.getAll(authContext)
      ]);
      const comerciosById = new Map(comercios.map((comercio) => [String(comercio._id), comercio]));
      const tiendasById = new Map(tiendas.map((tienda) => [String(tienda._id), tienda]));
      const itemsView = items.map((item) => {
        const comercio = comerciosById.get(String(item.comercioId));
        const tienda = tiendasById.get(String(item.tiendaId));
        return {
          ...item,
          comercioNombre: comercio ? comercio.nombre : "-",
          comercioCuit: comercio ? comercio.cuit : "-",
          tiendaNombre: tienda ? tienda.nombre : "-"
        };
      });

      res.render("cuentas-comercio/index", {
        title: "Cuentas de comercio",
        items: itemsView,
        canManageCommerceUsers: authContext.isPlatformAdmin || authContext.isCommerceAdmin
      });
    } catch (error) {
      next(error);
    }
  },

  async showCreate(_req, res, next) {
    try {
      const authContext = getAuthContext(_req);
      const options = await loadFormOptions(authContext);
      res.render("cuentas-comercio/form", {
        title: authContext.isCommerceAdmin ? "Nuevo usuario de comercio" : "Nueva cuenta de comercio",
        formData: buildFormData(formDefaults, authContext),
        errorMessage: null,
        formAction: "",
        submitLabel: "Guardar",
        isEdit: false,
        authContext,
        ...options
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await accountService.create(req.body, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const authContext = getAuthContext(req);
          const options = await loadFormOptions(authContext);
          return res.status(error.statusCode).render("cuentas-comercio/form", {
            title: authContext.isCommerceAdmin ? "Nuevo usuario de comercio" : "Nueva cuenta de comercio",
            formData: buildFormData({ ...formDefaults, ...req.body }, authContext),
            errorMessage: error.message,
            formAction: "",
            submitLabel: "Guardar",
            isEdit: false,
            authContext,
            ...options
          });
        } catch (innerError) {
          return next(innerError);
        }
      }
      next(error);
    }
  },

  async showDetail(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const [item, comercios, tiendas] = await Promise.all([
        accountService.getById(req.params.id, authContext),
        comercioService.getAll(authContext),
        tiendaService.getAll(authContext)
      ]);
      const comercio = comercios.find((entry) => String(entry._id) === String(item.comercioId)) || null;
      const tienda = tiendas.find((entry) => String(entry._id) === String(item.tiendaId)) || null;
      res.render("cuentas-comercio/show", {
        title: "Cuenta de comercio",
        item: {
          ...item,
          comercioNombre: comercio ? comercio.nombre : "-",
          comercioCuit: comercio ? comercio.cuit : "-",
          tiendaNombre: tienda ? tienda.nombre : "-"
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async showEdit(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const [item, options] = await Promise.all([
        accountService.getById(req.params.id, authContext),
        loadFormOptions(authContext)
      ]);
      res.render("cuentas-comercio/form", {
        title: authContext.isCommerceAdmin ? "Editar usuario de comercio" : "Editar cuenta de comercio",
        formData: buildFormData({ ...item, password: "" }, authContext),
        errorMessage: null,
        formAction: `/${item._id}/edit`,
        submitLabel: "Actualizar",
        isEdit: true,
        authContext,
        ...options
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await accountService.update(req.params.id, req.body, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const authContext = getAuthContext(req);
          const options = await loadFormOptions(authContext);
          return res.status(error.statusCode).render("cuentas-comercio/form", {
            title: authContext.isCommerceAdmin ? "Editar usuario de comercio" : "Editar cuenta de comercio",
            formData: buildFormData({ _id: req.params.id, ...formDefaults, ...req.body, password: "" }, authContext),
            errorMessage: error.message,
            formAction: `/${req.params.id}/edit`,
            submitLabel: "Actualizar",
            isEdit: true,
            authContext,
            ...options
          });
        } catch (innerError) {
          return next(innerError);
        }
      }
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await accountService.remove(req.params.id, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  }
};

function buildFormData(formData, authContext) {
  if (!authContext?.isCommerceAdmin) {
    return formData;
  }

  return {
    ...formData,
    role: "COMMERCE_USER",
    comercioId: authContext.comercioId || formData.comercioId || ""
  };
}
