import { comercioService } from "../services/comercio.service.js";
import { accountService } from "../services/account.service.js";
import { tiendaService } from "../services/tienda.service.js";

const formDefaults = {
  email: "",
  password: "",
  role: "COMMERCE_ADMIN",
  comercioId: "",
  tiendaId: "",
  activo: true
};

async function loadFormOptions() {
  const [comercios, tiendas] = await Promise.all([
    comercioService.getAll(),
    tiendaService.getAll()
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
      const [items, comercios, tiendas] = await Promise.all([
        accountService.getAll(),
        comercioService.getAll(),
        tiendaService.getAll()
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
        items: itemsView
      });
    } catch (error) {
      next(error);
    }
  },

  async showCreate(_req, res, next) {
    try {
      const options = await loadFormOptions();
      res.render("cuentas-comercio/form", {
        title: "Nueva cuenta de comercio",
        formData: formDefaults,
        errorMessage: null,
        formAction: "",
        submitLabel: "Guardar",
        isEdit: false,
        ...options
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      await accountService.create(req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const options = await loadFormOptions();
          return res.status(error.statusCode).render("cuentas-comercio/form", {
            title: "Nueva cuenta de comercio",
            formData: { ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: "",
            submitLabel: "Guardar",
            isEdit: false,
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
      const [item, comercios, tiendas] = await Promise.all([
        accountService.getById(req.params.id),
        comercioService.getAll(),
        tiendaService.getAll()
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
      const [item, options] = await Promise.all([
        accountService.getById(req.params.id),
        loadFormOptions()
      ]);
      res.render("cuentas-comercio/form", {
        title: "Editar cuenta de comercio",
        formData: { ...item, password: "" },
        errorMessage: null,
        formAction: `/${item._id}/edit`,
        submitLabel: "Actualizar",
        isEdit: true,
        ...options
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      await accountService.update(req.params.id, req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const options = await loadFormOptions();
          return res.status(error.statusCode).render("cuentas-comercio/form", {
            title: "Editar cuenta de comercio",
            formData: { _id: req.params.id, ...formDefaults, ...req.body, password: "" },
            errorMessage: error.message,
            formAction: `/${req.params.id}/edit`,
            submitLabel: "Actualizar",
            isEdit: true,
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
      await accountService.remove(req.params.id);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  }
};
