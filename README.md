# CodeNova | Plataforma E-commerce (Express + Pug + MongoDB)

CodeNova es una plataforma academica de e-commerce multi-comercio.
El proyecto simula un SaaS donde un operador central administra comercios clientes y cada comercio opera su propio panel de trabajo.

## Objetivo de la plataforma

El sistema busca representar dos planos de negocio dentro de una misma aplicacion:

- **CodeNova como plataforma**: da de alta comercios, administra suscripciones, controla facturacion y supervisa reportes globales.
- **Cada comercio cliente**: administra sus tiendas, usuarios, transacciones, pagos, logistica y reportes operativos propios.

En terminos funcionales, la plataforma permite:

- Crear y mantener comercios.
- Crear accesos de login para cada comercio.
- Ejecutar la operacion diaria del comercio.
- Controlar consistencia entre transacciones y pagos.
- Medir metricas de negocio, control operativo y facturacion.

Esta implementacion se mantiene dentro del alcance del trabajo practico y de los contenidos pedidos para la materia:

- arquitectura modular por capas
- uso de Node.js, Express y MongoDB con Mongoose
- middlewares, rutas, controladores y manejo de errores
- validaciones simples y reglas de negocio
- programacion asincronica con `async/await`
- documentacion del funcionamiento y de las pruebas realizadas

Tambien se tuvo presente el criterio del PDF de no caer en overengineering: la seguridad se reforzo respetando la arquitectura ya existente y adaptando lo minimo necesario para separar plataforma, comercio y tienda sin cambiar de stack ni introducir herramientas fuera de alcance.

## Alcance del proyecto

Actualmente el proyecto cubre:

- CRUD de `comercios`, `tiendas`, `usuarios`, `transacciones`, `pagos`, `logisticas` y `suscripciones`.
- Login de plataforma y login de comercio separados.
- Sesiones basadas en cookie con `express-session`.
- Hash de passwords con `bcrypt`.
- Roles y autorizacion por middleware.
- Aislamiento multi-tenant por `comercioId`.
- Alcance adicional por `tiendaId` para cuentas `COMMERCE_USER`.
- Alta de cuentas de comercio desde la UI de plataforma.
- Reportes operativos acotados al comercio autenticado.
- Tests unitarios enfocados en auth, roles y tenant isolation.

No es un sistema productivo terminado. Sigue siendo un backend academico server-rendered con foco en arquitectura por capas, reglas de negocio, control de acceso y aislamiento multi-comercio.

## Stack

- Node.js
- Express 5
- Pug
- MongoDB + Mongoose
- `express-session`
- `bcrypt`

## Arquitectura

El flujo principal del proyecto es:

`routes -> controllers -> services -> repositories -> models`

- **Routes**: definen endpoints y middlewares de acceso.
- **Controllers**: traducen la request HTTP a operaciones de negocio y renderizan vistas o JSON.
- **Services**: concentran validaciones, reglas de negocio, auth context y filtros por tenant.
- **Repositories**: encapsulan lecturas y escrituras sobre MongoDB.
- **Models**: definen esquemas, indices y restricciones.

## Modulos funcionales

### Operacion del comercio

- Tiendas
- Usuarios
- Transacciones
- Pagos
- Logistica
- Reportes operativos (`conciliacion`, `hot-sale`)

### Gestion global de plataforma

- Comercios
- Cuentas de acceso de comercio
- Suscripciones
- Facturacion
- Reportes globales de plataforma

## Modelo de autenticacion y seguridad

La aplicacion usa autenticacion basada en sesion de servidor.

### Tipo de autenticacion que se usa

- El usuario ingresa email + password en un formulario HTML.
- La password se compara contra un `passwordHash` guardado en MongoDB.
- Si las credenciales son correctas, se guarda identidad minima en `req.session.auth`.
- Las siguientes requests se autentican a traves de la cookie de sesion.

No se usa JWT ni OAuth.
Se usa una estrategia clasica de **session-based authentication** para una app server-rendered.

### Dónde viven las cuentas

Las credenciales no viven en `Usuario` sino en `Account`.

Archivo principal:

- `models/Account.js`

Campos relevantes:

- `email`
- `passwordHash`
- `role`
- `comercioId`
- `tiendaId`
- `activo`
- `lastLoginAt`

### Roles soportados

- `PLATFORM_ADMIN`
- `COMMERCE_ADMIN`
- `COMMERCE_USER`

### Flujos de login

- `GET /platform/login` y `POST /platform/login`: acceso de administracion CodeNova.
- `POST /platform/logout`: cierre de sesion de plataforma.
- `GET /login` y `POST /login`: acceso de comercios.
- `POST /logout`: cierre de sesion de comercio.

