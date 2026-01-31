# Frontend Structure

**Updated:** 2026-01-31

## Components

### Active Components
| Component | File | Dependencies | Purpose |
|-----------|------|--------------|---------|
| App | App.tsx | Hero, ChromaGrid | Root layout |
| Hero | Hero.tsx | LightRays | Background container |
| LightRays | LightRays.tsx | ogl | WebGL light effect |
| ChromaGrid | ChromaGrid.tsx | gsap | Interactive card grid |

### Legacy Components (Unused)
| Component | Status |
|-----------|--------|
| FaultyTerminal | Replaced by LightRays |
| FuzzyText | Unused |
| TargetCursor | Unused |
| AndCreateType | Removed from App |

## Styling Architecture

### Global (index.css)
- Tailwind CSS v4 (CSS-first config)
- Custom theme variables (`--font-*`, `--color-ac-*`)
- Custom utilities (`text-0` to `text-9`)

### Component CSS
| File | Scope |
|------|-------|
| ChromaGrid.css | Card grid, hover effects, overlay |
| LightRays.css | WebGL canvas container |

## Data Flow
```
gridItems (App.tsx)
    ↓ props
ChromaGrid
    ↓ map
chroma-card (onClick → window.open)
```

## Props Interface
```typescript
// ChromaGrid
interface ChromaItem {
  image: string
  title: string
  subtitle: string
  borderColor?: string
  gradient: string
  url?: string
}

interface ChromaGridProps {
  items?: ChromaItem[]
  columns?: number
  rows?: number
  cardSize?: number
  radius?: number
}

// LightRays
interface LightRaysProps {
  raysOrigin?: RaysOrigin
  raysColor?: string
  raysSpeed?: number
  lightSpread?: number
  rayLength?: number
  followMouse?: boolean
  // ...
}
```
