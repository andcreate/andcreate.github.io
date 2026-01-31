# Contributing Guide

**Updated:** 2026-01-31

## Development Setup

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation
```bash
npm install
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server (localhost:5173) |
| `build` | `tsc -b && vite build` | Type check and build for production |
| `lint` | `eslint .` | Run ESLint on all files |
| `preview` | `vite preview` | Preview production build locally |

### Common Workflows

**Development:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
```

**Check for Errors:**
```bash
npm run lint
npm run build
```

## Project Structure

```
src/
├── main.tsx          # Entry point
├── App.tsx           # Root component with grid items
├── index.css         # Global styles (Tailwind)
├── lib/utils.ts      # Utility functions
└── components/
    ├── Hero.tsx      # Background wrapper
    ├── LightRays.tsx # WebGL effect (ogl)
    └── ChromaGrid.tsx # Card grid (gsap)
```

## Environment Variables

This is a static site - no environment variables required.

## Code Style

- TypeScript strict mode
- ESLint with React Hooks plugin
- Tailwind CSS for styling
- CSS variables for theming (`--font-line-seed`, `--color-ac-*`)

## Adding New Components

1. Create component in `src/components/`
2. Use TypeScript interfaces for props
3. Import CSS file if needed (component-name.css)
4. Export from component file

## Testing

No test framework configured. Run build to verify:
```bash
npm run build
```
