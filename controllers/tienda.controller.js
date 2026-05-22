import { comercioService } from "../services/comercio.service.js";
import { tiendaService } from "../services/tienda.service.js";

const formDefaults = { comercioId: "", nombre: "", descripcion: "", activa: true };

export const tiendaController = {
  async list(_req, res, next) {
    try {
      const [items, comercios] = await Promise.all([
        tiendaService.getAll(),
        comercioService.getAll()
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
  async showCreate(_req, res, next) {
    try {
      const comercios = await comercioService.getAll();
      res.render("tiendas/form", {
        title: "Nueva Tienda",
        formData: formDefaults,
        errorMessage: null,
        formAction: "",
        submitLabel: "Guardar",
        comercios
      });
    } catch (error) {
      next(error);
    }
  },
  async create(req, res, next) {
    try {
      await tiendaService.create(req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const comercios = await comercioService.getAll();
          return res.status(error.statusCode).render("tiendas/form", {
            title: "Nueva Tienda",
            formData: { ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: "",
            submitLabel: "Guardar",
            comercios
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
      const item = await tiendaService.getById(req.params.id);
      res.render("tiendas/show", { title: "Tienda", item });
    } catch (error) {
      next(error);
    }
  },
  async showEdit(req, res, next) {
    try {
      const [item, comercios] = await Promise.all([
        tiendaService.getById(req.params.id),
        comercioService.getAll()
      ]);
      res.render("tiendas/form", {
        title: "Editar Tienda",
        formData: item,
        errorMessage: null,
        formAction: `/${item._id}/edit`,
        submitLabel: "Actualizar",
        comercios
      });
    } catch (error) {
      next(error);
    }
  },
  async update(req, res, next) {
    try {
      await tiendaService.update(req.params.id, req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const comercios = await comercioService.getAll();
          return res.status(error.statusCode).render("tiendas/form", {
            title: "Editar Tienda",
            formData: { _id: req.params.id, ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: `/${req.params.id}/edit`,
            submitLabel: "Actualizar",
            comercios
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
      await tiendaService.remove(req.params.id);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  }
};
