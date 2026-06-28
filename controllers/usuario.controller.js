import { comercioService } from "../services/comercio.service.js";
import { tiendaService } from "../services/tienda.service.js";
import { usuarioService } from "../services/usuario.service.js";
import { getAuthContext } from "../utils/authContext.js";

const formDefaults = { comercioId: "", tiendaId: "", nombre: "", email: "", activo: true };

async function loadFormOptions(authContext) {
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
  return {
    comercios,
    tiendas: tiendasView,
    canSelectComercio: !authContext.isCommerceActor,
    selectedComercio: comercios[0] || null
  };
}

export const usuarioController = {
  async list(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const [items, comercios, tiendas] = await Promise.all([
        usuarioService.getAll(authContext),
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
          tiendaNombre: tienda ? tienda.nombre : "-"
        };
      });
      res.render("usuarios/index", { title: "Usuario", items: itemsView });
    } catch (error) {
      next(error);
    }
  },
  async showCreate(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const options = await loadFormOptions(authContext);
      res.render("usuarios/form", {
        title: "Nuevo Usuario",
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
      await usuarioService.create(req.body, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const authContext = getAuthContext(req);
          const options = await loadFormOptions(authContext);
          return res.status(error.statusCode).render("usuarios/form", {
            title: "Nuevo Usuario",
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
      const item = await usuarioService.getById(req.params.id, authContext);
      res.render("usuarios/show", { title: "Usuario", item });
    } catch (error) {
      next(error);
    }
  },
  async showEdit(req, res, next) {
    try {
      const authContext = getAuthContext(req);
      const [item, options] = await Promise.all([
        usuarioService.getById(req.params.id, authContext),
        loadFormOptions(authContext)
      ]);
      res.render("usuarios/form", {
        title: "Editar Usuario",
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
      await usuarioService.update(req.params.id, req.body, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      if (error.statusCode && error.statusCode < 500) {
        try {
          const authContext = getAuthContext(req);
          const options = await loadFormOptions(authContext);
          return res.status(error.statusCode).render("usuarios/form", {
            title: "Editar Usuario",
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
      await usuarioService.remove(req.params.id, authContext);
      res.redirect(req.baseUrl);
    } catch (error) {
      next(error);
    }
  }
};
