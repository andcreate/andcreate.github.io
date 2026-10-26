import * as THREE from "three";
import {
  AMP_HEIGHT,
  sampleAmpersand,
  sampleCubes,
  sampleFloor,
  sampleLayers,
  sampleRing,
  sampleSheet,
} from "./formations";
import { AMP_FRAGMENT, AMP_VERTEX, FLOOR_FRAGMENT, FLOOR_VERTEX } from "./shaders";

/**
 * Background field: a wave of points like a stage floor seen in the dark, and above it
 * a cloud that gathers into "&". Hovering a destination reshapes the cloud.
 * 背景：暗がりのステージ床のように波打つ点の面と、その上で「&」に集まる点の雲。
 * 行き先にホバーすると雲の形が変わる。
 */

const MAX_DPR = 1.75;
const FOV = 35;
const FLOOR_Y = -2.3;
const FORM_SECONDS = 2.4;
const MORPH_ORDER = ["web", "virtual", "booth", "docs"] as const;

interface Palette {
  ground: THREE.Color;
  ink: THREE.Color;
  accent: THREE.Color;
}

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => new THREE.Color(style.getPropertyValue(name).trim() || fallback);
  return { ground: get("--bg", "#08090a"), ink: get("--ink", "#ecece9"), accent: get("--accent", "#f0633f") };
}

function buildRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer | null {
  try {
    return new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "default" });
  } catch (error) {
    console.warn("Field: WebGL is unavailable, keeping the plain ground.", error);
    return null;
  }
}

