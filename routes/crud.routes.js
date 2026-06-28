// ============================================
// ARCHIVO: routes/crud.routes.js
// FUNCIÓN: Fábrica que GENERA rutas CRUD automáticamente
// ============================================

// Importa el constructor de enrutadores de Express
// Router() permite crear un conjunto de rutas agrupadas
import { Router } from "express";

// ============================================
// EXPORTACIÓN DE LA FUNCIÓN FÁBRICA
// ============================================

/**
 * buildCrudRoutes - Fábrica de rutas CRUD
 * 
 * @param {Object} controller - Controlador con métodos CRUD
 * @returns {Router} - Router de Express con todas las rutas CRUD configuradas
 * 
 * Esta función toma un controlador que tenga los métodos:
 * - list: Listar todos los registros
 * - showCreate: Mostrar formulario de creación
 * - create: Crear un nuevo registro
 * - showDetail: Mostrar detalle de un registro
 * - showEdit: Mostrar formulario de edición
 * - update: Actualizar un registro
 * - remove: Eliminar un registro
 * 
 * Y genera automáticamente TODAS las rutas necesarias
 */
export function buildCrudRoutes(controller, middlewares = {}) {
  // Crea un nuevo enrutador independiente
  // Este router contendrá SOLO las rutas CRUD para una entidad específica
  const router = Router();

  // ============================================
  // RUTA PARA LISTAR TODOS LOS REGISTROS
  // ============================================
  
  /**
   * GET / → Lista todos los registros de la entidad
   * 
   * Ejemplo: GET /comercios/
   * → Muestra la lista de todos los comercios
   * 
   * El controlador obtiene los datos del servicio y renderiza la vista
   */
  router.get("/", ...getRouteMiddlewares(middlewares, "list"), controller.list);

  // ============================================
  // RUTA PARA MOSTRAR FORMULARIO DE CREACIÓN
  // ============================================
  
  /**
   * GET /new → Muestra el formulario para crear un nuevo registro
   * 
   * Ejemplo: GET /comercios/new
   * → Muestra el formulario vacío para crear un nuevo comercio
   * 
   * NOTA: Se usa "/new" en lugar de "/create" (más RESTful)
   * El controlador renderiza el formulario con valores por defecto
   */
  router.get("/new", ...getRouteMiddlewares(middlewares, "showCreate"), controller.showCreate);

  // ============================================
  // RUTA PARA CREAR UN NUEVO REGISTRO
  // ============================================
  
  /**
   * POST / → Crea un nuevo registro
   * 
   * Ejemplo: POST /comercios/
   * → Recibe datos del formulario y crea un nuevo comercio
   * 
   * Los datos vienen en req.body
   * El controlador valida, crea y redirige al listado
   */
  router.post("/", ...getRouteMiddlewares(middlewares, "create"), controller.create);

  // ============================================
  // RUTA PARA MOSTRAR DETALLE DE UN REGISTRO
  // ============================================
  
  /**
   * GET /:id → Muestra el detalle de un registro específico
   * 
   * Ejemplo: GET /comercios/123
   * → Muestra los detalles del comercio con ID 123
   * 
   * :id es un parámetro dinámico que captura el ID de la URL
   * El controlador obtiene el registro por ID y renderiza la vista
   */
  router.get("/:id", ...getRouteMiddlewares(middlewares, "showDetail"), controller.showDetail);

  // ============================================
  // RUTA PARA MOSTRAR FORMULARIO DE EDICIÓN
  // ============================================
  
  /**
   * GET /:id/edit → Muestra el formulario para editar un registro
   * 
   * Ejemplo: GET /comercios/123/edit
   * → Muestra el formulario con los datos del comercio 123 precargados
   * 
   * El controlador obtiene el registro por ID y renderiza el formulario
   * con los datos existentes para que el usuario pueda modificarlos
   */
  router.get("/:id/edit", ...getRouteMiddlewares(middlewares, "showEdit"), controller.showEdit);

  // ============================================
  // RUTA PARA ACTUALIZAR UN REGISTRO
  // ============================================
  
  /**
   * POST /:id/edit → Actualiza un registro existente
   * 
   * Ejemplo: POST /comercios/123/edit
   * → Recibe datos modificados y actualiza el comercio 123
   * 
   * NOTA: Se usa POST en lugar de PUT/PATCH por compatibilidad
   * con formularios HTML (que solo soportan GET y POST)
   * 
   * El controlador recibe el ID y los datos actualizados,
   * valida, actualiza y redirige al listado
   */
  router.post("/:id/edit", ...getRouteMiddlewares(middlewares, "update"), controller.update);

  // ============================================
  // RUTA PARA ELIMINAR UN REGISTRO
  // ============================================
  
  /**
   * POST /:id/delete → Elimina un registro
   * 
   * Ejemplo: POST /comercios/123/delete
   * → Elimina el comercio con ID 123
   * 
   * NOTA: Se usa POST en lugar de DELETE por compatibilidad
   * con formularios HTML (que solo soportan GET y POST)
   * 
   * En la práctica, muchos sistemas usan un botón en un formulario
   * que envía esta petición POST para eliminar el registro
   * 
   * El controlador elimina el registro y redirige al listado
   */
  router.post("/:id/delete", ...getRouteMiddlewares(middlewares, "remove"), controller.remove);

  // ============================================
  // RETORNA EL ENRUTADOR CONFIGURADO
  // ============================================
  
  /**
   * Devuelve el router con TODAS las rutas CRUD configuradas
   * 
   * Este router se monta en el index.js con:
   * router.use("/comercios", buildCrudRoutes(comercioController));
   * 
   * El resultado final es que todas estas rutas estarán disponibles
   * bajo el prefijo /comercios
   */
  return router;
}

