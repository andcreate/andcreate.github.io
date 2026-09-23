import { createNoise3D } from "simplex-noise";

/**
 * Generative "&": particles drift through a simplex-noise field and leave
 * trails. Inside the glyph the trails are dense, outside they are faint,
 * so the ampersand slowly draws itself out of the motion.
 */

const GLYPH = "&";
const FONT_FAMILY = '"Bricolage Grotesque Variable", system-ui, sans-serif';
const FONT_WEIGHT = 800;
const NOISE_SCALE = 0.0021;
const TIME_STEP = 0.0016;
const SPEED = 1.4;
// Kept above ~0.07: lower values leave a visible residue from 8-bit rounding.
// The panel has its own tone (--art-bg) so the small remaining residue never meets the page background.
const FADE_ALPHA = 0.075;
const MAX_DPR = 2;
const STATIC_STEPS = 520;

interface Particle {
  x: number;
  y: number;
  life: number;
}

interface Palette {
  bg: string;
  ink: string;
  accent: string;
}

interface Scene {
  width: number;
  height: number;
  mask: Uint8ClampedArray;
  maskWidth: number;
  maskHeight: number;
  fontSize: number;
  glyphX: number;
  glyphY: number;
  particles: Particle[];
}

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const get = (name: string) => style.getPropertyValue(name).trim();
  return { bg: get("--art-bg"), ink: get("--ink"), accent: get("--accent") };
}

function spawn(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    life: 60 + Math.random() * 220,
  };
}

function fitGlyph(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const probe = 100;
  ctx.font = `${FONT_WEIGHT} ${probe}px ${FONT_FAMILY}`;
  const m = ctx.measureText(GLYPH);
  const glyphW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const scale = Math.min((width * 0.86) / glyphW, (height * 0.8) / glyphH);
  const fontSize = probe * scale;
  const glyphX = width / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) * scale) / 2;
  const glyphY = height / 2 + ((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) * scale) / 2;
  return { fontSize, glyphX, glyphY };
}

function buildScene(width: number, height: number): Scene {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(width));
  off.height = Math.max(1, Math.round(height));
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) throw new Error("2D canvas is not available");

  const { fontSize, glyphX, glyphY } = fitGlyph(octx, width, height);
  octx.font = `${FONT_WEIGHT} ${fontSize}px ${FONT_FAMILY}`;
  octx.textBaseline = "alphabetic";
  octx.fillStyle = "#fff";
  octx.fillText(GLYPH, glyphX, glyphY);

  const { data } = octx.getImageData(0, 0, off.width, off.height);
  const mask = new Uint8ClampedArray(off.width * off.height);
  for (let i = 0; i < mask.length; i += 1) mask[i] = data[i * 4 + 3];

  const count = Math.round(Math.min(2600, Math.max(700, (width * height) / 240)));
  const particles = Array.from({ length: count }, () => spawn(width, height));
  return { width, height, mask, maskWidth: off.width, maskHeight: off.height, fontSize, glyphX, glyphY, particles };
}

function inside(scene: Scene, x: number, y: number): boolean {
  const ix = x | 0;
  const iy = y | 0;
  if (ix < 0 || iy < 0 || ix >= scene.maskWidth || iy >= scene.maskHeight) return false;
  return scene.mask[iy * scene.maskWidth + ix] > 127;
}

