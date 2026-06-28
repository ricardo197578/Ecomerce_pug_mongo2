import { getAuthContext } from "../utils/authContext.js";

// ============================================
// ARCHIVO: controllers/crud.controller.js
// FUNCIÓN: Fábrica que GENERA controladores CRUD completos
// ============================================

/**
 * buildCrudController - Fábrica de controladores CRUD
 * 
 * @param {Object} config - Configuración para el controlador
 * @param {string} config.title - Título de la entidad (ej: "Comercio")
 * @param {Object} config.service - Servicio con métodos CRUD (getAll, getById, create, update, remove)
 * @param {string} config.viewPath - Ruta base de las vistas (ej: "comercios")
 * @param {Object} config.formDefaults - Valores por defecto para el formulario
 * @returns {Object} - Controlador con métodos: list, showCreate, create, showDetail, showEdit, update, remove
 * 
 * Esta función genera un controlador completo con todos los métodos CRUD
 * basados en la configuración proporcionada.
 */
export function buildCrudController({ title, service, viewPath, formDefaults }) {
  
  // ============================================
  // RETORNA UN OBJETO CON TODOS LOS MÉTODOS CRUD
  // ============================================
  return {
    
    // ============================================
    // MÉTODO: list - LISTAR TODOS LOS REGISTROS
    // ============================================
    
    /**
     * list - Obtiene todos los registros y renderiza la vista de listado
     * 
     * @param {Object} _req - Objeto de petición (no usado, por eso _)
     * @param {Object} res - Objeto de respuesta
     * @param {Function} next - Función para pasar al siguiente middleware
     * 
     * Flujo:
     * 1. Obtiene todos los registros del servicio (service.getAll())
     * 2. Renderiza la vista con los datos
     * 3. Si hay error, pasa al middleware de manejo de errores
     * 
     * URL: GET /comercios/
     * Vista: views/comercios/index.ejs
     * Datos pasados: { title: "Comercio", items: [comercios] }
     */
    async list(req, res, next) {
      try {
        const authContext = getAuthContext(req);

        // Obtiene todos los registros de la entidad usando el servicio
        // Ejemplo: await comercioService.getAll() → array de comercios
        const items = await service.getAll(authContext);
        
        // Renderiza la vista de listado
        // viewPath + "/index" → "comercios/index"
        // Pasa el título y los items a la vista
        res.render(`${viewPath}/index`, { title, items });
      } catch (error) {
        // Si ocurre un error, lo pasa al middleware de errores de Express
        // El middleware capturará y manejará el error apropiadamente
        next(error);
      }
    },

    // ============================================
    // MÉTODO: showCreate - MOSTRAR FORMULARIO DE CREACIÓN
    // ============================================
    
    /**
     * showCreate - Muestra el formulario para crear un nuevo registro
     * 
     * @param {Object} _req - Objeto de petición (no usado)
     * @param {Object} res - Objeto de respuesta
     * 
     * Flujo:
     * 1. Renderiza el formulario con valores por defecto
     * 2. No hay lógica de base de datos (solo muestra el formulario)
     * 
     * URL: GET /comercios/new
     * Vista: views/comercios/form.ejs
     * Datos pasados: 
     *   - title: "Nuevo Comercio"
     *   - formData: { nombre: "", cuit: "", email: "", activo: true }
     *   - errorMessage: null
     *   - formAction: "" (para crear, no hay ID)
     *   - submitLabel: "Guardar"
     * 
     * NOTA: Este método NO es async porque no hace operaciones asíncronas
     */
    showCreate(_req, res) {
      // Renderiza el formulario de creación
      // La misma vista "form" se usa para crear y editar
      // Los valores por defecto vienen de formDefaults
      res.render(`${viewPath}/form`, {
        title: `Nuevo ${title}`,           // "Nuevo Comercio"
        formData: formDefaults,             // { nombre: "", cuit: "", email: "", activo: true }
        errorMessage: null,                 // Sin errores inicialmente
        formAction: "",                     // Vacío porque es creación (no hay ID)
        submitLabel: "Guardar"              // Texto del botón de submit
      });
    },

    // ============================================
    // MÉTODO: create - CREAR UN NUEVO REGISTRO
    // ============================================
    
    /**
     * create - Crea un nuevo registro en la base de datos
     * 
     * @param {Object} req - Objeto de petición (contiene req.body con los datos)
     * @param {Object} res - Objeto de respuesta
     * @param {Function} next - Función para pasar al siguiente middleware
     * 
     * Flujo:
     * 1. Intenta crear el registro con service.create(req.body)
     * 2. Si éxito: Redirige al listado (req.baseUrl)
     * 3. Si error de validación (statusCode < 500): Vuelve al formulario con error
     * 4. Si error crítico: Pasa al middleware de errores
     * 
     * URL: POST /comercios/
     * Datos en req.body: { nombre, cuit, email, activo }
     * 
     * NOTA: req.baseUrl es el prefijo de la ruta (ej: "/comercios")
     */
    async create(req, res, next) {
      try {
        const authContext = getAuthContext(req);

        // Intenta crear un nuevo registro con los datos del formulario
        // service.create valida y guarda en la base de datos
        await service.create(req.body, authContext);
        
        // Si tiene éxito, redirige a la lista de registros
        // req.baseUrl → "/comercios"
        // Redirige a GET /comercios/
        res.redirect(req.baseUrl);
      } catch (error) {
        // Manejo de errores de validación (errores del cliente)
        // Si el error tiene statusCode y es menor a 500 (error de cliente)
        if (error.statusCode && error.statusCode < 500) {
          // Vuelve a mostrar el formulario con:
          // 1. El error message
          // 2. Los datos que el usuario ya ingresó (para no perderlos)
          // 3. Código de estado HTTP correspondiente (400, 422, etc.)
          return res.status(error.statusCode).render(`${viewPath}/form`, {
            title: `Nuevo ${title}`,
            formData: { ...formDefaults, ...req.body }, // Combina defaults con lo enviado
            errorMessage: error.message,                 // Mensaje de error específico
            formAction: "",                              // Vacío (creación)
            submitLabel: "Guardar"
          });
        }
        // Si el error es del servidor (500+), lo pasa al middleware de errores
        // El middleware manejará errores internos (500, 503, etc.)
        next(error);
      }
    },

    // ============================================
    // MÉTODO: showDetail - MOSTRAR DETALLE DE UN REGISTRO
    // ============================================
    
    /**
     * showDetail - Muestra los detalles de un registro específico
     * 
     * @param {Object} req - Objeto de petición (contiene req.params.id)
     * @param {Object} res - Objeto de respuesta
     * @param {Function} next - Función para pasar al siguiente middleware
     * 
     * Flujo:
     * 1. Obtiene el ID de los parámetros de la URL (req.params.id)
     * 2. Busca el registro en la base de datos (service.getById)
     * 3. Renderiza la vista de detalle con los datos
     * 4. Si hay error (ej: registro no encontrado), pasa al middleware
     * 
     * URL: GET /comercios/123
     * Vista: views/comercios/show.ejs
     * Datos pasados: { title: "Comercio", item: { ...datos del comercio } }
     */
    async showDetail(req, res, next) {
      try {
        const authContext = getAuthContext(req);

        // Obtiene el ID del registro desde los parámetros de la URL
        // Ej: /comercios/123 → req.params.id = "123"
        const item = await service.getById(req.params.id, authContext);
        
        // Renderiza la vista de detalle con los datos del registro
        res.render(`${viewPath}/show`, { 
          title: title,   // "Comercio"
          item: item      // Datos del comercio específico
        });
      } catch (error) {
        // Si hay error (ej: ID no existe), pasa al middleware de errores
        // El middleware podría responder con 404 Not Found
        next(error);
      }
    },

    // ============================================
    // MÉTODO: showEdit - MOSTRAR FORMULARIO DE EDICIÓN
    // ============================================
    
    /**
     * showEdit - Muestra el formulario para editar un registro existente
     * 
     * @param {Object} req - Objeto de petición (contiene req.params.id)
     * @param {Object} res - Objeto de respuesta
     * @param {Function} next - Función para pasar al siguiente middleware
     * 
     * Flujo:
     * 1. Obtiene el ID de los parámetros
     * 2. Busca el registro en la base de datos
     * 3. Renderiza el formulario con los datos del registro precargados
     * 4. Si hay error (ej: registro no encontrado), pasa al middleware
     * 
     * URL: GET /comercios/123/edit
     * Vista: views/comercios/form.ejs (misma vista que creación)
     * Datos pasados:
     *   - title: "Editar Comercio"
     *   - formData: { ...datos del comercio }
     *   - errorMessage: null
     *   - formAction: "/123/edit" (para actualizar)
     *   - submitLabel: "Actualizar"
     */
    async showEdit(req, res, next) {
      try {
        const authContext = getAuthContext(req);

        // Obtiene el ID del registro desde la URL
        const item = await service.getById(req.params.id, authContext);
        
        // Renderiza el formulario con los datos del registro precargados
        res.render(`${viewPath}/form`, {
          title: `Editar ${title}`,           // "Editar Comercio"
          formData: item,                     // Datos del comercio a editar
          errorMessage: null,                 // Sin errores inicialmente
          formAction: `/${item._id}/edit`,    // URL para enviar el update
          submitLabel: "Actualizar"           // Texto del botón
        });
      } catch (error) {
        // Si el registro no existe o hay otro error, pasa al middleware
        next(error);
      }
    },

    // ============================================
    // MÉTODO: update - ACTUALIZAR UN REGISTRO
    // ============================================
    
    /**
     * update - Actualiza un registro existente
     * 
     * @param {Object} req - Objeto de petición (req.params.id, req.body)
     * @param {Object} res - Objeto de respuesta
     * @param {Function} next - Función para pasar al siguiente middleware
     * 
     * Flujo:
     * 1. Obtiene ID de la URL y datos del body
     * 2. Intenta actualizar con service.update(id, data)
     * 3. Si éxito: Redirige al listado
     * 4. Si error de validación: Vuelve al formulario con error
     * 5. Si error crítico: Pasa al middleware
     * 
     * URL: POST /comercios/123/edit
     * Datos en req.body: { nombre, cuit, email, activo }
     * 
     * NOTA: Es POST por compatibilidad con formularios HTML
     * En REST sería PUT /comercios/123
     */
    async update(req, res, next) {
      try {
        const authContext = getAuthContext(req);

        // Obtiene el ID de los parámetros y los datos del body
        // Actualiza el registro en la base de datos
        await service.update(req.params.id, req.body, authContext);
        
        // Si tiene éxito, redirige al listado
        res.redirect(req.baseUrl);
      } catch (error) {
        // Manejo de errores de validación (errores del cliente)
        if (error.statusCode && error.statusCode < 500) {
          // Vuelve al formulario con los datos y el error
          return res.status(error.statusCode).render(`${viewPath}/form`, {
            title: `Editar ${title}`,
            // Combina: ID de la URL + valores por defecto + datos enviados
            formData: { _id: req.params.id, ...formDefaults, ...req.body },
            errorMessage: error.message,
            formAction: `/${req.params.id}/edit`,
            submitLabel: "Actualizar"
          });
        }
        // Si es error de servidor, pasa al middleware
        next(error);
      }
    },

    // ============================================
    // MÉTODO: remove - ELIMINAR UN REGISTRO
    // ============================================
    
    /**
     * remove - Elimina un registro de la base de datos
     * 
     * @param {Object} req - Objeto de petición (req.params.id)
     * @param {Object} res - Objeto de respuesta
     * @param {Function} next - Función para pasar al siguiente middleware
     * 
     * Flujo:
     * 1. Obtiene el ID de la URL
     * 2. Intenta eliminar con service.remove(id)
     * 3. Si éxito: Redirige al listado
     * 4. Si error: Pasa al middleware de errores
     * 
     * URL: POST /comercios/123/delete
     * 
     * NOTA: Es POST por compatibilidad con formularios HTML
     * En REST sería DELETE /comercios/123
     * 
     * Este método generalmente NO muestra confirmación,
     * se asume que el frontend pide confirmación antes de llamar
     */
    async remove(req, res, next) {
      try {
        const authContext = getAuthContext(req);

        // Obtiene el ID de la URL y elimina el registro
        await service.remove(req.params.id, authContext);
        
        // Redirige al listado después de eliminar
        res.redirect(req.baseUrl);
      } catch (error) {
        // Si hay error (ej: registro no existe, error de BD, etc.)
        // Pasa al middleware de errores
        next(error);
      }
    }
  };
}

