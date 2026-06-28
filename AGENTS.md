# AGENTS.md

## Purpose
- This repository is a Node.js backend for a multi-commerce e-commerce platform.
- Stack: Express 5, server-rendered Pug views, MongoDB via Mongoose, native ESM.
- This file is the default operating guide for agentic coding tools working in this repo.
- Prefer small, architecture-consistent changes over broad refactors.

## Repository Snapshot
- Entry point: `app.js`
- Runtime mode: `"type": "module"`
- Main flow: `routes -> controllers -> services -> repositories -> models`
- Key shared files: `config/config.js`, `config/database.js`, `services/helpers.js`, `utils/httpError.js`, `utils/authContext.js`, `models/shared.js`
- Session auth uses `express-session` with `req.session.auth`; views are Pug under `views/`.

## Rules Files Check
- No `.cursor/rules/` directory was found.
- No `.cursorrules` file was found.
- No `.github/copilot-instructions.md` file was found.
- `AGENTS.md` is the main repository guidance source.

## Agent Priorities
- Keep the layered architecture intact.
- Preserve Spanish domain terms like `comercio`, `tienda`, `usuario`, `suscripcion`, `logistica`, `conciliacion`.
- Put business rules in services first, keep persistence details in repositories, and match existing route names and response shapes.
- Do not introduce new frameworks, validators, ORMs, or formatting tools unless requested.

## Build / Run / Test Commands

### Install And Run
```bash
npm install
npm run dev
npm start
npm run seed:platform-admin
```
- `npm run dev` starts `nodemon app.js`; `npm start` runs `node app.js`.
- There is no separate build step.

### Tests
```bash
npm test
node --test
node --test test/account.service.test.js
node --test test/account.service.test.js --test-name-pattern="COMMERCE_USER"
node --test --test-name-pattern="requireRole"
```
- `npm test` maps to `node --test`.
- Tests currently live in `test/` and use Node's built-in runner from `node:test`.
- Prefer running a single file with `node --test path/to/file.test.js`.
- Prefer running a single test case with `--test-name-pattern="partial name"`.
- Current examples include `test/account.service.test.js`, `test/auth.controller.test.js`, `test/tenant-isolation.test.js`, and `test/requireRole.test.js`.

### Lint / Formatting Status
- No `lint` script, ESLint config, Prettier config, or `.editorconfig` exists.
- Do not invent a formatter style; mirror nearby files.

## Environment And Configuration
- Environment variables are loaded through `dotenv` in `config/config.js`.
- Important keys: `PORT`, `MONGODB_URI`, `SESSION_SECRET`, `SESSION_COOKIE_NAME`, `BCRYPT_SALT_ROUNDS`, `NODE_ENV`.
- `app.js` enables `trust proxy`, configures an 8-hour session cookie, and exposes `GET /health`.

## Architecture Rules
- `routes/` declares endpoints and wires controllers plus middleware.
- `controllers/` translate HTTP input into service calls and render, redirect, or return JSON.
- `services/` own normalization, validation, tenant scoping, and business rules.
- `repositories/` own Mongoose queries and persistence behavior only.
- `models/` define schemas, defaults, and indexes; `middlewares/` handle auth, authorization, 404s, and error rendering.
- `utils/` contains cross-cutting helpers such as `HttpError` and auth-context scope helpers; `views/` should receive already-prepared display data.

## Imports And Exports
- Use ESM `import` / `export` only.
- Include the `.js` extension in local imports.
- Keep imports at the top of each file.
- Prefer relative imports; no path alias setup exists.
- Controllers, services, and repositories commonly export object literals with `export const`.
- Reusable factories and helpers use named function exports such as `buildCrudController(...)` or `createBaseRepository(...)`; default exports are rare.

## Naming Conventions
- File names are lowercase by layer: `comercio.service.js`, `crud.controller.js`, `account.repository.js`.
- Model files use PascalCase: `Comercio.js`, `Usuario.js`, `Suscripcion.js`, `Account.js`.
- Mongoose models use `PascalCaseModel`, for example `AccountModel`.
- Repositories use `camelCaseRepository`, services use `camelCaseService`, and controllers use `camelCaseController`.
- Middleware names are verb-oriented; shared derived values often use names like `formDefaults`, `items`, `item`, or `<entity>View`.
- Foreign keys follow existing names such as `comercioId`, `tiendaId`, `usuarioId`, `transaccionId`.

