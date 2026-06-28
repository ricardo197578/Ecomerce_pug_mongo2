import { comercioService } from "../services/comercio.service.js";
import { tiendaService } from "../services/tienda.service.js";
import { getAuthContext } from "../utils/authContext.js";

const formDefaults = { comercioId: "", nombre: "", descripcion: "", activa: true };

async function loadFormOptions(authContext) {
  const comercios = await comercioService.getAll(authContext);
  return {
    comercios,
    canSelectComercio: !authContext.isCommerceActor,
    selectedComercio: comercios[0] || null
  };
}

export const tiendaController = {
  async list(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const [items, comercios] = await Promise.all([
        tiendaService.getAll(authContext),
        comercioService.getAll(authContext)
      ]);
      const comerciosById = new Map(comercios.map((comercio) => [String(comercio._id), comercio]));
      const itemsView = items.map((item) => {
        const comercio = comerciosById.get(String(item.comercioId));
        return {
          ...item,
          comercioNombre: comercio ? comercio.nombre : "-"
        };
      });
      res.render("tiendas/index", { title: "Tienda", items: itemsView });
    } catch (error) {
      next(error);
    }
  },
  async showCreate(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const options = await loadFormOptions(authContext);
      res.render("tiendas/form", {
        title: "Nueva Tienda",
        formData: formDefaults,
        errorMessage: null,
        formAction: "",
        submitLabel: "Guardar",
        ...options
      });
    } catch (error) {
      next(error);
    }
  },
  async create(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await tiendaService.create(req.body, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const authContext = getAuthContext(req);
          const options = await loadFormOptions(authContext);
          return res.status(error.statusCode).render("tiendas/form", {
            title: "Nueva Tienda",
            formData: { ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: "",
            submitLabel: "Guardar",
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
      const item = await tiendaService.getById(req.params.id, authContext);
      res.render("tiendas/show", { title: "Tienda", item });
    } catch (error) {
      next(error);
    }
  },
  async showEdit(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const [item, options] = await Promise.all([
        tiendaService.getById(req.params.id, authContext),
        loadFormOptions(authContext)
      ]);
      res.render("tiendas/form", {
        title: "Editar Tienda",
        formData: item,
        errorMessage: null,
        formAction: `/${item._id}/edit`,
        submitLabel: "Actualizar",
        ...options
      });
    } catch (error) {
      next(error);
    }
  },
  async update(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      await tiendaService.update(req.params.id, req.body, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const authContext = getAuthContext(req);
          const options = await loadFormOptions(authContext);
          return res.status(error.statusCode).render("tiendas/form", {
            title: "Editar Tienda",
            formData: { _id: req.params.id, ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: `/${req.params.id}/edit`,
            submitLabel: "Actualizar",
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
      await tiendaService.remove(req.params.id, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  }
};
