
// ARCHIVO: services/comercio.service.js
// FUNCIÓN: Lógica de negocio para la entidad Comercio

// Importa el repositorio de comercios (capa de acceso a datos)
// El repositorio contiene métodos CRUD para interactuar con MongoDB
import { comercioRepository } from "../repositories/comercio.repository.js";

// Importa la clase HttpError para manejar errores HTTP estandarizados
// Permite lanzar errores con código de estado y mensajes específicos
import { HttpError } from "../utils/httpError.js";
import { ensureTenantAccess, resolveScopedComercioId } from "../utils/authContext.js";

// Importa la función helper para manejar errores de clave única en MongoDB
// handleMongoUnique captura errores de duplicación (índices únicos)
import { handleMongoUnique } from "./helpers.js";

// ============================================
// EXPORTACIÓN DEL SERVICIO DE COMERCIOS
// ============================================

export const comercioService = {
  // ==========================================
  // getAll - OBTENER TODOS LOS COMERCIOS
  // ==========================================
  
  /**
   * getAll - Retorna todos los comercios de la base de datos
   * 
   * @returns {Promise<Array>} - Lista de todos los comercios
   * 
   * Uso: Obtener todos los registros para listarlos en la vista
   * Ejemplo: const comercios = await comercioService.getAll();
   * 
   * NOTA: Este método NO maneja errores porque findAll() siempre
   * retorna un array (vacío si no hay registros), nunca lanza error
   */
  async getAll(authContext = null) {
    const scopedComercioId = resolveScopedComercioId(authContext, null);

    if (scopedComercioId) {
      const item = await comercioRepository.findById(scopedComercioId);
      return item ? [item] : [];
    }

    return comercioRepository.findAll();
  },

  // ==========================================
  // getById - OBTENER COMERCIO POR ID
  // ==========================================
  
  /**
   * getById - Busca un comercio por su ID
   * 
   * @param {string} id - ID del comercio a buscar
   * @returns {Promise<Object>} - El comercio encontrado
   * @throws {HttpError} - 404 si el comercio no existe
   * 
   * Uso: Obtener un comercio específico para editar o ver detalle
   * Ejemplo: const comercio = await comercioService.getById("123");
   * 
   * Flujo:
   * 1. Busca el comercio en la BD
   * 2. Si no existe, lanza error 404
   * 3. Si existe, retorna el comercio
   */
  async getById(id, authContext = null) {
    // Busca el comercio por ID en el repositorio
    // Ejecuta: db.comercios.findById(id)
    const item = await comercioRepository.findById(id);
    
    // Si no se encontró el comercio, lanza un error 404
    // El error será capturado por el controlador y mostrado al usuario
    if (!item) throw new HttpError(404, "NOT_FOUND", "Comercio no encontrado.");
    ensureTenantAccess(item, authContext, "Comercio");
    
    // Retorna el comercio encontrado
    return item;
  },

  // ==========================================
  // create - CREAR UN NUEVO COMERCIO
  // ==========================================
  
  /**
   * create - Crea un nuevo comercio en la base de datos
   * 
   * @param {Object} payload - Datos del comercio a crear
   * @param {string} payload.nombre - Nombre del comercio (obligatorio)
   * @param {string} payload.cuit - CUIT del comercio (obligatorio, único)
   * @param {string} payload.email - Email del comercio (obligatorio)
   * @param {boolean|string} payload.activo - Estado del comercio
   * @returns {Promise<Object>} - El comercio creado (con _id y timestamps)
   * @throws {HttpError} - 400 si validación falla
   * @throws {HttpError} - 409 si el CUIT ya existe
   * 
   * Uso: Crear un nuevo comercio desde el formulario
   * Ejemplo: await comercioService.create({ nombre: "Tienda A", cuit: "20-12345678-9", ... })
   * 
   * Flujo:
   * 1. Normaliza los datos (limpieza y formato)
   * 2. Valida que los campos obligatorios estén presentes
   * 3. Intenta guardar en la BD
   * 4. Si hay error de CUIT duplicado, lanza error 409
   */
  async create(payload) {
    // Paso 1: Normalizar los datos
    // Convierte strings, recorta espacios, pasa email a minúsculas
    // Normaliza el campo 'activo' (true/false)
    const normalized = normalizePayload(payload);
    
    // Paso 2: Validar los datos
    // Verifica que nombre, cuit y email estén presentes
    validatePayload(normalized);
    
    try {
      // Paso 3: Intentar guardar en la base de datos
      // El repositorio ejecuta: db.comercios.insertOne(normalized)
      return await comercioRepository.create(normalized);
    } catch (error) {
      // Paso 4: Manejar errores de clave única (CUIT duplicado)
      // Si el error es de duplicación, lanza un error 409 con mensaje personalizado
      // Si es otro error, lo relanza
      handleMongoUnique(error, "Ya existe un comercio con ese CUIT.");
    }
  },

  // ==========================================
  // update - ACTUALIZAR UN COMERCIO EXISTENTE
  // ==========================================
  
  /**
   * update - Actualiza un comercio existente
   * 
   * @param {string} id - ID del comercio a actualizar
   * @param {Object} payload - Datos nuevos para actualizar
   * @returns {Promise<Object>} - El comercio actualizado
   * @throws {HttpError} - 404 si el comercio no existe
   * @throws {HttpError} - 400 si validación falla
   * @throws {HttpError} - 409 si el CUIT ya existe en otro registro
   * 
   * Uso: Actualizar un comercio desde el formulario de edición
   * Ejemplo: await comercioService.update("123", { nombre: "Tienda A Actualizada" })
   * 
   * Flujo:
   * 1. Verifica que el comercio exista (getById)
   * 2. Fusiona datos actuales con nuevos (para no perder campos)
   * 3. Normaliza y valida
   * 4. Intenta actualizar en la BD
   * 5. Maneja errores de duplicación
   */
  async update(id, payload) {
    // Paso 1: Verificar que el comercio existe
    // Si no existe, getById lanza error 404
    const current = await comercioRepository.findById(id);
    if (!current) throw new HttpError(404, "NOT_FOUND", "Comercio no encontrado.");
    
    // Paso 2: Fusionar datos actuales con los nuevos
    // Esto permite actualizar solo algunos campos sin perder el resto
    // Ej: si solo actualizas nombre, los demás campos se mantienen
    const normalized = normalizePayload({ ...current, ...payload });
    
    // Paso 3: Validar los datos (mismas reglas que create)
    validatePayload(normalized);
    
    try {
      // Paso 4: Intentar actualizar en la base de datos
      // El repositorio ejecuta: db.comercios.updateOne({ _id: id }, { $set: normalized })
      return await comercioRepository.update(id, normalized);
    } catch (error) {
      // Paso 5: Manejar errores de clave única (CUIT duplicado)
      // Si se intenta poner un CUIT que ya existe en otro registro
      handleMongoUnique(error, "Ya existe un comercio con ese CUIT.");
    }
  },

  // ==========================================
  // remove - ELIMINAR UN COMERCIO
  // ==========================================
  
  /**
   * remove - Elimina un comercio de la base de datos
   * 
   * @param {string} id - ID del comercio a eliminar
   * @returns {Promise<void>} - No retorna nada si es exitoso
   * @throws {HttpError} - 404 si el comercio no existe
   * 
   * Uso: Eliminar un comercio desde la lista
   * Ejemplo: await comercioService.remove("123");
   * 
   * Flujo:
   * 1. Intenta eliminar el comercio en la BD
   * 2. Si no se eliminó ningún documento, lanza error 404
   * 3. Si se eliminó, retorna sin errores
   * 
   * NOTA: Esta es una eliminación física (hard delete)
   * Para soft delete, se marcaría como inactivo
   */
  async remove(id) {
    // Paso 1: Intentar eliminar el comercio
    // El repositorio ejecuta: db.comercios.deleteOne({ _id: id })
    // Retorna true si se eliminó, false si no existía
    const deleted = await comercioRepository.remove(id);
    
    // Paso 2: Si no se eliminó, lanzar error 404
    // Esto indica que el comercio no existe
    if (!deleted) throw new HttpError(404, "NOT_FOUND", "Comercio no encontrado.");
    
    // Si se eliminó, no retorna nada (void)
    // El controlador redirigirá al listado
  }
};