// ============================================
// EJEMPLO DE USO EN comercio.controller.js
// ============================================
// import { buildCrudController } from "./crud.controller.js";
// import { comercioService } from "../services/comercio.service.js";
// 
// export const comercioController = buildCrudController({
//   title: "Comercio",
//   service: comercioService,
//   viewPath: "comercios",
//   formDefaults: { nombre: "", cuit: "", email: "", activo: true }
// });
// 
// Esto genera automáticamente todos los métodos CRUD
// list, showCreate, create, showDetail, showEdit, update, remove

// ============================================
// FLUJO COMPLETO DE UNA OPERACIÓN CRUD
// ============================================
// 
// 1. LISTAR (GET /comercios)
//    controller.list → service.getAll() → render "comercios/index"
//
// 2. VER FORMULARIO DE CREACIÓN (GET /comercios/new)
//    controller.showCreate → render "comercios/form" con defaults
//
// 3. CREAR (POST /comercios)
//    controller.create → service.create(req.body) → redirect /comercios
//
// 4. VER DETALLE (GET /comercios/123)
//    controller.showDetail → service.getById(123) → render "comercios/show"
//
// 5. VER FORMULARIO DE EDICIÓN (GET /comercios/123/edit)
//    controller.showEdit → service.getById(123) → render "comercios/form"
//
// 6. ACTUALIZAR (POST /comercios/123/edit)
//    controller.update → service.update(123, req.body) → redirect /comercios
//
// 7. ELIMINAR (POST /comercios/123/delete)
//    controller.remove → service.remove(123) → redirect /comercios