## Formatting Conventions
- Use semicolons.
- Use double quotes.
- Prefer 2-space indentation.
- Keep object literals and `res.render(...)` payloads multiline when they hold several fields.
- Use trailing commas only when the surrounding file already uses them.
- Keep lines readable, preserve useful Spanish comments, and add new comments only for non-obvious behavior.

## Types And Data Handling
- The codebase is plain JavaScript; do not introduce TypeScript unless requested.
- Normalize text with patterns already used in services, such as `String(value || "").trim()`.
- Normalize emails with `.toLowerCase()`.
- Normalize enum-like values such as roles or states with `.toUpperCase()` when appropriate.
- Use `Number(value)` for numeric inputs, preserve the distinction between `null`, empty string, and omitted values, and treat HTML booleans carefully.

## Controller Conventions
- Controllers stay thin and delegate business rules to services.
- For expected form errors, re-render the same view with `title`, `formData`, `errorMessage`, `formAction`, and `submitLabel`.
- For unexpected failures, call `next(error)`.
- Use `_req` or `_next` for intentionally unused parameters.
- HTML flows use `res.render(...)` and `res.redirect(...)`; JSON endpoints usually return `res.status(200).json({ success: true, data })`.
- Session login flows store identity data in `req.session.auth` and then call `req.session.save(...)`.
- When behavior depends on the current role or tenant, controllers should derive `authContext` from the request and pass it to services.

## Service Conventions
- Keep normalization and validation in services, close to the business rule they support.
- Use early validation with `HttpError` for expected failures.
- Validate cross-entity relationships before writing records.
- Use auth-scope helpers from `utils/authContext.js` for tenant-aware behavior.
- Prefer `Promise.all(...)` for independent datasets, return safe DTO-like objects, and catch duplicate keys with `handleMongoUnique(...)`.
- Keep role-specific account rules in services: `PLATFORM_ADMIN` keeps full account-management access, while `COMMERCE_ADMIN` is limited to managing `COMMERCE_USER` accounts inside its own `comercioId`.

## Repository And Model Conventions
- Reuse `createBaseRepository(...)` from `repositories/base.repository.js` where it fits.
- Keep repositories focused on reads and writes; do not move business rules there.
- Repository reads typically return lean/plain objects via `.lean()`.
- Shared schema helpers live in `models/shared.js`; prefer `createModel(...)`, which adds a UUID-style `id` plus timestamps.
- Prefer schema options and indexes instead of scattering metadata elsewhere.

## Auth, Session, And Routing Notes
- Platform login is handled separately from commerce login through `platformAuthController`.
- `requirePlatformAuth` protects platform-only areas like `comercios`, `suscripciones`, and billing reports.
- `requireAuth`, `requireCommerceAdmin`, and `requireTenantAccess` enforce operational access.
- `cuentas-comercio` is shared: `PLATFORM_ADMIN` can manage commerce admins and users globally, while `COMMERCE_ADMIN` can list, create, edit, and delete only `COMMERCE_USER` accounts from its own commerce.
- `COMMERCE_USER` stays scoped to its assigned `comercioId` and `tiendaId`, and should not be shown UI actions for stores or account management.
- Do not casually change auth/session keys, cookie names, role values, or tenant-scoping behavior; `utils/authContext.js` is the central scope helper.

## Error Handling
- Use `HttpError` for expected application errors.
- Common statuses already used: `400`, `401`, `403`, `404`, `409`, `422`.
- Use stable error codes like `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `DUPLICATE_KEY`, or relationship-specific codes.
- Non-`HttpError` failures should bubble to the shared error middleware, which renders `views/error.pug`.
- For unexpected failures, keep the message generic and let server logs carry details.

## View / Pug Notes
- Views are Pug, not EJS.
- Follow the existing CRUD template pattern: `index`, `form`, and `show`.
- Keep controller payloads simple and precomputed.
- If a view needs repeated formatting logic, prepare that value in the controller or service.

## Testing Guidance For New Work
- Prefer focused service-level tests for business rules.
- Mock repository and helper methods when possible instead of booting the full app.
- Existing tests commonly monkey-patch repository/service functions and restore them with `t.after(...)`.
- Use `node:assert/strict` and `assert.rejects(...)` for failure cases; for bug fixes, add the narrowest proving test.

## Change Safety
- Do not silently rename routes, view paths, form field names, or domain terms.
- Be careful with Mongo indexes and unique constraints; they often enforce real business rules.
- Avoid broad refactors unless they directly support the task.
- Read nearby files before editing and mirror local patterns.
- Prefer minimal diffs that fit the current architecture.
- If you add a new entity, implement all affected layers consistently.