### Cómo se aplica la seguridad

La seguridad no depende solo de ocultar links en la vista.
Se aplica en varias capas:

- **Sesion**: `express-session` guarda la identidad autenticada.
- **Controladores**: pasan `authContext` a los servicios.
- **Middlewares**: validan autenticacion, rol y acceso por tenant.
- **Servicios**: vuelven a verificar `comercioId` para impedir accesos cruzados.

Archivos clave:

- `services/auth.service.js`
- `controllers/auth.controller.js`
- `controllers/platformAuth.controller.js`
- `middlewares/requireAuth.js`
- `middlewares/requireRole.js`
- `middlewares/requireTenantAccess.js`
- `utils/authContext.js`

### Reglas de acceso

- `PLATFORM_ADMIN` puede administrar la plataforma completa.
- `COMMERCE_ADMIN` puede operar todo dentro de su propio `comercioId`.
- `COMMERCE_USER` queda limitado a su `comercioId` y a una `tiendaId` especifica.
- Un usuario de comercio no debe ver ni acceder a gestion global de CodeNova.
- Los reportes operativos del comercio se filtran por tenant.

### Matriz resumida de permisos

- `PLATFORM_ADMIN`: ve, crea, edita y elimina todo.
- `COMMERCE_ADMIN`: ve y administra tiendas, usuarios, transacciones, pagos y logistica de todo su comercio.
- `COMMERCE_USER`: no administra tiendas; solo opera usuarios, transacciones, pagos, logistica y reportes dentro de su tienda asignada.

## Estado actual logrado

Los cambios de seguridad y operacion incorporados hasta ahora dejan el sistema asi:

- Existe un admin inicial de plataforma creado por seed.
- El alta de nuevos accesos de comercio se hace desde `/cuentas-comercio` con un `PLATFORM_ADMIN`.
- El panel de comercio queda aislado por `comercioId`.
- Las cuentas `COMMERCE_USER` quedan ademas aisladas por `tiendaId`.
- Los usuarios de comercio no ven la seccion de gestion de plataforma en el inicio.
- El CRUD generico ya propaga `authContext`, evitando errores como el `401 AUTH_REQUIRED` al ver/editar comercios siendo admin de plataforma.

En resumen, ya se alcanzo una separacion clara entre:

- administracion global de CodeNova
- operacion diaria de cada comercio
- seguridad por sesion, rol, tenant y tienda

## Colaboracion con IA en esta implementacion

La implementacion integral del modulo de seguridad, autenticacion y autorizacion fue desarrollada con asistencia de un agente de IA durante este repositorio de trabajo.

### Insumos de trabajo usados

- `prompt_autenticacion.txt`: definio el requerimiento funcional y tecnico de separar acceso de plataforma y acceso de comercio.
- `fases_seguridad.txt`: se uso como hoja de ruta incremental para ejecutar la implementacion por etapas y con bajo riesgo.
- `2° Parcial - IFST 29 - Para todos los casos 1C2026.pdf`: se reviso para mantener el alcance dentro de los objetivos del parcial y documentar correctamente pruebas, funcionamiento y decisiones tecnicas.

### Qué hizo concretamente el agente de IA

- analizo la arquitectura existente del proyecto
- tradujo el prompt de autenticacion a un plan por fases
- implemento la base de autenticacion con `Account`
- reemplazo credenciales hardcodeadas por cuentas reales en MongoDB
- configuro sesiones seguras con `express-session`
- creo login separado para plataforma y comercio
- implemento middlewares `requireAuth`, `requireRole`, `requireTenantAccess` y restricciones adicionales por rol
- aplico aislamiento multi-tenant por `comercioId`
- agrego alcance por `tiendaId` para `COMMERCE_USER`
- agrego y actualizo tests automatizados para auth, roles y aislamiento
- actualizo esta documentacion tecnica y de uso

### Fases efectivamente recorridas

Tomando como base `fases_seguridad.txt`, la implementacion avanzo en estos bloques:

- base de autenticacion con `Account`, repositorio y `authService`
- sesion segura y exposicion de contexto en vistas
- login/logout real de plataforma
- seed del `PLATFORM_ADMIN`
- login/logout de comercios
- filtrado multi-tenant en servicios y reportes
- alta de cuentas de comercio desde la UI administrativa
- diferenciacion final entre `PLATFORM_ADMIN`, `COMMERCE_ADMIN` y `COMMERCE_USER`
- tests de seguridad y actualizacion del README

### Observacion metodologica