// ============================================
// FUNCIONES PRIVADAS (Helpers del servicio)
// ============================================

/**
 * normalizePayload - Normaliza los datos del comercio
 * 
 * @param {Object} payload - Datos a normalizar
 * @returns {Object} - Datos normalizados con tipos correctos
 * 
 * Funciones de normalización:
 * 1. nombre → String, recorta espacios en blanco
 * 2. cuit → String, recorta espacios en blanco
 * 3. email → String, recorta espacios en blanco, convierte a minúsculas
 * 4. activo → Boolean (true/false) desde diferentes formatos
 * 
 * ¿Por qué normalizar?
 * - Asegura consistencia en la base de datos
 * - Evita errores de tipo (ej: activo como string vs boolean)
 * - Facilita búsquedas (email en minúsculas para búsquedas case-insensitive)
 * - Limpia datos de entrada (espacios extra)
 * 
 * Ejemplo de entrada:
 * { nombre: "  Tienda A  ", cuit: "20-12345678-9", email: "TIENDA@MAIL.COM", activo: "on" }
 * 
 * Ejemplo de salida:
 * { nombre: "Tienda A", cuit: "20-12345678-9", email: "tienda@mail.com", activo: true }
 */
function normalizePayload(payload) {
  return {
    // Convierte a string, recorta espacios en blanco al inicio y final
    nombre: String(payload.nombre || "").trim(),
    
    // Convierte a string, recorta espacios en blanco
    cuit: String(payload.cuit || "").trim(),
    
    // Convierte a string, recorta espacios, convierte a minúsculas
    // Esto estandariza emails para búsquedas y evitar duplicados
    email: String(payload.email || "").trim().toLowerCase(),
    
    // Normaliza el campo 'activo' desde diferentes formatos
    // - "true" (string) → true
    // - true (boolean) → true
    // - "on" (string, de checkbox HTML) → true
    // - cualquier otra cosa → false
    activo: payload.activo === "true" || 
             payload.activo === true || 
             payload.activo === "on"
  };
}