function createCloud(count: number, palette: Palette) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(sampleAmpersand(count), 3));
  geometry.setAttribute("aScatter", new THREE.BufferAttribute(sampleFloor(count, FLOOR_Y), 3));
  geometry.setAttribute("aWeb", new THREE.BufferAttribute(sampleSheet(count), 3));
  geometry.setAttribute("aVirtual", new THREE.BufferAttribute(sampleRing(count), 3));
  geometry.setAttribute("aBooth", new THREE.BufferAttribute(sampleCubes(count), 3));
  geometry.setAttribute("aDocs", new THREE.BufferAttribute(sampleLayers(count), 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(Float32Array.from({ length: count }, Math.random), 1));
  // Bounds never change in a way culling cares about. / カリングに影響する境界変化はない
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);

  const material = new THREE.ShaderMaterial({
    vertexShader: AMP_VERTEX,
    fragmentShader: AMP_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uForm: { value: 0 },
      uMorph: { value: new THREE.Vector4(0, 0, 0, 0) },
      uPointer: { value: new THREE.Vector3(99, 99, 0) },
      uPointerOn: { value: 0 },
      uSize: { value: 30 },
      uPixelRatio: { value: 1 },
      uInk: { value: palette.ink },
      uAccent: { value: palette.accent },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

function createFloor(cols: number, rows: number, palette: Palette) {
  const positions = new Float32Array(cols * rows * 3);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = (r * cols + c) * 3;
      positions[i] = (c / (cols - 1) - 0.5) * 28;
      positions[i + 1] = FLOOR_Y;
      positions[i + 2] = -14 + (r / (rows - 1)) * 20;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
  const material = new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERTEX,
    fragmentShader: FLOOR_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(99, 99) },
      uPointerOn: { value: 0 },
      uEnergy: { value: 0 },
      uPixelRatio: { value: 1 },
      uInk: { value: palette.ink },
      uAccent: { value: palette.accent },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

export function mountField(canvas: HTMLCanvasElement): () => void {
  const renderer = buildRenderer(canvas);
  if (!renderer) return () => {};

  const compact = window.matchMedia("(max-width: 767px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const palette = readPalette();

  const scene = new THREE.Scene();
  scene.background = palette.ground;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  const cloud = createCloud(compact ? 7000 : 16000, palette);
  const floor = createFloor(compact ? 110 : 190, compact ? 50 : 80, palette);
  scene.add(floor, cloud);

  const morph = new THREE.Vector4(0, 0, 0, 0);
  const morphTarget = new THREE.Vector4(0, 0, 0, 0);
  const morphGap = new THREE.Vector4(0, 0, 0, 0);
  const pointerNdc = new THREE.Vector2();
  const pointerSmoothed = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const cloudPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y);
  const hit = new THREE.Vector3();
  let last = performance.now();
  const delta = () => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    return dt;
  };
  let pointerActive = 0;
  let pointerSeen = false;
  let time = 0;
  let form = reduceMotion.matches ? 1 : 0;
  let frame = 0;
  let size = "";
  let distance = 11;
  let dirty = true;
  let viewWidth = 1;
  let viewHeight = 1;
  let lift = false;
  const ORIGIN = new THREE.Vector2();

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const next = `${width}x${height}@${dpr}`;
    if (next === size || width < 2 || height < 2) return;
    size = next;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    viewWidth = width;
    viewHeight = height;
    lift = width < 768;
    // Pull back on narrow screens so the "&" keeps its margins. / 縦長の画面では引いて「&」の余白を保つ
    const halfTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const fitHeight = AMP_HEIGHT / 0.5 / (2 * halfTan);
    const fitWidth = (AMP_HEIGHT * 1.25) / 0.78 / (2 * halfTan * camera.aspect);
    distance = Math.max(fitHeight, fitWidth);
    cloud.material.uniforms.uPixelRatio.value = dpr;
    floor.material.uniforms.uPixelRatio.value = dpr;
    dirty = true;
    request();
  };

  const placeCamera = () => {
    camera.position.set(pointerSmoothed.x * 0.6, 1.9 - pointerSmoothed.y * 0.35, distance);
    camera.lookAt(0, -0.2, 0);
    // Phones stack the links low, so lift the "&" toward the name. / スマホはリンクが下に並ぶため「&」を社名側へ持ち上げる
    if (lift) camera.setViewOffset(viewWidth, viewHeight, 0, viewHeight * 0.1, viewWidth, viewHeight);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };

  const updatePointer = () => {
    if (!pointerSeen) return;
    raycaster.setFromCamera(pointerNdc, camera);
    if (raycaster.ray.intersectPlane(cloudPlane, hit)) cloud.material.uniforms.uPointer.value.copy(hit);
    if (raycaster.ray.intersectPlane(floorPlane, hit)) floor.material.uniforms.uPointer.value.set(hit.x, hit.z);
  };

  const tick = () => {
    frame = 0;
    const dt = Math.min(delta(), 0.05);
    const still = reduceMotion.matches;
    const k = still ? 1 : 1 - Math.exp(-dt * 2.6);

    const settledBefore = morphGap.subVectors(morph, morphTarget).lengthSq() < 1e-6;
    morph.lerp(morphTarget, k);
    pointerSmoothed.lerp(still ? ORIGIN : pointerNdc, 1 - Math.exp(-dt * 3));
    pointerActive += ((still ? 0 : pointerSeen ? 1 : 0) - pointerActive) * (1 - Math.exp(-dt * 4));

    // Reduced motion: no loop; one still frame, redrawn only when the shape or size changes.
    // 動きを減らす設定：ループせず静止画 1 枚。形かサイズが変わったときだけ描き直す。
    if (!still) frame = requestAnimationFrame(tick);
    if (still && settledBefore && !dirty) return;
    dirty = false;

    if (!still) {
      time += dt;
      form = Math.min(1, form + dt / FORM_SECONDS);
    }
    placeCamera();
    updatePointer();

    const energy = morph.x + morph.y + morph.z + morph.w;
    const cu = cloud.material.uniforms;
    cu.uTime.value = time;
    cu.uForm.value = form;
    cu.uMorph.value.copy(morph);
    cu.uPointerOn.value = pointerActive;
    const fu = floor.material.uniforms;
    fu.uTime.value = time;
    fu.uPointerOn.value = pointerActive;
    fu.uEnergy.value = Math.min(1, energy);
    cloud.rotation.y = Math.sin(time * 0.18) * 0.22 + pointerSmoothed.x * 0.25;

    renderer.render(scene, camera);
  };

  function request() {
    if (!frame && document.visibilityState === "visible") frame = requestAnimationFrame(tick);
  }

  const start = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    delta();
    request();
  };

  // Mouse and touch both stir the field; listeners are passive so scrolling is never blocked.
  // マウスでもタッチでも場が揺れる。passive なのでスクロールは妨げない。
  const onPointer = (event: PointerEvent) => {
    pointerSeen = true;
    // Map against the canvas (lvh tall), not the visible viewport. / 可視領域ではなく canvas（lvh）基準で変換する
    pointerNdc.set((event.clientX / viewWidth) * 2 - 1, -(event.clientY / viewHeight) * 2 + 1);
  };
  const onPointerOut = () => {
    pointerSeen = false;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") pointerSeen = false;
  };
  const onDestination = (event: Event) => {
    const index = MORPH_ORDER.indexOf((event as CustomEvent<string | null>).detail as (typeof MORPH_ORDER)[number]);
    morphTarget.set(index === 0 ? 1 : 0, index === 1 ? 1 : 0, index === 2 ? 1 : 0, index === 3 ? 1 : 0);
    dirty = true;
    request();
  };
  const onMotionChange = () => {
    if (reduceMotion.matches) form = 1;
    dirty = true;
    start();
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
  };
  // Moving the window between screens changes DPR without changing CSS size.
  // 画面間の移動では CSS サイズが変わらず DPR だけ変わる。
  let dprQuery: MediaQueryList | null = null;
  const watchDpr = () => {
    dprQuery?.removeEventListener("change", onDprChange);
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    dprQuery.addEventListener("change", onDprChange);
  };
  function onDprChange() {
    watchDpr();
    resize();
  }

  const onRestored = () => {
    size = "";
    resize();
    start();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  watchDpr();
  start();

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  document.documentElement.addEventListener("pointerleave", onPointerOut);
  window.addEventListener("destination:hover", onDestination);
  document.addEventListener("visibilitychange", start);
  reduceMotion.addEventListener("change", onMotionChange);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    dprQuery?.removeEventListener("change", onDprChange);
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("pointerdown", onPointer);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    document.documentElement.removeEventListener("pointerleave", onPointerOut);
    window.removeEventListener("destination:hover", onDestination);
    document.removeEventListener("visibilitychange", start);
    reduceMotion.removeEventListener("change", onMotionChange);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    cloud.geometry.dispose();
    cloud.material.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    renderer.dispose();
  };
}
