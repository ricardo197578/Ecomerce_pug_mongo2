import { Router } from "express";

export function buildCrudRoutes(controller) {
  const router = Router();
  router.get("/", controller.list);
  router.get("/new", controller.showCreate);
  router.post("/", controller.create);
  router.get("/:id", controller.showDetail);
  router.get("/:id/edit", controller.showEdit);
  router.post("/:id/edit", controller.update);
  router.post("/:id/delete", controller.remove);
  return router;
}
