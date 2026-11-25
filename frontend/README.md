# Rental Management Frontend

React + TypeScript + Vite client for the Rental Management API.

## Commands

```bash
npm install

npm run dev        # backend + Vite together
npm run vite       # Vite only
npm run build      # type-check and production build
npm run lint
npm run test:unit  # Vitest + Testing Library
npm run test:e2e   # Playwright (installs browsers and starts both servers)
```

Vite listens on `http://127.0.0.1:5173` and proxies `/api` to `http://127.0.0.1:5180`.

## Layout

- `src/features/auth` — auth state, login/register, route and role guards
- `src/pages` — feature screens for properties, tenants, units, leases, payments, maintenance, and audit
- `src/services` — RTK Query base client and domain endpoints
- `src/lib` — storage, role normalization, error parsing, constants
- `src/test` — Vitest setup and render helpers
- `tests` — Playwright end-to-end specs

Unit tests live beside the code as `*.test.ts` / `*.test.tsx`. Playwright specs live in `tests/`.
