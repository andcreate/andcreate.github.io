import { AMPERSAND_CENTER, AMPERSAND_PATH } from "../../data/ampersand";

/**
 * Point clouds the particles can gather into. Each returns `count` xyz triples in world units.
 * パーティクルが集まる形。どれも count 個の xyz をワールド単位で返す。
 */

export type Cloud = Float32Array;

/** Height of the "&" in world units; every formation is sized against it. / 「&」の高さ。他の形もこれを基準にする */
export const AMP_HEIGHT = 3.2;
const GLYPH_HEIGHT = 78.4;
const GLYPH_BOX = { x: 2.7, y: -76.7, w: 95.1, h: 78.4 };
const DEPTH = 0.55;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Particles inside the "&", denser along its edges so the silhouette stays crisp. */
/** 「&」の内側に配置。輪郭が締まるよう縁を濃くする。 */
export function sampleAmpersand(count: number): Cloud {
  const scale = 4;
  const pad = 4;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(GLYPH_BOX.w * scale + pad * 2);
  canvas.height = Math.ceil(GLYPH_BOX.h * scale + pad * 2);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas is not available");
  ctx.setTransform(scale, 0, 0, scale, pad - GLYPH_BOX.x * scale, pad - GLYPH_BOX.y * scale);
  ctx.fill(new Path2D(AMPERSAND_PATH));
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3] > 127;
  const edge = (x: number, y: number) => !solid(x + 3, y) || !solid(x - 3, y) || !solid(x, y + 3) || !solid(x, y - 3);

  const k = AMP_HEIGHT / GLYPH_HEIGHT;
  const out = new Float32Array(count * 3);
  let n = 0;
  // Rejection sampling; the guard only stops a pathological empty mask from looping forever.
  // 棄却サンプリング。ガードはマスクが空のときに無限ループしないためだけのもの。
  for (let guard = 0; n < count && guard < count * 200; guard += 1) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (!solid(x, y)) continue;
    const onEdge = edge(x, y);
    if (!onEdge && Math.random() > 0.45) continue;
    const gx = (x - pad) / scale + GLYPH_BOX.x;
    const gy = (y - pad) / scale + GLYPH_BOX.y;
    out[n * 3] = (gx - AMPERSAND_CENTER.x) * k;
    out[n * 3 + 1] = -(gy - AMPERSAND_CENTER.y) * k;
    // Edge particles sit on the faces, interior ones fill the depth.
    // 縁の粒は前後の面に、内側の粒は厚みの中に。
    out[n * 3 + 2] = onEdge ? (Math.random() < 0.5 ? -1 : 1) * DEPTH * 0.5 : rand(-0.5, 0.5) * DEPTH;
    n += 1;
  }
  return out;
}

/** Start positions: scattered over the wave floor below. / 開始位置：下の波打つ床に散らばる */
export function sampleFloor(count: number, floorY: number): Cloud {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    out[i * 3] = rand(-11, 11);
    out[i * 3 + 1] = floorY;
    out[i * 3 + 2] = rand(-9, 2.5);
  }
  return out;
}

/** Web: a browser-shaped sheet of rows and columns. / Web：行と列でできたブラウザ型の面 */
export function sampleSheet(count: number): Cloud {
  const w = AMP_HEIGHT * 1.45;
  const h = AMP_HEIGHT * 0.95;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const onRow = Math.random() < 0.5;
    const lines = onRow ? 9 : 12;
    const line = Math.floor(Math.random() * lines) / (lines - 1);
    const along = Math.random();
    const x = (onRow ? along : line) - 0.5;
    const y = (onRow ? line : along) - 0.5;
    out[i * 3] = x * w;
    out[i * 3 + 1] = y * h;
    out[i * 3 + 2] = x * 0.6 + rand(-0.02, 0.02);
  }
  return out;
}

/** Virtual: a tilted halo, the ring a stage hangs above its performer. / Virtual：傾いた光輪 */
export function sampleRing(count: number): Cloud {
  const radius = AMP_HEIGHT * 0.55;
  const tube = AMP_HEIGHT * 0.06;
  const tilt = 1.1;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * Math.PI * 2;
    const r = radius + Math.cos(b) * tube;
    const x = Math.cos(a) * r;
    const y = Math.sin(b) * tube;
    const z = Math.sin(a) * r;
    out[i * 3] = x;
    out[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
    out[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);
  }
  return out;
}

/** BOOTH: a loose stack of small cubes, the props on a shelf. / BOOTH：小さな立方体の山（棚の小道具） */
export function sampleCubes(count: number): Cloud {
  const cubes = [
    [-0.9, -0.8, 0.2, 0.9],
    [0.35, -0.85, -0.3, 0.8],
    [1.25, -0.95, 0.4, 0.6],
    [-0.3, 0.25, 0, 0.75],
    [0.75, 0.05, 0.5, 0.5],
    [0.15, 1.0, -0.2, 0.45],
  ];
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const [cx, cy, cz, size] = cubes[i % cubes.length];
    // A point on a random face of the cube. / 立方体のいずれかの面上の点
    const p = [rand(-0.5, 0.5), rand(-0.5, 0.5), rand(-0.5, 0.5)];
    p[Math.floor(Math.random() * 3)] = Math.random() < 0.5 ? -0.5 : 0.5;
    out[i * 3] = cx + p[0] * size;
    out[i * 3 + 1] = cy + p[1] * size;
    out[i * 3 + 2] = cz + p[2] * size;
  }
  return out;
}

/** Documents: pages stacked and slightly fanned. / Documents：少しずらして重ねたページ */
export function sampleLayers(count: number): Cloud {
  const pages = 6;
  const w = AMP_HEIGHT * 0.8;
  const h = AMP_HEIGHT * 1.0;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const page = i % pages;
    const t = page / (pages - 1) - 0.5;
    let x: number;
    let y: number;
    if (Math.random() < 0.45) {
      // Page outline. / ページの輪郭
      const side = Math.floor(Math.random() * 4);
      const along = rand(-0.5, 0.5);
      x = side < 2 ? along : side === 2 ? -0.5 : 0.5;
      y = side < 2 ? (side === 0 ? -0.5 : 0.5) : along;
    } else {
      // Lines of text, short last line per paragraph. / 本文の行（段落の最終行は短く）
      const line = Math.floor(Math.random() * 11);
      const length = line % 4 === 3 ? 0.45 : 0.78;
      x = -0.39 + Math.random() * length;
      y = 0.36 - line * 0.068;
    }
    out[i * 3] = x * w + t * 0.9;
    out[i * 3 + 1] = y * h - t * 0.5;
    out[i * 3 + 2] = t * 1.6;
  }
  return out;
}