La IA fue usada como agente colaborativo de analisis, diseño e implementacion tecnica. Las decisiones finales de negocio, validacion funcional y pruebas manuales siguen dependiendo del equipo del proyecto.

## Variables de entorno

El proyecto hoy usa un archivo `.env` local.

Variables minimas:

```env
NODE_ENV=development
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017/ecomerce_pug_mongo
SESSION_SECRET=replace-with-a-long-random-secret
SESSION_COOKIE_NAME=codenova.sid
BCRYPT_SALT_ROUNDS=10
SEED_PLATFORM_ADMIN_EMAIL=admin@codenova.local
SEED_PLATFORM_ADMIN_PASSWORD=ChangeMe123!
```

Notas:

- `SESSION_SECRET` firma la sesion y debe ser privado.
- `NODE_ENV=production` hace que la cookie use `secure: true`.
- El seed de plataforma usa `SEED_PLATFORM_ADMIN_EMAIL` y `SEED_PLATFORM_ADMIN_PASSWORD`.

## Instalacion y ejecucion

## Como probar el proyecto desde cero

Esta seccion esta pensada para cualquier persona que descargue el repositorio y quiera probarlo localmente.

### Requisitos previos

- Node.js instalado
- npm instalado
- MongoDB disponible
  - puede ser local, o
  - puede ser remoto usando MongoDB Atlas
- Git para clonar el repositorio

### Paso 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd Ecomerce_pug_mongo2
```

### Paso 2. Instalar dependencias

```bash
npm install
```

### Paso 3. Crear el archivo `.env`

Crear un archivo `.env` en la raiz del proyecto con este contenido minimo:

```env
NODE_ENV=development
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017/ecomerce_pug_mongo
SESSION_SECRET=replace-with-a-long-random-secret
SESSION_COOKIE_NAME=codenova.sid
BCRYPT_SALT_ROUNDS=10
SEED_PLATFORM_ADMIN_EMAIL=admin@codenova.local
SEED_PLATFORM_ADMIN_PASSWORD=ChangeMe123!
```

Si MongoDB no corre en tu maquina local, reemplazar `MONGODB_URI` por la cadena real de tu instancia remota.

### Paso 4. Verificar que MongoDB este funcionando

- Si usas Mongo local, asegurate de que el servicio este levantado.
- Si usas Mongo Atlas, verificá que la URI del `.env` sea valida y que tu IP tenga acceso.

### Paso 5. Crear el administrador inicial de plataforma

```bash
npm run seed:platform-admin
```

Este comando crea o actualiza la cuenta `PLATFORM_ADMIN` usando las credenciales definidas en:

- `SEED_PLATFORM_ADMIN_EMAIL`
- `SEED_PLATFORM_ADMIN_PASSWORD`

### Paso 6. Levantar la aplicacion

En desarrollo:

```bash
npm run dev
```

O en modo normal:

```bash
npm start
```

### Paso 7. Ingresar al sistema

Abrir en el navegador:

```text
http://localhost:3002
```

### Paso 8. Probar el acceso de plataforma

1. Ir a `http://localhost:3002/platform/login`
2. Iniciar sesion con el email y password del seed
3. Verificar acceso a:
   - `/comercios`
   - `/cuentas-comercio`
   - `/suscripciones`
   - `/reportes/facturacion`

### Paso 9. Crear un comercio y su cuenta

1. Entrar a `/comercios`
2. Crear un comercio nuevo
3. Entrar a `/cuentas-comercio`
4. Crear una cuenta asociada a ese comercio
5. Si el rol es `COMMERCE_USER`, asignarle tambien una tienda

### Paso 10. Probar el acceso del comercio

1. Cerrar sesion de plataforma
2. Ir a `http://localhost:3002/login`
3. Ingresar con la cuenta creada en `/cuentas-comercio`

### Paso 11. Validar comportamiento por rol

- `COMMERCE_ADMIN`
  - debe ver y administrar todo su comercio
- `COMMERCE_USER`
  - debe quedar limitado a su tienda
  - no debe poder crear nuevas tiendas
- `PLATFORM_ADMIN`
  - debe conservar acceso total global

### Paso 12. Si algo falla

Revisar especialmente:

- que `MONGODB_URI` sea correcta
- que MongoDB este disponible
- que el `.env` exista en la raiz
- que el seed de plataforma se haya ejecutado
- que la cuenta de comercio haya sido creada desde `/cuentas-comercio`

### Instalar dependencias

```bash
npm install
```

### Crear admin inicial de plataforma

```bash
npm run seed:platform-admin
```

Comportamiento:

- Si la cuenta no existe, la crea con rol `PLATFORM_ADMIN`.
- Si ya existe, actualiza password, rol y estado.

