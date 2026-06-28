// comercio.controller.js
// Este archivo define el controlador para la entidad "Comercio" en la aplicación

// Importa una función factory que construye controladores CRUD genéricos
// Esta función recibe configuraciones y devuelve un objeto con los métodos HTTP estándar
import { buildCrudController } from "./crud.controller.js";

// Importa el servicio específico para la entidad Comercio
// Este servicio contiene la lógica de negocio y acceso a datos para comercios
import { comercioService } from "../services/comercio.service.js";

// Exporta el controlador de comercio construido mediante la función factory
// Esto permite reutilizar la lógica CRUD sin duplicar código
export const comercioController = buildCrudController({
  // Título de la entidad para mostrar en la interfaz de usuario
  // Se usa en títulos de páginas, mensajes, etc.
  title: "Comercio",
  
  // Servicio que maneja las operaciones de base de datos para comercios
  // Proporciona métodos como findAll, findById, create, update, delete
  service: comercioService,
  
  // Ruta base donde se encuentran las vistas (templates) para esta entidad
  // El sistema buscará vistas en: views/comercios/
  viewPath: "comercios",
  
  // Valores por defecto para el formulario de creación/edición
  // Estos campos corresponden al modelo de datos de Comercio
  formDefaults: { 
    nombre: "",    // Nombre del comercio (vacío por defecto)
    cuit: "",      // CUIT del comercio (vacío por defecto)  
    email: "",     // Email de contacto (vacío por defecto)
    activo: true   // Estado del comercio (activo por defecto)
  }
});

/*
Explicación del funcionamiento dentro del programa:
Propósito del Archivo
Este archivo actúa como un punto de configuración para el controlador de la entidad "Comercio".
En lugar de escribir manualmente todos los métodos CRUD (Create, Read, Update, Delete), utiliza
una función factory (buildCrudController) que genera automáticamente toda la lógica necesaria.

Flujo de Trabajo
Importación: Trae las dependencias necesarias (el builder de controladores y el servicio específico)
Configuración: Pasa la configuración específica para comercios al builder
Exportación: Expone el controlador configurado para que el resto de la aplicación lo use

Beneficios de este Enfoque
DRY (Don't Repeat Yourself): La lógica CRUD se escribe una vez y se reutiliza
Mantenibilidad: Cambios en la lógica CRUD se aplican a todas las entidades
Consistencia: Todos los controladores siguen el mismo patrón
Configuración sencilla: Solo se necesita especificar qué es diferente 
(título, servicio, vistas, valores por defecto)

Integración con el Sistema
Frontend: viewPath indica dónde buscar las plantillas HTML
Backend: service conecta con la capa de datos
UX: title y formDefaults mejoran la experiencia del usuario al mostrar nombres amigables
y precargar valores 
*/