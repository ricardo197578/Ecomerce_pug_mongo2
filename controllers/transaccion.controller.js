import { comercioService } from "../services/comercio.service.js";
import { tiendaService } from "../services/tienda.service.js";
import { transaccionService } from "../services/transaccion.service.js";
import { usuarioService } from "../services/usuario.service.js";

const formDefaults = { comercioId: "", tiendaId: "", usuarioId: "", monto: "", moneda: "ARS", descripcion: "" };

async function loadFormOptions() {
  const [comercios, tiendas, usuarios] = await Promise.all([
    comercioService.getAll(),
    tiendaService.getAll(),
    usuarioService.getAll()
  ]);
  const comerciosById = new Map(comercios.map((comercio) => [String(comercio._id), comercio]));
  const tiendasById = new Map(tiendas.map((tienda) => [String(tienda._id), tienda]));

  const tiendasView = tiendas.map((tienda) => {
    const comercio = comerciosById.get(String(tienda.comercioId));
    return {
      ...tienda,
      comercioNombre: comercio ? comercio.nombre : "Sin comercio"
    };
  });

  const usuariosView = usuarios.map((usuario) => {
    const tienda = tiendasById.get(String(usuario.tiendaId));
    return {
      ...usuario,
      tiendaNombre: tienda ? tienda.nombre : "Sin tienda"
    };
  });

  return { comercios, tiendas: tiendasView, usuarios: usuariosView };
}

export const transaccionController = {
  async list(_req, res, next) {
    try {
      const [items, comercios, tiendas, usuarios] = await Promise.all([
        transaccionService.getAll(),
        comercioService.getAll(),
        tiendaService.getAll(),
        usuarioService.getAll()
      ]);
      const comerciosById = new Map(comercios.map((comercio) => [String(comercio._id), comercio]));
      const tiendasById = new Map(tiendas.map((tienda) => [String(tienda._id), tienda]));
      const usuariosById = new Map(usuarios.map((usuario) => [String(usuario._id), usuario]));
      const itemsView = items.map((item) => {
        const comercio = comerciosById.get(String(item.comercioId));
        const tienda = tiendasById.get(String(item.tiendaId));
        const usuario = usuariosById.get(String(item.usuarioId));
        return {
          ...item,
          comercioNombre: comercio ? comercio.nombre : "-",
          tiendaNombre: tienda ? tienda.nombre : "-",
          usuarioNombre: usuario ? usuario.nombre : "-"
        };
      });
      res.render("transacciones/index", { title: "Transaccion", items: itemsView });
    } catch (error) {
      next(error);
    }
  },
  async showCreate(_req, res, next) {
    try {
      const options = await loadFormOptions();
      res.render("transacciones/form", {
        title: "Nueva Transaccion",
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
      await transaccionService.create(req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const options = await loadFormOptions();
          return res.status(error.statusCode).render("transacciones/form", {
            title: "Nueva Transaccion",
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
      const item = await transaccionService.getById(req.params.id);
      res.render("transacciones/show", { title: "Transaccion", item });
    } catch (error) {
      next(error);
    }
  },
  async showEdit(req, res, next) {
    try {
      const [item, options] = await Promise.all([
        transaccionService.getById(req.params.id),
        loadFormOptions()
      ]);
      res.render("transacciones/form", {
        title: "Editar Transaccion",
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
      await transaccionService.update(req.params.id, req.body);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const options = await loadFormOptions();
          return res.status(error.statusCode).render("transacciones/form", {
            title: "Editar Transaccion",
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
      await transaccionService.remove(req.params.id);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  }
};
