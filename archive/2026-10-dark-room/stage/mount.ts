import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { cueFor, type Cue } from "./cues";
import { AMP_HEIGHT, AMP_WIDTH, createAmpersand, createBeam, createHaze, createLedWall } from "./objects";

/**
 * One fixed full-viewport canvas renders the stage. It is clipped to the page's
 * "windows" ([data-stage-window]) so the "&" shows through them and never covers text.
 * 画面固定の 1 枚のキャンバスでステージを描き、ページ上の「窓」に clip-path で切り抜く。
 * テキストの上には決して重ならない。
 */

const MAX_DPR = 1.75;
const FOV = 30;
const CAMERA_DISTANCE = 7.2;
const LOOK_AT = new THREE.Vector3(0, AMP_HEIGHT / 2 + 0.06, 0);
const FRAMING_BLEND_SECONDS = 0.7;

interface Framing {
  cx: number;
  cy: number;
  zoom: number;
}

interface LiveCue {
  beam: THREE.Color;
  wall: THREE.Color;
  azimuth: number;
  elevation: number;
  sweep: number;
}

const toLive = (cue: Cue): LiveCue => ({
  beam: new THREE.Color(cue.beam),
  wall: new THREE.Color(cue.wall),
  azimuth: cue.azimuth,
  elevation: cue.elevation,
  sweep: cue.sweep,
});

function visibleRects(windows: HTMLElement[], width: number, height: number) {
  return windows
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .map(({ el, rect }) => {
      const left = Math.max(0, rect.left);
      const top = Math.max(0, rect.top);
      const right = Math.min(width, rect.right);
      const bottom = Math.min(height, rect.bottom);
      return { el, rect, clip: { left, top, right, bottom }, area: Math.max(0, right - left) * Math.max(0, bottom - top) };
    })
    .filter((w) => w.area > 0);
}

function framingFor(rect: DOMRect, width: number, height: number): Framing {
  const visibleH = 2 * CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const visibleW = visibleH * (width / height);
  const zoomH = ((0.56 * rect.height) / height) * (visibleH / AMP_HEIGHT);
  const zoomW = ((0.56 * rect.width) / width) * (visibleW / AMP_WIDTH);
  return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, zoom: Math.min(zoomH, zoomW) };
}

function buildRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer | null {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    return renderer;
  } catch (error) {
    console.warn("Stage: WebGL is unavailable, keeping the still poster.", error);
    return null;
  }
}

