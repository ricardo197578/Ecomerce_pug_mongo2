# AGENTS.md

## Purpose
- This repository is a Node.js backend for a multi-commerce e-commerce platform.
- Stack: Express 5, server-rendered Pug views, MongoDB via Mongoose, native ESM.
- Use this file as the default operating guide for coding agents working here.
- Prefer small, architecture-consistent changes over broad refactors.

## Repository Snapshot
- Entry point: `app.js`
- Runtime mode: `"type": "module"`
- Flow: `routes -> controllers -> services -> repositories -> models`
- Config: `config/config.js`, `config/database.js`
- Shared helpers: `services/helpers.js`, `utils/httpError.js`, `models/shared.js`
- Session auth is handled with `express-session`

## Rules Files Check
- No `.cursor/rules/` directory was found.
- No `.cursorrules` file was found.
- No `.github/copilot-instructions.md` file was found.
- This `AGENTS.md` is the main agent guidance source for the repo.

## Agent Priorities
- Keep the layered architecture intact.
- Preserve Spanish domain terms like `comercio`, `tienda`, `usuario`, `suscripcion`, `logistica`, `conciliacion`.
- Put business rules in services first, not in views.
- Keep persistence details inside repositories.
- Match existing route names, render payloads, and response shapes.
- Do not introduce new frameworks, validators, ORMs, or formatting tools unless requested.

## Commands

### Install / Run
```bash
npm install
npm run dev
npm start
npm run seed:platform-admin
```
- `npm run dev` uses `nodemon app.js`.
- `npm start` runs `node app.js`.
- There is no separate build step.

### Tests
```bash
npm test
node --test path/to/file.test.js
node --test --test-name-pattern="create comercio"
node --test test/comercio.service.test.js --test-name-pattern="duplicate cuit"
```
- `npm test` maps to `node --test`.
- Prefer `*.test.js` or `*.spec.js` so Node discovers files automatically.
- For a single file, pass the file path directly to `node --test`.

### Lint / Formatting Status
- No `lint` script exists in `package.json`.
- No ESLint config exists.
- No Prettier config exists.
- No `.editorconfig` exists.
- Do not invent a formatter style; mirror nearby files.

## Architecture Rules
- `routes/` declares endpoints and wires controllers.
- `controllers/` translate HTTP input into service calls and render, redirect, or return JSON.
- `services/` own normalization, validation, business rules, and relationship checks.
- `repositories/` own Mongoose queries and persistence behavior.
- `models/` define schemas, defaults, and indexes.
- `middlewares/` handle auth, 404s, and error rendering.
- `views/` contain Pug templates and should receive already-prepared display data.

## Imports And Exports
- Use ESM `import` / `export` only.
- Include the `.js` extension in local imports.
- Keep imports at the top of the file.
- Prefer relative imports; no path alias setup exists.
- Controllers, services, repositories, and models usually export object literals with `export const`.
- Reusable factories and helpers often use named functions such as `export function buildCrudController(...)`.
- Default exports are rare; follow existing patterns like `routes/index.js`.

## Naming Conventions
- File names are lowercase by layer: `comercio.service.js`, `crud.controller.js`, `account.repository.js`.
- Model files use PascalCase: `Comercio.js`, `Usuario.js`, `Suscripcion.js`.
- Mongoose models use `PascalCaseModel`, for example `SuscripcionModel`.
- Repositories use `camelCaseRepository`.
- Services use `camelCaseService`.
- Controllers use `camelCaseController`.
- Middleware names are verb-oriented, such as `requirePlatformAuth`, `requireRole`, `errorHandler`.
- Form defaults are usually named `formDefaults`.
- Derived render arrays are often named `itemsView` or `<entity>View`.

## Formatting Conventions
- Use semicolons.
- Use double quotes.
- Prefer 2-space indentation.
- Keep object literals and `res.render(...)` payloads multiline when they contain several fields.
- Use trailing commas only when the surrounding file already uses them.
- Keep lines readable instead of over-compressing logic.
- Some files are heavily commented in Spanish; preserve useful comments unless they become wrong.

## Controller Conventions
- Controllers stay thin and delegate business rules to services.
- For expected form errors, re-render the same view with `title`, `formData`, `errorMessage`, `formAction`, and `submitLabel`.
- For unexpected failures, call `next(error)`.
- Use `_req` or `_next` for intentionally unused parameters.
- HTML flows usually use `res.render(...)` and `res.redirect(...)`.
- JSON report endpoints use `res.status(200).json({ success: true, data })`.

## Service Conventions
- Keep normalization and validation in services, close to the business rule they support.
- Use early validation with `HttpError` for expected failures.
- Normalize text with patterns already used in the repo, such as `String(value || "").trim()`.
- Normalize emails with `.toLowerCase()`.
- Normalize enum-like values such as currency or state with uppercase when needed.
- Use `Number(value)` for numeric inputs and validate the result explicitly.
- Validate cross-entity relationships before writing records.
- Prefer `Promise.all(...)` when loading independent data sets.

## Repository And Model Conventions
- Reuse `createBaseRepository(...)` where it fits.
- Keep repositories focused on reads and writes only; do not move business rules there.
- Repository reads usually return lean/plain objects.
- Shared schema helpers live in `models/shared.js`; prefer `createModel(...)` for consistency.
- Prefer schema options and indexes instead of scattering metadata elsewhere.
- Follow existing foreign key naming such as `comercioId`, `tiendaId`, `usuarioId`.

## Types And Data Handling
- The codebase is plain JavaScript; do not introduce TypeScript unless requested.
- Preserve the distinction between `null`, empty string, and omitted values when the domain requires it.
- Be careful with HTML form booleans; existing services often treat `"true"`, `true`, and `"on"` as true.
- Keep DTO-like shaping close to the controller/service boundary rather than burying it in views.

## Error Handling
- Use `HttpError` for expected application errors.
- Common statuses already used: `400` invalid input, `401` bad credentials, `404` missing record, `409` duplicate key, `422` invalid state or relationship rule.
- `services/helpers.js` exposes `handleMongoUnique(...)` for Mongo duplicate key translation.
- Non-`HttpError` failures should be passed through and logged by the error middleware.
- The shared error middleware renders `views/error.pug`.

## Auth, Session, And Routing Notes
- Platform login is handled through `platformAuthController` and `req.session.auth`.
- `requirePlatformAuth` protects platform-only areas like some reports and subscription routes.
- Do not casually change auth/session keys, cookie names, or role values.
- The app exposes a health endpoint at `GET /health`.

## View / Pug Notes
- Views are Pug, not EJS.
- Keep controller payloads simple and precomputed.
- Follow the existing `index`, `form`, and `show` template pattern for CRUD sections.
- If a view needs repeated formatting logic, prepare that value in the controller or service.

## Testing Guidance For New Work
- Use Node's built-in test runner via `node:test`.
- Prefer focused service-level tests for business rules.
- Mock repository behavior when possible instead of booting the full app.
- For bug fixes, add the narrowest test that proves the issue is fixed.

## Change Safety
- Do not silently rename routes, view paths, form field names, or domain terms.
- Be careful with Mongo indexes and unique constraints; they often enforce real business rules.
- Avoid broad refactors unless they directly support the task.
- Read nearby files before editing and mirror local patterns.
- Prefer minimal diffs that fit the current architecture.
- If you add a new entity, implement all affected layers consistently.
