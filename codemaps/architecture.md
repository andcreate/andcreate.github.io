# Architecture Overview

**Updated:** 2026-01-31

## Project Type
Static portfolio site (GitHub Pages)

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Build:** Vite 6
- **Styling:** Tailwind CSS 4
- **Animation:** GSAP, OGL (WebGL)

## Directory Structure
```
src/
├── main.tsx          # Entry point
├── App.tsx           # Root component
├── index.css         # Global styles, Tailwind config
├── lib/
│   └── utils.ts      # Utility functions (cn)
└── components/
    ├── Hero.tsx          # Background wrapper
    ├── LightRays.tsx     # WebGL light rays effect
    ├── ChromaGrid.tsx    # Interactive card grid
    └── [legacy]/         # Unused components
```

## Component Hierarchy
```
App
├── Hero
│   └── LightRays (WebGL)
├── ChromaGrid
│   └── chroma-card (x4)
└── footer
```

## Dependencies Graph
```
main.tsx
└── App.tsx
    ├── Hero.tsx
    │   └── LightRays.tsx (ogl)
    └── ChromaGrid.tsx (gsap)

index.css
└── tailwindcss, tw-animate-css
```

## External Dependencies
| Package | Purpose |
|---------|---------|
| gsap | Animation (ChromaGrid hover) |
| ogl | WebGL rendering (LightRays) |
| clsx + tailwind-merge | Class utilities |
| lucide-react | Icons (unused) |