/**
 * validatePayload - Valida los datos del comercio
 * 
 * @param {Object} payload - Datos a validar (ya normalizados)
 * @throws {HttpError} - 400 si falta algún campo obligatorio
 * 
 * Validaciones:
 * 1. nombre: No debe estar vacío
 * 2. cuit: No debe estar vacío
 * 3. email: No debe estar vacío
 * 
 * ¿Por qué validar aquí y no en el controlador?
 * - La validación es parte de la LÓGICA DE NEGOCIO
 * - Centraliza las reglas en un solo lugar
 * - El servicio sabe qué es válido y qué no
 * - El controlador solo maneja la interacción con el usuario
 * 
 * Ejemplo de error:
 * validatePayload({ nombre: "", cuit: "20-123", email: "" })
 * → Lanza HttpError(400, "VALIDATION_ERROR", "El nombre es obligatorio.")
 */
function validatePayload(payload) {
  // Valida que el nombre no esté vacío
  // Si está vacío, lanza error 400 con mensaje específico
  if (!payload.nombre) throw new HttpError(400, "VALIDATION_ERROR", "El nombre es obligatorio.");
  
  // Valida que el CUIT no esté vacío
  if (!payload.cuit) throw new HttpError(400, "VALIDATION_ERROR", "El CUIT es obligatorio.");
  
  // Valida que el email no esté vacío
  if (!payload.email) throw new HttpError(400, "VALIDATION_ERROR", "El email es obligatorio.");
  
  // NOTA: Se podrían agregar más validaciones aquí:
  // - Formato de email válido
  // - Formato de CUIT válido (ej: 20-12345678-9)
  // - Longitud mínima/máxima de campos
  // - Caracteres permitidos (solo letras, números, etc.)
  // - URLs válidas
  // - etc.
}

// ============================================
// FLUJO COMPLETO DE UNA CREACIÓN
// ============================================

