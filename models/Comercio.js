// models/Comercio.js
// Define el modelo de datos para la entidad Comercio en MongoDB

// Importa el helper createModel que aplica configuraciones comunes (timestamps, pluralización, etc.)
import { createModel } from "./shared.js";

// Crea y exporta el modelo Comercio con su esquema de datos
export const ComercioModel = createModel("Comercio", {
  // Nombre del comercio - obligatorio, texto, sin espacios extra
  nombre: { type: String, required: true, trim: true },
  
  // CUIT - obligatorio, texto, sin espacios, valor ÚNICO en toda la colección
  // unique genera un índice en MongoDB que previene duplicados
  cuit: { type: String, required: true, trim: true, unique: true },
  
  // Email - obligatorio, texto, sin espacios, convertido a minúsculas automáticamente
  email: { type: String, required: true, trim: true, lowercase: true },
  
  // Estado activo/inactivo - booleano, por defecto true (activo)
  activo: { type: Boolean, default: true }
});

// El modelo tiene automáticamente:
// - createdAt y updatedAt (por createModel)
// - Colección "comercios" en MongoDB (plural automático)
// - Validaciones de required y unique a nivel de base de datos
