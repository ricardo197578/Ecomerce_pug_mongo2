import { comercioService } from "../services/comercio.service.js";
import { suscripcionService } from "../services/suscripcion.service.js";

const formDefaults = {
  comercioId: "",
  planNombre: "",
  cuotaMensual: "",
  comisionPorcentaje: "",
  moneda: "ARS",
  estado: "ACTIVA",
  fechaInicio: "",
  fechaRenovacion: ""
};

async function loadFormOptions() {
  const comercios = await comercioService.getAll();
  return { comercios };
}

export const suscripcionController = {
  async list(_req, res, next) {
    try {
      const [items, comercios] = await Promise.all([
        suscripcionService.getAll(),
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
      res.render("suscripciones/index", { title: "Suscripcion", items: itemsView });
    } catch (error) {
      next(error);
    }
  },
  async showCreate(_req, res, next) {
    try {
      const options = await loadFormOptions();
      res.render("suscripciones/form", {
        title: "Nueva Suscripcion",
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
      await suscripcionService.create(req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const options = await loadFormOptions();
          return res.status(error.statusCode).render("suscripciones/form", {
            title: "Nueva Suscripcion",
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
      const item = await suscripcionService.getById(req.params.id);
      res.render("suscripciones/show", { title: "Suscripcion", item });
    } catch (error) {
      next(error);
    }
  },
  async showEdit(req, res, next) {
    try {
      const [item, options] = await Promise.all([
        suscripcionService.getById(req.params.id),
        loadFormOptions()
      ]);
      res.render("suscripciones/form", {
        title: "Editar Suscripcion",
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
      await suscripcionService.update(req.params.id, req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const options = await loadFormOptions();
          return res.status(error.statusCode).render("suscripciones/form", {
            title: "Editar Suscripcion",
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
      await suscripcionService.remove(req.params.id);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  }
};