/*
1. Controlador recibe POST /comercios/
   → controller.create(req, res, next)

2. Controlador llama a service.create(req.body)
   → await service.create({ nombre: "  Tienda A  ", cuit: "20-12345678-9", ... })

3. service.create llama a normalizePayload()
   → { nombre: "Tienda A", cuit: "20-12345678-9", email: "tienda@mail.com", activo: true }

4. service.create llama a validatePayload()
   → ✅ Todos los campos obligatorios están presentes

5. service.create llama a repository.create(normalized)
   → MongoDB inserta el nuevo documento

6. repository.create retorna el documento creado
   → { _id: "612345...", nombre: "Tienda A", ... }

7. service.create retorna el documento al controlador
   → El controlador redirige a la lista de comercios

8. Si hay error en cualquier paso:
   - Error de validación → HttpError(400) → Vuelve al formulario
   - Error de CUIT duplicado → HttpError(409) → Vuelve al formulario con error
   - Error de BD → Otro error → Pasa al middleware de errores
*/

// ============================================
// FLUJO COMPLETO DE UNA ACTUALIZACIÓN
// ============================================

/*
1. Controlador recibe POST /comercios/123/edit
   → controller.update(req, res, next)

2. Controlador llama a service.update(id, req.body)
   → await service.update("123", { nombre: "Tienda A Actualizada" })

3. service.update busca el comercio actual
   → const current = await repository.findById("123")
   → { _id: "123", nombre: "Tienda A", cuit: "20-12345678-9", email: "tienda@mail.com", activo: true }

4. service.update fusiona datos: { ...current, ...payload }
   → { _id: "123", nombre: "Tienda A Actualizada", cuit: "20-12345678-9", ... }

5. service.update normaliza y valida
   → normalizePayload() y validatePayload()

6. service.update llama a repository.update(id, normalized)
   → MongoDB actualiza el documento

7. service.update retorna el documento actualizado al controlador
   → El controlador redirige a la lista de comercios
*/

// ============================================
// FLUJO COMPLETO DE UNA ELIMINACIÓN
// ============================================

/*
1. Controlador recibe POST /comercios/123/delete
   → controller.remove(req, res, next)

2. Controlador llama a service.remove(id)
   → await service.remove("123")

3. service.remove llama a repository.remove(id)
   → MongoDB elimina el documento

4. repository.remove retorna true si se eliminó, false si no existía

5. service.remove verifica:
   - Si true → OK, no retorna nada
   - Si false → HttpError(404, "Comercio no encontrado.")

6. Controlador recibe éxito → Redirige a la lista de comercios
*/

// ============================================
// MANEJO DE ERRORES ESPECÍFICOS
// ============================================

/*
Error 404 (No encontrado):
  - getById: Comercio no existe
  - update: Comercio no existe
  - remove: Comercio no existe
  → Se muestra mensaje: "Comercio no encontrado."

Error 400 (Validación):
  - create: Campos obligatorios faltantes
  - update: Campos obligatorios faltantes
  → Se muestra mensaje específico: "El nombre es obligatorio."

Error 409 (Conflicto):
  - create: CUIT ya existe en otro comercio
  - update: CUIT ya existe en otro comercio
  → Se muestra mensaje: "Ya existe un comercio con ese CUIT."

Error 500 (Servidor):
  - Cualquier otro error no manejado
  → Pasa al middleware de errores de Express
*/

// ============================================
// VENTAJAS DE ESTE DISEÑO
// ============================================

/*
1. SEPARACIÓN DE RESPONSABILIDADES:
   - Controlador: Maneja HTTP (request/response)
   - Servicio: Lógica de negocio y validaciones
   - Repositorio: Acceso a datos (MongoDB)

2. REUTILIZACIÓN:
   - Los servicios pueden ser usados por múltiples controladores
   - La lógica de negocio no está atada a HTTP

3. TESTEABILIDAD:
   - Los servicios se pueden testear sin Express
   - Se pueden mockear repositorios fácilmente

4. MANTENIBILIDAD:
   - Los cambios en la lógica de negocio van en el servicio
   - Las validaciones están centralizadas

5. SEGURIDAD:
   - Normalización de datos previene inyecciones
   - Validaciones robustas antes de llegar a la BD
*/ 