export function mountFlowField(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const noise3D = createNoise3D();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  let scene: Scene | null = null;
  let palette = readPalette();
  let time = Math.random() * 100;
  let frame = 0;
  let intersecting = true;
  let resizeTimer = 0;
  let lastSize = "";
  let highlight = false;
  let staticDrawn = false;

  const clear = () => {
    if (!scene) return;
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, scene.width, scene.height);
  };

  const drawOutline = (alpha: number) => {
    if (!scene) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1;
    ctx.font = `${FONT_WEIGHT} ${scene.fontSize}px ${FONT_FAMILY}`;
    ctx.strokeText(GLYPH, scene.glyphX, scene.glyphY);
  };

  // One step of the simulation; trails are batched into two paths per frame.
  const step = (innerAlpha: number, outerAlpha: number) => {
    if (!scene) return;
    const inner = new Path2D();
    const outer = new Path2D();
    for (const p of scene.particles) {
      const angle = noise3D(p.x * NOISE_SCALE, p.y * NOISE_SCALE, time) * Math.PI * 2;
      const nx = p.x + Math.cos(angle) * SPEED;
      const ny = p.y + Math.sin(angle) * SPEED;
      const path = inside(scene, nx, ny) ? inner : outer;
      path.moveTo(p.x, p.y);
      path.lineTo(nx, ny);
      p.x = nx;
      p.y = ny;
      p.life -= 1;
      if (p.life <= 0 || nx < 0 || ny < 0 || nx > scene.width || ny > scene.height) {
        Object.assign(p, spawn(scene.width, scene.height));
      }
    }
    ctx.lineWidth = 1;
    ctx.globalAlpha = outerAlpha;
    ctx.strokeStyle = palette.ink;
    ctx.stroke(outer);
    ctx.globalAlpha = innerAlpha;
    ctx.strokeStyle = highlight ? palette.accent : palette.ink;
    ctx.stroke(inner);
    time += TIME_STEP;
  };

  const renderStatic = () => {
    clear();
    for (let i = 0; i < STATIC_STEPS; i += 1) step(0.09, 0.012);
    drawOutline(0.18);
  };

  const isActive = () => intersecting && document.visibilityState === "visible";

  const tick = () => {
    frame = 0;
    if (!scene || !isActive() || reduceMotion.matches) return;
    ctx.globalAlpha = FADE_ALPHA;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, scene.width, scene.height);
    step(0.7, 0.06);
    drawOutline(0.05);
    frame = requestAnimationFrame(tick);
  };

  const start = () => {
    cancelAnimationFrame(frame);
    if (!scene) return;
    if (reduceMotion.matches) {
      if (!staticDrawn) renderStatic();
      staticDrawn = true;
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const size = `${Math.round(rect.width)}x${Math.round(rect.height)}@${dpr}`;
    if (size === lastSize) return;
    lastSize = size;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scene = buildScene(rect.width, rect.height);
    staticDrawn = false;
    clear();
    start();
  };

  const onScheme = () => {
    palette = readPalette();
    staticDrawn = false;
    clear();
    start();
  };

  const onHighlight = (event: Event) => {
    highlight = Boolean((event as CustomEvent<string | null>).detail);
  };

  // Rebuilding the glyph mask is expensive, so settle resizes before redrawing.
  const scheduleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 150);
  };

  // Moving the window between screens changes DPR without changing CSS size.
  let dprQuery: MediaQueryList | null = null;
  const watchDpr = () => {
    dprQuery?.removeEventListener("change", onDprChange);
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    dprQuery.addEventListener("change", onDprChange);
  };
  function onDprChange() {
    watchDpr();
    scheduleResize();
  }

  const resizeObserver = new ResizeObserver(scheduleResize);
  const visibilityObserver = new IntersectionObserver((entries) => {
    intersecting = entries[entries.length - 1].isIntersecting;
    if (isActive()) start();
  });
  const onVisibility = () => {
    if (isActive()) start();
  };

  document.fonts
    .load(`${FONT_WEIGHT} 100px ${FONT_FAMILY}`, GLYPH)
    .catch(() => [])
    .finally(() => {
      resize();
      resizeObserver.observe(canvas);
      visibilityObserver.observe(canvas);
      watchDpr();
    });

  darkScheme.addEventListener("change", onScheme);
  reduceMotion.addEventListener("change", start);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("destination:hover", onHighlight);

  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(resizeTimer);
    dprQuery?.removeEventListener("change", onDprChange);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    darkScheme.removeEventListener("change", onScheme);
    reduceMotion.removeEventListener("change", start);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("destination:hover", onHighlight);
  };
}
