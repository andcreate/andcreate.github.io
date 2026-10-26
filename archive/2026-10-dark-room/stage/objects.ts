import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { AMPERSAND_CENTER, AMPERSAND_PATH } from "../../data/ampersand";

/**
 * Stage props: the extruded "&", volumetric beams, haze and the LED back wall.
 * ステージの小道具：押し出した「&」、ボリューメトリックなビーム、ヘイズ、背面 LED。
 */

/** World-space size of the "&" (height). / 「&」のワールド空間での高さ */
export const AMP_HEIGHT = 1.6;
/** Glyph is 95 x 78 units; keep the same aspect. / グリフは 95 x 78 ユニット、比率を保つ */
export const AMP_WIDTH = AMP_HEIGHT * (95.1 / 78.4);

export function createAmpersand(): THREE.Group {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${AMPERSAND_PATH}"/></svg>`;
  const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => p.toShapes(true));
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 16,
    bevelEnabled: true,
    bevelThickness: 2.4,
    bevelSize: 1.3,
    bevelSegments: 6,
    curveSegments: 18,
  });
  geometry.translate(-AMPERSAND_CENTER.x, -AMPERSAND_CENTER.y, -8);

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x1b1b1e,
    metalness: 1,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.55,
  });

  const mesh = new THREE.Mesh(geometry, material);
  // SVG is y-down: a negative y scale flips it upright; three.js corrects the winding for us.
  // SVG は y 下向きなので y を負スケールで反転（面の向きは three.js が補正する）。
  const s = AMP_HEIGHT / 78.4;
  mesh.scale.set(s, -s, s);
  mesh.castShadow = true;

  const group = new THREE.Group();
  group.add(mesh);
  group.position.y = AMP_HEIGHT / 2 + 0.06;
  return group;
}

const NOISE_GLSL = /* glsl */ `
  float hash(vec3 p) { return fract(sin(dot(p, vec3(17.1, 113.3, 71.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
`;

export interface Beam {
  mesh: THREE.Mesh<THREE.CylinderGeometry, THREE.ShaderMaterial>;
  light: THREE.SpotLight;
  /** Swing phase so heads never move in lockstep. / ヘッドごとの位相差 */
  phase: number;
}

/** A moving head: a real SpotLight plus a fake volumetric cone. / 実 SpotLight と疑似ボリュームの円錐 */
export function createBeam(origin: THREE.Vector3, phase: number, length = 9): Beam {
  const geometry = new THREE.CylinderGeometry(0.04, 1.15, length, 48, 1, true);
  geometry.translate(0, -length / 2, 0);
  geometry.rotateX(-Math.PI / 2); // apex at origin, cone along +Z / 頂点を原点に、+Z 方向へ

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color("#ffffff") },
      uTime: { value: 0 },
      uLength: { value: length },
      uIntensity: { value: 0.55 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal; varying vec3 vView; varying float vT; varying vec3 vWorld;
      uniform float uLength;
      void main() {
        vT = position.z / uLength;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vec4 view = viewMatrix * world;
        vView = -view.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal; varying vec3 vView; varying float vT; varying vec3 vWorld;
      uniform vec3 uColor; uniform float uTime; uniform float uIntensity;
      ${NOISE_GLSL}
      void main() {
        // Facing ratio: bright through the core, soft at the silhouette.
        // 視線との角度：芯は明るく、輪郭はやわらかく。
        float facing = pow(abs(dot(normalize(vNormal), normalize(vView))), 2.2);
        float falloff = pow(1.0 - clamp(vT, 0.0, 1.0), 1.6) * smoothstep(0.0, 0.06, vT);
        float haze = 0.55 + 0.45 * noise(vWorld * 1.6 + vec3(0.0, -uTime * 0.35, uTime * 0.2));
        gl_FragColor = vec4(uColor * facing * falloff * haze * uIntensity, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(origin);

  const light = new THREE.SpotLight(0xffffff, 30, 14, 0.2, 0.55, 1.6);
  light.position.copy(origin);
  return { mesh, light, phase };
}

/** Dust in the haze, drifting slowly. / ヘイズ中の塵（ゆっくり漂う） */
export function createHaze(count: number): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 1] = Math.random() * 4.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 0.5;
    seeds[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uColor: { value: new THREE.Color("#ffffff") } },
    vertexShader: /* glsl */ `
      attribute float aSeed; uniform float uTime; uniform float uPixelRatio; varying float vAlpha;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.04 + aSeed * 0.05), 4.5);
        p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.15;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = (1.0 + aSeed * 2.0) * uPixelRatio * (6.0 / -view.z);
        vAlpha = 0.18 + 0.5 * aSeed;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vAlpha);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

/** LED back wall: a dim dot matrix with a slow scan, the way stage walls idle between songs. */
/** 背面 LED：曲間のステージのように、暗いドットマトリクスがゆっくり走査する。 */
export function createLedWall(): THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#b11226") } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; uniform float uTime; uniform vec3 uColor;
      ${NOISE_GLSL}
      void main() {
        vec2 grid = vUv * vec2(160.0, 64.0);
        vec2 cell = floor(grid);
        float dotMask = smoothstep(0.42, 0.18, length(fract(grid) - 0.5));
        float scan = 0.5 + 0.5 * sin(cell.x * 0.11 - uTime * 0.9 + sin(cell.y * 0.17 + uTime * 0.3) * 2.0);
        float flicker = noise(vec3(cell * 0.18, uTime * 0.5));
        float level = pow(scan, 3.0) * 0.75 + flicker * 0.25;
        float vignette = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        gl_FragColor = vec4(uColor * dotMask * level * vignette * 0.55, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(18, 7.2), material);
  mesh.position.set(0, 3.2, -5.5);
  return mesh;
}