function getRouteMiddlewares(middlewares, routeName) {
  return [...toArray(middlewares.all), ...toArray(middlewares[routeName])];
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

// ============================================
// EJEMPLO DE USO EN index.js
// ============================================
// import { buildCrudRoutes } from "./crud.routes.js";
// import { comercioController } from "../controllers/comercio.controller.js";
// 
// router.use("/comercios", buildCrudRoutes(comercioController));
// 
// Esto genera automáticamente:
// GET    /comercios/           → controller.list
// GET    /comercios/new        → controller.showCreate
// POST   /comercios/           → controller.create
// GET    /comercios/:id        → controller.showDetail
// GET    /comercios/:id/edit   → controller.showEdit
// POST   /comercios/:id/edit   → controller.update
// POST   /comercios/:id/delete → controller.remove

// ============================================
// DIFERENCIAS CON VERSIÓN REST ESTÁNDAR
// ============================================
// Versión REST estándar (con PUT y DELETE):
// PUT    /comercios/:id        → controller.update
// DELETE /comercios/:id        → controller.remove
//
// Versión actual (compatible con HTML forms):
// POST   /comercios/:id/edit   → controller.update
// POST   /comercios/:id/delete → controller.remove
//
// Razón: Los formularios HTML solo soportan GET y POST naturalmente
// Para usar PUT/DELETE necesitarías override con _method o JavaScript

// ============================================
// FLUJO COMPLETO DE UNA PETICIÓN
// ============================================
// 1. Usuario navega a /comercios/new
// 2. Express recibe la petición GET
// 3. Busca en el router principal (index.js)
// 4. Encuentra router.use("/comercios", buildCrudRoutes(...))
// 5. Dentro del router generado, encuentra GET /new
// 6. Ejecuta controller.showCreate
// 7. Renderiza el formulario de creación
// 8. Usuario completa el formulario y hace submit a POST /comercios/
// 9. Express recibe POST /comercios/
// 10. Ejecuta controller.create
// 11. Guarda el nuevo registro en la base de datos
// 12. Redirige a /comercios/ (listado)

// ============================================
// VENTAJAS DE ESTE ENFOQUE
// ============================================
// 1. DRY (Don't Repeat Yourself): No repetir rutas para cada entidad
// 2. Consistencia: Todas las entidades tienen las mismas rutas
// 3. Mantenible: Un solo cambio afecta a todas las entidades
// 4. Configuración declarativa: Solo defines el controlador
// 5. Menos errores: La lógica de rutas está probada
// 6. Escalable: Agregar nuevas entidades es trivial

// ============================================
// POSIBLES MEJORAS
// ============================================
// 1. Soporte para PUT/DELETE (con override)
// 2. Middlewares específicos por ruta
// 3. Validación de parámetros
// 4. Paginación en listado
// 5. Filtros y búsqueda en listado
// 6. Soporte para subida de archivos
// 7. Cacheo de respuestas
// 8. Manejo de versionado de API
