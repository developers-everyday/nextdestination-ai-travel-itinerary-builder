# Project Rules — NextDestination.ai

## Monorepo / Workspace Setup

This project is an **npm workspaces monorepo**. Key rules:

- **Root `package.json`** declares `"workspaces": ["packages/*"]`.
- When installing a dependency for `packages/web`, run `npm install <pkg> --legacy-peer-deps` **from the root directory**, NOT from `packages/web/`.
- npm hoists all dependencies to the **root `node_modules/`**, not into `packages/web/node_modules/`.
- The web package uses **React 19**, which causes peer dependency conflicts with some libraries. Always use `--legacy-peer-deps` flag.
- The `server/` directory is **NOT** part of npm workspaces — it has its own `package.json` and `node_modules`. Install server deps with `npm install` from within `server/`.

## Package Structure

| Package | Path | Purpose |
|---------|------|---------|
| `@nextdestination/web` | `packages/web` | Vite + React frontend |
| `@nextdestination/shared` | `packages/shared` | Shared types, utils, API |
| `@nextdestination/mobile` | `packages/mobile` | Capacitor mobile app |
| Server | `server/` | Express.js backend (standalone) |

## Build Commands

- `npm run dev:web` — Start web dev server (from root)
- `npm run dev:server` — Start backend server (from root)
- `npm run dev:all` — Start both concurrently
- `npm run build:shared && npm run build:web` — Production build
