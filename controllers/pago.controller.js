import { comercioService } from "../services/comercio.service.js";
import { pagoService } from "../services/pago.service.js";
import { transaccionService } from "../services/transaccion.service.js";
import { usuarioService } from "../services/usuario.service.js";

const formDefaults = { transaccionId: "", estado: "PENDIENTE", detalle: "" };

async function loadFormOptions() {
  const [transacciones, comercios, usuarios] = await Promise.all([
    transaccionService.getAll(),
    comercioService.getAll(),
    usuarioService.getAll()
  ]);
  const comerciosById = new Map(comercios.map((comercio) => [String(comercio._id), comercio]));
  const usuariosById = new Map(usuarios.map((usuario) => [String(usuario._id), usuario]));
  const transaccionesView = transacciones.map((transaccion) => {
    const comercio = comerciosById.get(String(transaccion.comercioId));
    const usuario = usuariosById.get(String(transaccion.usuarioId));
    return {
      ...transaccion,
      comercioNombre: comercio ? comercio.nombre : "Sin comercio",
      usuarioNombre: usuario ? usuario.nombre : "Sin usuario"
    };
  });
  return { transacciones: transaccionesView };
}

export const pagoController = {
  async list(_req, res, next) {
    try {
      const [items, comercios, usuarios] = await Promise.all([
        pagoService.getAll(),
        comercioService.getAll(),
        usuarioService.getAll()
      ]);
      const comerciosById = new Map(comercios.map((comercio) => [String(comercio._id), comercio]));
      const usuariosById = new Map(usuarios.map((usuario) => [String(usuario._id), usuario]));
      const itemsView = items.map((item) => {
        const comercio = comerciosById.get(String(item.comercioId));
        const usuario = usuariosById.get(String(item.usuarioId));
        return {
          ...item,
          comercioNombre: comercio ? comercio.nombre : "-",
          usuarioNombre: usuario ? usuario.nombre : "-"
        };
      });
      res.render("pagos/index", { title: "Pago", items: itemsView });
    } catch (error) {
      next(error);
    }
  },
  async showCreate(_req, res, next) {
    try {
      const options = await loadFormOptions();
      res.render("pagos/form", {
        title: "Nuevo Pago",
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
      await pagoService.create(req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const options = await loadFormOptions();
          return res.status(error.statusCode).render("pagos/form", {
            title: "Nuevo Pago",
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
      const item = await pagoService.getById(req.params.id);
      res.render("pagos/show", { title: "Pago", item });
    } catch (error) {
      next(error);
    }
  },
  async showEdit(req, res, next) {
    try {
      const [item, options] = await Promise.all([
        pagoService.getById(req.params.id),
        loadFormOptions()
      ]);
      res.render("pagos/form", {
        title: "Editar Pago",
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
      await pagoService.update(req.params.id, req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const options = await loadFormOptions();
          return res.status(error.statusCode).render("pagos/form", {
            title: "Editar Pago",
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
      await pagoService.remove(req.params.id);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  }
};
