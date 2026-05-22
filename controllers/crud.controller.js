export function buildCrudController({ title, service, viewPath, formDefaults }) {
  return {
    async list(_req, res, next) {
      try {
        const items = await service.getAll();
        res.render(`${viewPath}/index`, { title, items });
      } catch (error) {
        next(error);
      }
    },
    showCreate(_req, res) {
      res.render(`${viewPath}/form`, {
        title: `Nuevo ${title}`,
        formData: formDefaults,
        errorMessage: null,
        formAction: "",
        submitLabel: "Guardar"
      });
    },
    async create(req, res, next) {
      try {
        await service.create(req.body);
        res.redirect(req.baseUrl);
      } catch (error) {
        if (error.statusCode && error.statusCode < 500) {
          return res.status(error.statusCode).render(`${viewPath}/form`, {
            title: `Nuevo ${title}`,
            formData: { ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: "",
            submitLabel: "Guardar"
          });
        }
        next(error);
      }
    },
    async showDetail(req, res, next) {
      try {
        const item = await service.getById(req.params.id);
        res.render(`${viewPath}/show`, { title: title, item });
      } catch (error) {
        next(error);
      }
    },
    async showEdit(req, res, next) {
      try {
        const item = await service.getById(req.params.id);
        res.render(`${viewPath}/form`, {
          title: `Editar ${title}`,
          formData: item,
          errorMessage: null,
          formAction: `/${item._id}/edit`,
          submitLabel: "Actualizar"
        });
      } catch (error) {
        next(error);
      }
    },
    async update(req, res, next) {
      try {
        await service.update(req.params.id, req.body);
        res.redirect(req.baseUrl);
      } catch (error) {
        if (error.statusCode && error.statusCode < 500) {
          return res.status(error.statusCode).render(`${viewPath}/form`, {
            title: `Editar ${title}`,
            formData: { _id: req.params.id, ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: `/${req.params.id}/edit`,
            submitLabel: "Actualizar"
          });
        }
        next(error);
      }
    },
    async remove(req, res, next) {
      try {
        await service.remove(req.params.id);
        res.redirect(req.baseUrl);
      } catch (error) {
        next(error);
      }
    }
  };
}