Script usado:

- `scripts/seed-platform-admin.js`

### Ejecutar en desarrollo

```bash
npm run dev
```

### Ejecutar normalmente

```bash
npm start
```

## Flujo operativo recomendado

### Alta de un nuevo comercio

1. Iniciar sesion como `PLATFORM_ADMIN`.
2. Crear el comercio en `/comercios`.
3. Crear la cuenta de acceso en `/cuentas-comercio`.
4. Si la cuenta es `COMMERCE_USER`, asignarle una tienda concreta.
5. Entregar email y password al cliente.
6. El cliente entra por `/login`.

Este es ahora el flujo normal recomendado.

## Guia rapida de uso y demo academica

Esta seccion resume un recorrido sugerido para mostrar la plataforma.

### Paso 1. Preparar entorno

1. Crear el archivo `.env` con Mongo, sesion y credenciales del admin inicial.
2. Verificar que MongoDB este levantado.
3. Instalar dependencias con `npm install`.

### Paso 2. Crear el administrador inicial de plataforma

1. Ejecutar `npm run seed:platform-admin`.
2. Confirmar en consola que el admin fue creado o actualizado.
3. Levantar la app con `npm run dev`.

### Paso 3. Ingresar como CodeNova

1. Abrir `http://localhost:3002/platform/login`.
2. Iniciar sesion con `SEED_PLATFORM_ADMIN_EMAIL` y `SEED_PLATFORM_ADMIN_PASSWORD`.
3. Mostrar que el admin de plataforma puede ver:
   - `/comercios`
   - `/cuentas-comercio`
   - `/suscripciones`
   - `/reportes/facturacion`

### Paso 4. Dar de alta un comercio nuevo

1. Entrar a `/comercios`.
2. Crear un comercio con nombre, CUIT y email.
3. Verificar que quede disponible en el listado.

### Paso 5. Crear la cuenta de acceso del comercio

1. Entrar a `/cuentas-comercio`.
2. Crear una cuenta asociada al comercio recien dado de alta.
3. Elegir rol `COMMERCE_ADMIN` o `COMMERCE_USER`.
4. Si el rol es `COMMERCE_USER`, seleccionar la tienda asociada.
5. Definir email y password.

### Paso 6. Probar el login del comercio

1. Cerrar sesion de plataforma.
2. Ir a `http://localhost:3002/login`.
3. Ingresar con la cuenta creada en `/cuentas-comercio`.
4. Verificar que el usuario del comercio pueda acceder a:
   - `/tiendas`
   - `/usuarios`
   - `/transacciones`
   - `/pagos`
   - `/logisticas`
   - `/reportes/conciliacion`
   - `/reportes/hot-sale`

### Paso 7. Mostrar el aislamiento multi-tenant

1. Crear un segundo comercio y una segunda cuenta.
2. Ingresar con la cuenta del comercio A.
3. Intentar acceder a registros del comercio B por URL.
4. Verificar que el sistema no los exponga.

### Paso 8. Mostrar la separacion de responsabilidades

1. Con una cuenta de comercio, verificar que no aparezca la gestion de plataforma en el inicio.
2. Intentar entrar a `/comercios`, `/cuentas-comercio` o `/suscripciones`.
3. Verificar que el acceso este restringido.

## Rutas principales

### HTML

- `/`
- `/login`
- `/platform/login`
- `/comercios` solo plataforma
- `/cuentas-comercio` solo plataforma
- `/tiendas`
- `/usuarios`
- `/transacciones`
- `/pagos`
- `/logisticas`
- `/suscripciones` solo plataforma
- `/reportes/conciliacion`
- `/reportes/hot-sale`
- `/reportes/facturacion` solo plataforma

### JSON

- `/api/reportes/conciliacion`
- `/api/reportes/hot-sale`
- `/api/reportes/facturacion` solo plataforma

## Reportes

### Conciliacion

Valida consistencia entre transacciones y pagos.
Detecta principalmente:

- `TRANSACCION_SIN_PAGO`
- `PAGO_HUERFANO`
- `ESTADO_DESCUADRADO`
- `MONTO_DESCUADRADO`

Para cuentas de comercio, trabaja solo con su `comercioId`.

### Hot Sale

Calcula metricas operativas:

- total de transacciones
- total de pagos
- GMV total
- GMV aprobado
- ticket promedio
- tasa de aprobacion
- tasa de rechazo
- tasa de pendientes
- top comercios por volumen
- alertas operativas

Para comercio autenticado, el calculo se hace solo sobre su tenant.

### Facturacion

Es un reporte exclusivo de plataforma.
Resume cuota mensual, base comisionable, porcentaje de comision y total a facturar por comercio.

