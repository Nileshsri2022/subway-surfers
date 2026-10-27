# Subway Runner

An original 3D endless-runner game for the browser, built with TypeScript and the PlayCanvas Engine.

## Requirements

- [Bun](https://bun.sh/) 1.4 or newer
- A WebGL2-capable browser

## Getting started

```bash
bun install
bun run dev
```

Vite prints the local URL (default `http://localhost:5173`).

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the Vite dev server |
| `bun run build` | Typecheck, then build static files into `dist/` |
| `bun run preview` | Serve the production build locally |
| `bun run test` | Run unit tests with Vitest |
| `bun run typecheck` | Typecheck with `tsc --noEmit` |
| `bun run test:e2e` | Run Playwright end-to-end tests |

## Deployment

`bun run build` emits a static site in `dist/` that can be hosted on any static file host.
