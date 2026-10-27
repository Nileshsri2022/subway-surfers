# Subway Runner

An original 3D endless-runner web game. Play in the browser on desktop or mobile.

## Install

```bash
bun install
```

## Dev

```bash
bun run dev
```

## Test

```bash
bun run test          # unit tests (Vitest)
bun run test:e2e      # Playwright e2e (builds first)
```

## Build

```bash
bun run build         # tsc --noEmit && vite build -> dist/
bun run preview       # preview the production build
```

## Deploy

Static hosting: upload the `dist/` directory to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages). The app is a PWA and works offline after the first load.

## Controls

- Desktop: ArrowLeft/ArrowRight (or A/D) change lanes, ArrowUp/W/Space jump, ArrowDown/S roll.
- Mobile: swipe left/right to change lanes, swipe up to jump, swipe down to roll.

## Browser support

Chrome, Edge, Firefox, Safari (desktop); iOS Safari and Android Chrome. WebGL required.