## Tests

### Ejecutar todos

```bash
npm test
```

### Ejecutar uno puntual

```bash
node --test test/auth.controller.test.js
```

### Ejecutar por nombre

```bash
node --test test/tenant-isolation.test.js --test-name-pattern="filtra"
```

### Qué prueba cada archivo

#### `test/account.service.test.js`

Sirve para validar el alta y actualizacion de cuentas de comercio desde la capa de negocio.

Comprueba que:

- una cuenta de comercio se crea correctamente desde plataforma
- no se pueda crear una cuenta de comercio con rol invalido como `PLATFORM_ADMIN`
- una actualizacion pueda cambiar email o rol sin obligar a cambiar password

Es importante porque protege el nuevo flujo que reemplaza al seed de comercio como mecanismo operativo.

#### `test/auth.controller.test.js`

Sirve para validar el controlador de login de comercio.

Comprueba que:

- una cuenta valida de comercio inicia sesion correctamente
- una cuenta de plataforma no pueda ingresar por `/login`
- las credenciales invalidas se manejen con mensaje seguro

Es importante porque separa claramente el acceso de comercio del acceso de plataforma.

#### `test/requireRole.test.js`

Sirve para validar la autorizacion por rol.

Comprueba que:

- un rol permitido pasa el middleware
- una API responda `403` JSON si el rol no coincide
- una vista HTML responda error `403` si el rol no coincide

Es importante porque asegura que la proteccion no dependa solo del menu visible.

#### `test/tenant-isolation.test.js`

Sirve para validar el aislamiento entre comercios.

Comprueba que:

- un comercio no pueda acceder a recursos de otro comercio
- un `COMMERCE_USER` no pueda salir de su tienda asignada
- `conciliacionService` filtre por tenant
- `estadisticaService` filtre por tenant

Es el test mas directamente vinculado al objetivo multi-tenant del proyecto.

### Valor de la suite de tests actual

La suite actual no busca cubrir toda la aplicacion, sino blindar los puntos mas sensibles del cambio de seguridad:

- que las cuentas de comercio se creen correctamente
- que el login correcto entre por el flujo correcto
- que los roles realmente restrinjan acceso
- que un comercio no pueda ver datos de otro

Para una entrega academica, estos tests muestran que la seguridad no quedo solo declarada en el README, sino tambien verificada con casos automatizados.

## Pruebas manuales sugeridas

### Login de plataforma

1. Configurar `SEED_PLATFORM_ADMIN_*`.
2. Ejecutar `npm run seed:platform-admin`.
3. Entrar en `/platform/login`.
4. Verificar acceso a `/comercios`, `/cuentas-comercio`, `/suscripciones` y `/reportes/facturacion`.

### Login de comercio

1. Iniciar sesion como `PLATFORM_ADMIN`.
2. Crear un comercio en `/comercios`.
3. Crear su acceso en `/cuentas-comercio`.
4. Cerrar sesion de plataforma.
5. Entrar por `/login` con esa cuenta.
6. Verificar acceso a `tiendas`, `usuarios`, `transacciones`, `pagos`, `logisticas` y reportes operativos.

### Aislamiento multi-tenant

1. Crear dos comercios.
2. Crear una cuenta para cada uno.
3. Ingresar con el comercio A.
4. Confirmar que solo ve sus propios datos.
5. Intentar abrir por URL un recurso del comercio B.
6. Confirmar que no se expone.
7. Si la cuenta es `COMMERCE_USER`, confirmar tambien que no vea datos de otras tiendas del mismo comercio.

## Resumen corto

Hoy CodeNova ya funciona como plataforma multi-comercio con:

- login real por sesion
- passwords hasheadas con `bcrypt`
- separacion entre admin de plataforma y usuarios de comercio
- alta de accesos de comercio desde la propia UI administrativa
- proteccion por roles
- aislamiento por tenant
- aislamiento adicional por tienda para `COMMERCE_USER`
- tests de auth, roles y seguridad multi-tenant

## Observaciones finales

- El seed de plataforma sigue siendo necesario para bootstrap inicial del sistema.
- El alta operativa de nuevos clientes/comercios ya se hace desde la UI administrativa.
- La seguridad implementada responde a un enfoque clasico y adecuado para aplicaciones server-rendered con sesion.
- El proyecto ya expresa una separacion clara entre plataforma SaaS y panel de cliente.

## Mejoras futuras posibles

- obligar cambio de password en primer ingreso
- agregar recuperacion de password
- auditar intentos de login y operaciones sensibles
- ampliar tests a controladores y vistas
- endurecer reglas de complejidad de password