// ============================================
// MANEJO DE ERRORES
// ============================================
// 
// Tipos de errores manejados:
// 
// 1. Errores de validación (statusCode < 500)
//    - Ej: campos obligatorios faltantes
//    - Ej: formato de email inválido
//    - Ej: CUIT duplicado
//    → Vuelven al formulario con el mensaje de error
// 
// 2. Errores del servidor (statusCode >= 500)
//    - Ej: error de conexión a BD
//    - Ej: error interno del servidor
//    → Pasan al middleware de errores de Express
// 
// 3. Errores de "no encontrado" (404)
//    - Ej: ID no existe en la base de datos
//    → Generalmente el servicio lanza error y se maneja en el middleware

// ============================================
// ESTRUCTURA DE LAS VISTAS ESPERADAS
// ============================================
// 
// views/
//   ├── comercios/
//   │   ├── index.ejs    → Listado de comercios (controller.list)
//   │   ├── form.ejs     → Formulario de creación/edición (showCreate, showEdit)
//   │   └── show.ejs     → Detalle de un comercio (showDetail)
//   ├── tiendas/
//   │   └── ...
//   └── productos/
//       └── ...

// ============================================
// VENTAJAS DE ESTE PATRÓN
// ============================================
// 
// 1. Reutilización: Un controlador para TODAS las entidades
// 2. Consistencia: Todas las entidades se comportan igual
// 3. Mantenimiento: Cambios en CRUD se aplican globalmente
// 4. Menos código: ~15 líneas por entidad vs ~200 líneas manual
// 5. Menos errores: Lógica probada y estandarizada
// 6. Extensible: Se puede agregar lógica específica si se necesita
// 7. Configuración declarativa: Solo cambia título, servicio, vistas, defaults
// 8. Escalable: Agregar nuevas entidades es trivial

// ============================================
// POSIBLES MEJORAS
// ============================================
// 
// 1. Paginación en list() para grandes volúmenes de datos
// 2. Filtros y búsqueda en list()
// 3. Relaciones con otras entidades (populate)
// 4. Middlewares específicos por entidad
// 5. Validación de permisos (roles)
// 6. Soft delete (marcar como eliminado en lugar de borrar)
// 7. Logging de operaciones
// 8. Cacheo de respuestas
// 9. Soporte para archivos adjuntos (upload)
// 10. Manejo de transacciones de base de datos
