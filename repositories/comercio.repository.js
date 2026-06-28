// ARCHIVO: repositories/comercio.repository.js
// FUNCIÓN: Capa de acceso a datos para la entidad Comercio


// Importa el modelo de MongoDB para la entidad Comercio
// El modelo define la estructura, validaciones y métodos de la colección "comercios"
import { ComercioModel } from "../models/Comercio.js";

// Importa la fábrica de repositorios base
// createBaseRepository genera métodos CRUD estándar (findAll, findById, create, update, remove)
import { createBaseRepository } from "./base.repository.js";

// CREACIÓN DEL REPOSITORIO BASE

/**
 * Crea un repositorio base con métodos CRUD estándar
 * createBaseRepository(ComercioModel) genera un objeto con:
 * - findAll() → ComercioModel.find()
 * - findById(id) → ComercioModel.findById(id)
 * - create(data) → ComercioModel.create(data)
 * - update(id, data) → ComercioModel.findByIdAndUpdate(id, data, { new: true })
 * - remove(id) → ComercioModel.findByIdAndDelete(id)
 
 * Estos métodos son genéricos y funcionan para cualquier modelo
 */
const base = createBaseRepository(ComercioModel);

// EXPORTACIÓN DEL REPOSITORIO DE COMERCIOS

export const comercioRepository = {
 
  // HEREDA TODOS LOS MÉTODOS DEL REPOSITORIO BASE
   
  /**
   * Spread operator (...) copia TODOS los métodos del repositorio base
   * 
   * Esto es equivalente a:
   * 
   * export const comercioRepository = {
   *   findAll: base.findAll,
   *   findById: base.findById,
   *   create: base.create,
   *   update: base.update,
   *   remove: base.remove,
   *   findByCuit: function(cuit) { ... }
   * };
   * 
   * Ventajas:
   * 1. No repetir código para métodos CRUD estándar
   * 2. Solo agregar métodos específicos de la entidad
   * 3. Mantenimiento centralizado (cambios en base.repository.js afectan a todos)
   */
  ...base,

  // MÉTODO ESPECÍFICO DE LA ENTIDAD COMERCIO
    
  /**
   * findByCuit - Busca un comercio por su CUIT
   * 
   * @param {string} cuit - CUIT del comercio a buscar
   * @returns {Promise<Object|null>} - El comercio encontrado o null
   * 
   * Uso:
   * - Verificar si un CUIT ya existe antes de crear un nuevo comercio
   * - Buscar un comercio específico por su CUIT
   * - Validar que no haya duplicados
   * 
   * Ejemplo: 
   * const comercio = await comercioRepository.findByCuit("20-12345678-9");
   * 
   * NOTA: .lean() retorna un objeto plano de JavaScript en lugar de un documento Mongoose
   * Esto mejora el rendimiento ya que no se necesita la funcionalidad extra de Mongoose
   * 
   * ¿Por qué usar lean()?
   * - Mongoose devuelve documentos con métodos y propiedades adicionales
   * - .lean() convierte a objeto plano (más rápido, menos memoria)
   * - Útil para solo lectura de datos
   */
  async findByCuit(cuit) {
    // Busca un documento en la colección comercios donde el campo 'cuit' coincida
    // .lean() convierte el resultado a objeto plano de JavaScript
    // Retorna el primer documento que coincida o null si no existe
    return ComercioModel.findOne({ cuit }).lean();
  }
};

// ============================================
// ¿QUÉ ES UN REPOSITORIO?
// ============================================

/**
 * Un repositorio es un patrón de diseño que:
 * 
 * 1. ABSTRAE el acceso a datos
 *    - Oculta los detalles de la base de datos
 *    - Proporciona una interfaz limpia y consistente
 * 
 * 2. CENTRALIZA las operaciones de BD
 *    - Todas las consultas a comercios pasan por aquí
 *    - Fácil de modificar si cambia la BD
 * 
 * 3. SEPARA la lógica de negocio del acceso a datos
 *    - El servicio no sabe cómo se guardan los datos
 *    - Solo sabe que el repositorio tiene métodos CRUD
 * 
 * 4. PERMITE TESTEAR fácilmente
 *    - Se puede mockear el repositorio en tests
 *    - No depende de la BD real
 */



// ============================================
// ESTRUCTURA DE createBaseRepository
// ============================================

/**
 * Así se ve la función createBaseRepository internamente:
 * 
 * export function createBaseRepository(Model) {
 *   return {
 *     findAll() {
 *       return Model.find({});
 *     },
 *     findById(id) {
 *       return Model.findById(id);
 *     },
 *     create(data) {
 *       return Model.create(data);
 *     },
 *     update(id, data) {
 *       return Model.findByIdAndUpdate(id, data, { new: true });
 *     },
 *     remove(id) {
 *       return Model.findByIdAndDelete(id);
 *     }
 *   };
 * }
 * 
 * El repositorio base es GENÉRICO y funciona para cualquier modelo
 * El repositorio específico HEREDA estos métodos y agrega los suyos propios
 */


// ============================================
// FLUJO COMPLETO DE DATOS
// ============================================

/*
1. PETICIÓN HTTP
   POST /comercios/
   ↓

2. CONTROLADOR
   comercioController.create(req, res, next)
   ↓

3. SERVICIO (Lógica de negocio)
   comercioService.create(payload)
   → Normaliza y valida datos
   ↓

4. REPOSITORIO (Acceso a datos)
   comercioRepository.create(normalized)
   ↓

5. MODELO (Mapeo a BD)
   ComercioModel.create(normalized)
   ↓

6. MONGODB (Base de datos)
   db.comercios.insertOne(normalized)
   ↓

7. RETORNO DE DATOS
   MongoDB → Modelo → Repositorio → Servicio → Controlador → Usuario
*/

// ============================================
// VENTAJAS DE USAR EL REPOSITORIO BASE
// ============================================

/*
1. CÓDIGO MÁS LIMPIO:
   - No repetir métodos CRUD para cada entidad
   - Solo definir métodos específicos

2. MANTENIMIENTO CENTRALIZADO:
   - Cambios en CRUD se aplican a todas las entidades
   - Corrección de bugs en un solo lugar

3. CONSISTENCIA:
   - Todas las entidades usan la misma interfaz
   - Fácil de entender y usar

4. EXTENSIBILIDAD:
   - Fácil agregar nuevos métodos específicos
   - Sin afectar los métodos base

5. TESTEABILIDAD:
   - Se puede mockear fácilmente para tests
   - Separación clara de responsabilidades
*/
