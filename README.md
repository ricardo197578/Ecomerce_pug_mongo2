# CodeNova | Plataforma E-commerce (Express + Pug + MongoDB)

Aplicacion backend con interfaz Pug para gestionar una plataforma de e-commerce multi-comercio.
Permite administrar comercios, tiendas, usuarios, transacciones, pagos, logistica, suscripciones y reportes operativos.

## Objetivo del sistema

CodeNova simula una plataforma que ofrece tiendas online a terceros (comercios).
El modelo de negocio combina:

- Suscripcion mensual por comercio.
- Comision por transaccion/pago aprobado.
- Reportes operativos y de control para seguimiento financiero y comercial.

## Tecnologias

- Node.js
- Express
- Pug
- MongoDB + Mongoose
- Arquitectura por capas (routes/controllers/services/repositories)

## Arquitectura general

El proyecto sigue este flujo:

`routes -> controllers -> services -> repositories -> models`

- **Routes**: define endpoints.
- **Controllers**: recibe request, renderiza vistas o responde JSON.
- **Services**: reglas de negocio, validaciones, consistencia de estados.
- **Repositories**: acceso a MongoDB.
- **Models**: esquemas de Mongoose.

## Funcionalidades principales

### 1) Gestion operativa

- Comercios (CRUD)
- Tiendas (CRUD) relacionadas a comercios
- Usuarios (CRUD) relacionados a comercios/tiendas
- Transacciones (CRUD) relacionadas a comercio/tienda/usuario
- Pagos (CRUD) con estados controlados:
  - `PENDIENTE`
  - `APROBADO`
  - `RECHAZADO`
- Logistica (CRUD + despacho manual)

### 2) Flujo de negocio clave

Flujo tipico del sistema:

1. Crear comercio
2. Crear tienda asociada
3. Crear usuario asociado
4. Crear transaccion
5. Crear/actualizar pago
6. Si el pago se aprueba:
   - la transaccion pasa a `APROBADA`
   - se genera logistica automaticamente en `PENDIENTE`
7. Desde logistica se puede despachar manualmente (`DESPACHADA`) y continuar el flujo de estados.

### 3) Gestion de plataforma (owner)

Seccion orientada al duenio de la plataforma (**CodeNova**):

- Suscripciones
- Facturacion

Incluye mini login de plataforma para restringir acceso a suscripciones y facturacion.

## Reportes

### Conciliacion

Controla consistencia entre transacciones y pagos.
Detecta, entre otros:

- `TRANSACCION_SIN_PAGO`
- `PAGO_HUERFANO`
- `ESTADO_DESCUADRADO`
- `MONTO_DESCUADRADO`

### Hot Sale

Metricas de operacion comercial:

- total de transacciones y pagos
- GMV total y aprobado
- ticket promedio
- tasa de aprobacion/rechazo
- tasa de pendientes
- top comercios por volumen
- alertas operativas

#### Que es GMV

`GMV` significa **Gross Merchandise Value** (Valor Bruto de Mercancia).
Es la suma del valor monetario de las transacciones en un periodo.

Ejemplo:

- Venta A: 10.000
- Venta B: 5.000
- Venta C: 20.000
- `GMV = 35.000`

Usamos GMV porque mide el **volumen comercial** total que mueve la plataforma.
No usamos "ingresos" para esta metrica porque ingreso/ganancia de CodeNova es otra cosa:
se calcula luego en facturacion (cuota + comisiones), no en el volumen bruto de ventas.

### Facturacion

Calcula lo que la plataforma factura por comercio:

- cuota mensual
- base comisionable
- porcentaje de comision
- monto de comision
- total a facturar
- totales globales (cuotas, comisiones, total)

## Vistas y experiencia de uso

La app usa Pug para administracion visual:

- Listados con relaciones legibles (nombre en lugar de IDs crudos)
- Formularios con selects para relaciones (comercio/tienda/usuario/transaccion)
- Gestion de estados de pago y logistica desde interfaz

## Rutas relevantes (HTML)

- `/` Inicio
- `/comercios`
- `/tiendas`
- `/usuarios`
- `/transacciones`
- `/pagos`
- `/logisticas`
- `/suscripciones` (protegida)
- `/reportes/conciliacion`
- `/reportes/hot-sale`
- `/reportes/facturacion` (protegida)
- `/platform/login`

## Endpoints JSON de reportes

- `/api/reportes/conciliacion`
- `/api/reportes/hot-sale`
- `/api/reportes/facturacion` (protegida)

## Login de plataforma (actual)

Implementacion minima para entorno academico (credenciales hardcodeadas):

- usuario: `admin`
- password: `codenova123`

> Recomendacion futura: mover credenciales a variables de entorno y aplicar hash de password.

## Instalacion y ejecucion

Desde `Ecomerce_pug_mongo/`:

```bash
npm install
npm run dev
```

o en modo normal:

```bash
npm start
```

## Estado actual del proyecto

El sistema ya cubre el flujo funcional principal de la consigna:

- CRUDs operativos y relaciones
- pagos y sincronizacion de estados
- logistica automatica + despacho manual
- reportes de conciliacion, hot sale y facturacion
- separacion entre operacion comercial y gestion de plataforma

## Proximos pasos recomendados

- Endurecer validaciones de entrada y reglas de transicion.
- Agregar tests automaticos de flujo critico.
- Incorporar autenticacion robusta (no hardcodeada) para entorno productivo.
- Mejorar estilos/UX para presentacion final.
