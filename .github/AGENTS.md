# Agent guidelines

## Repository layout

- `backend/api` — ASP.NET Core 10 Web API, EF Core/SQLite data access, services, validators, and OpenAPI/Scalar docs.
- `backend/tests` — backend unit tests.
- `backend/rental-management.sln` — both .NET projects.
- `backend/Directory.Packages.props` — central NuGet package versions.
- `frontend` — React + TypeScript + Vite client, RTK Query endpoints, Vitest unit tests, and Playwright E2E specs.
- `global.json` — pinned .NET SDK.
- `.gitattributes` — line-ending and binary-file rules.
- `.github/CODEOWNERS` — code ownership.
- `.github/dependabot.yml` — weekly npm and NuGet dependency updates.

## Working rules

- Keep code minimal, optimized, and consistent with the surrounding style. Avoid redundant comments and explanatory noise.
- Preserve public identifiers used by tests: route paths, element IDs, `aria-label`s, and role gates.
- Admin lists use page-specific filter dialogs, toolbar add dialogs, editable rows, and newest-first ordering. Do not move create/edit forms back onto the list pages.
- Do not commit secrets. Development seed credentials are for local use only.

## Commands

Run from the repository root unless stated otherwise:

```bash
dotnet build backend/rental-management.sln
dotnet test backend/rental-management.sln
```

Run from `frontend`:

```bash
npm ci
npm run lint
npm run build
npm run test:unit
npm run test:e2e
```

`npm run dev` starts the API on `http://127.0.0.1:5180` and Vite on `http://127.0.0.1:5173`.

## Definition of done

- Backend tests: `0` failures.
- Frontend unit tests: `0` failures.
- Playwright E2E: `0` failures.
- `npm run build` and `npm run lint`: clean.
- Working tree is clean after the commit.
- Release commits are tagged `vX.Y`.