export function mountStage(canvas: HTMLCanvasElement): () => void {
  const renderer = buildRenderer(canvas);
  if (!renderer) return () => {};

  const root = document.documentElement;
  const compact = window.matchMedia("(max-width: 767px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ground = getComputedStyle(root).getPropertyValue("--bg").trim() || "#0a0a0a";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ground);
  scene.fog = new THREE.Fog(ground, 9, 17);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);

  // Floor: a mirror under a dark, slightly rough skin reads as polished stage paint.
  // 床：鏡面の上に暗くやや粗い層を重ね、磨いたステージ床に見せる。
  const floorSize = 40;
  let reflector: Reflector | null = null;
  if (!compact) {
    reflector = new Reflector(new THREE.PlaneGeometry(floorSize, floorSize), {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0x3a3a3a,
    });
    reflector.rotation.x = -Math.PI / 2;
    scene.add(reflector);
  }
  const floorSkin = new THREE.Mesh(
    new THREE.PlaneGeometry(floorSize, floorSize),
    new THREE.MeshStandardMaterial({
      color: 0x060607,
      roughness: 0.42,
      metalness: 0.1,
      transparent: Boolean(reflector),
      opacity: reflector ? 0.9 : 1,
    }),
  );
  floorSkin.rotation.x = -Math.PI / 2;
  floorSkin.position.y = 0.002;
  floorSkin.receiveShadow = true;
  scene.add(floorSkin);

  const amp = createAmpersand();
  scene.add(amp);

  // Key light from the front of house so the letterform always reads.
  // 客席側からのキーライト。文字の形が常に読めるように。
  const key = new THREE.SpotLight(0xfff4ea, 22, 16, 0.42, 0.7, 1.4);
  key.position.set(2.2, 3.6, 5.2);
  key.target.position.copy(LOOK_AT);
  key.castShadow = true;
  key.shadow.mapSize.set(compact ? 512 : 1024, compact ? 512 : 1024);
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight(0x4a4a55, 0x050505, 0.35));

  const beams = [-3, 0, 3].map((x, i) => createBeam(new THREE.Vector3(x, 4.8, -2.4 + Math.abs(x) * 0.2), i * 2.1));
  for (const beam of beams) scene.add(beam.mesh, beam.light, beam.light.target);

  const haze = createHaze(compact ? 420 : 1100);
  scene.add(haze);
  const wall = createLedWall();
  scene.add(wall);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.55, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const windows = Array.from(document.querySelectorAll<HTMLElement>("[data-stage-window]"));
  const live = toLive(cueFor(null));
  let target = toLive(cueFor(null));
  const pointer = new THREE.Vector2();
  const pointerSmoothed = new THREE.Vector2();
  const clock = new THREE.Clock();
  let time = Math.random() * 40;
  let frame = 0;
  let size = "";
  let framingEl: HTMLElement | null = null;
  let framingFrom: Framing | null = null;
  let framingBlend = 1;
  let lastKey = "";

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const next = `${width}x${height}@${dpr}`;
    if (next === size || width < 2 || height < 2) return;
    size = next;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
    bloom.resolution.set(width / 2, height / 2);
    reflector?.getRenderTarget().setSize(Math.round(width * dpr * 0.5), Math.round(height * dpr * 0.5));
    camera.aspect = width / height;
    haze.material.uniforms.uPixelRatio.value = dpr;
    lastKey = "";
  };

  const easeCue = (k: number) => {
    live.beam.lerp(target.beam, k);
    live.wall.lerp(target.wall, k);
    live.azimuth += (target.azimuth - live.azimuth) * k;
    live.elevation += (target.elevation - live.elevation) * k;
    live.sweep += (target.sweep - live.sweep) * k;
  };

  const placeCamera = (framing: Framing, width: number, height: number) => {
    const azimuth = live.azimuth + pointerSmoothed.x * 0.14;
    const elevation = 1.15 + live.elevation - pointerSmoothed.y * 0.18;
    camera.position.set(Math.sin(azimuth) * CAMERA_DISTANCE, elevation, Math.cos(azimuth) * CAMERA_DISTANCE);
    camera.lookAt(LOOK_AT);
    camera.zoom = framing.zoom;
    camera.setViewOffset(width, height, width / 2 - framing.cx, height / 2 - framing.cy, width, height);
    camera.updateProjectionMatrix();
  };

  const animateProps = () => {
    for (const beam of beams) {
      const swing = time * live.sweep + beam.phase;
      const aim = new THREE.Vector3(Math.sin(swing) * 1.7, 0, Math.cos(swing * 0.7) * 1.1 + 0.4);
      beam.mesh.lookAt(aim);
      beam.light.target.position.copy(aim);
      beam.light.color.copy(live.beam);
      beam.mesh.material.uniforms.uColor.value.copy(live.beam);
      beam.mesh.material.uniforms.uTime.value = time;
    }
    haze.material.uniforms.uTime.value = time;
    haze.material.uniforms.uColor.value.copy(live.beam);
    wall.material.uniforms.uTime.value = time;
    wall.material.uniforms.uColor.value.copy(live.wall);
    amp.rotation.y = Math.sin(time * 0.22) * 0.32 + pointerSmoothed.x * 0.25;
  };

  const tick = () => {
    frame = requestAnimationFrame(tick);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const shown = visibleRects(windows, width, height);
    if (shown.length === 0) {
      canvas.style.visibility = "hidden";
      return;
    }
    canvas.style.visibility = "visible";
    canvas.style.clipPath = `path('${shown
      .map(({ clip: c }) => `M${c.left} ${c.top}H${c.right}V${c.bottom}H${c.left}Z`)
      .join("")}')`;

    const dt = Math.min(clock.getDelta(), 0.05);
    const still = reduceMotion.matches;
    if (!still) time += dt;

    const main = shown.reduce((a, b) => (b.area > a.area ? b : a));
    const aim = framingFor(main.rect, width, height);
    if (main.el !== framingEl) {
      framingFrom = framingEl ? framingFor(framingEl.getBoundingClientRect(), width, height) : null;
      framingEl = main.el;
      framingBlend = framingFrom && !still ? 0 : 1;
    }
    framingBlend = Math.min(1, framingBlend + dt / FRAMING_BLEND_SECONDS);
    const e = 1 - Math.pow(1 - framingBlend, 3);
    const framing =
      framingFrom && e < 1
        ? {
            cx: THREE.MathUtils.lerp(framingFrom.cx, aim.cx, e),
            cy: THREE.MathUtils.lerp(framingFrom.cy, aim.cy, e),
            zoom: THREE.MathUtils.lerp(framingFrom.zoom, aim.zoom, e),
          }
        : aim;

    const k = still ? 1 : 1 - Math.exp(-dt * 3);
    easeCue(k);
    pointerSmoothed.lerp(still ? new THREE.Vector2() : pointer, 1 - Math.exp(-dt * 4));

    // Reduced motion: draw only when something on screen actually changed.
    // 動きを減らす設定：画面に変化があったときだけ描く。
    const key = `${framing.cx | 0},${framing.cy | 0},${framing.zoom.toFixed(3)},${live.beam.getHexString()}`;
    if (still && key === lastKey) return;
    lastKey = key;

    placeCamera(framing, width, height);
    animateProps();
    composer.render(dt);
  };

  const start = () => {
    cancelAnimationFrame(frame);
    clock.getDelta();
    if (document.visibilityState === "visible") frame = requestAnimationFrame(tick);
  };

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
  };
  const onCue = (event: Event) => {
    target = toLive(cueFor((event as CustomEvent<string | null>).detail));
    lastKey = "";
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    delete root.dataset.stage;
  };
  const onRestored = () => {
    root.dataset.stage = "live";
    size = "";
    resize();
    start();
  };
  const onMotionChange = () => {
    lastKey = "";
    start();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();
  root.dataset.stage = "live";
  start();

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("destination:hover", onCue);
  document.addEventListener("visibilitychange", start);
  reduceMotion.addEventListener("change", onMotionChange);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("destination:hover", onCue);
    document.removeEventListener("visibilitychange", start);
    reduceMotion.removeEventListener("change", onMotionChange);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    composer.dispose();
    pmrem.dispose();
    renderer.dispose();
    delete root.dataset.stage;
  };
}
