/**
 * GLSL for the two point layers: the "&" cloud and the wave floor beneath it.
 * 2 つの点群レイヤーの GLSL：「&」の雲と、その下で波打つ床。
 */

const SOFT_POINT = /* glsl */ `
  float softPoint() {
    float d = length(gl_PointCoord - 0.5);
    return smoothstep(0.5, 0.05, d);
  }
`;

export const AMP_VERTEX = /* glsl */ `
  attribute vec3 aScatter;
  attribute vec3 aWeb;
  attribute vec3 aVirtual;
  attribute vec3 aBooth;
  attribute vec3 aDocs;
  attribute float aSeed;

  uniform float uTime;
  uniform float uForm;
  uniform vec4 uMorph;
  uniform vec3 uPointer;
  uniform float uPointerOn;
  uniform float uSize;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying float vAccent;

  float easeOut(float t) { return 1.0 - pow(1.0 - t, 3.0); }

  void main() {
    // Rise out of the floor into the "&", each particle a little late.
    // 床から「&」へ立ち上がる。粒ごとに少しずつ遅れて。
    float delay = aSeed * 0.4;
    float f = easeOut(clamp((uForm - delay) / 0.6, 0.0, 1.0));
    vec3 p = mix(aScatter, position, f);
    p.y += sin(f * 3.14159) * (0.4 + aSeed * 0.8);

    // Morph toward a destination's shape, staggered by seed so it reads as a flock, not a tween.
    // 行き先の形へ変形。seed でずらし、トゥイーンではなく群れの動きに見せる。
    float w = uMorph.x + uMorph.y + uMorph.z + uMorph.w;
    if (w > 0.0001) {
      vec3 target = (aWeb * uMorph.x + aVirtual * uMorph.y + aBooth * uMorph.z + aDocs * uMorph.w) / w;
      float m = smoothstep(0.0, 1.0, clamp(w * 1.4 - aSeed * 0.4, 0.0, 1.0));
      p = mix(p, target, m);
    }

    p += 0.03 * vec3(
      sin(uTime * 0.7 + aSeed * 31.0),
      cos(uTime * 0.6 + aSeed * 17.0),
      sin(uTime * 0.5 + aSeed * 11.0)
    );

    // The pointer parts the cloud. / ポインターが雲をかき分ける。
    vec2 d = p.xy - uPointer.xy;
    float r2 = dot(d, d);
    p.xy += normalize(d + 1e-5) * 0.5 * exp(-r2 * 2.2) * uPointerOn;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.55 + aSeed * 0.9) * uPixelRatio / -mv.z;
    vAlpha = (0.22 + 0.5 * aSeed) * f;
    vAccent = step(0.94, fract(aSeed * 7.13));
  }
`;

export const AMP_FRAGMENT = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  varying float vAlpha;
  varying float vAccent;
  ${SOFT_POINT}
  void main() {
    gl_FragColor = vec4(mix(uInk, uAccent, vAccent), softPoint() * vAlpha);
    #include <colorspace_fragment>
  }
`;

export const FLOOR_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerOn;
  uniform float uEnergy;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vCrest;

  void main() {
    vec3 p = position;
    float wave = 0.16 * sin(p.x * 0.42 + uTime * 0.7)
               + 0.12 * sin(p.z * 0.55 - uTime * 0.55 + p.x * 0.18)
               + 0.05 * sin((p.x + p.z) * 1.3 + uTime * 1.6) * (0.4 + uEnergy);
    // Rings spreading from under the pointer. / ポインターの下から広がる波紋
    float dist = length(p.xz - uPointer);
    wave += 0.22 * sin(dist * 2.4 - uTime * 3.2) * exp(-dist * 0.45) * uPointerOn;
    p.y += wave * (1.0 + uEnergy * 0.8);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 3.2 * uPixelRatio * (8.0 / -mv.z);
    vCrest = smoothstep(0.0, 0.35, wave);
    float edgeFade = smoothstep(14.0, 8.0, abs(p.x)) * smoothstep(-14.0, -6.0, p.z) * smoothstep(6.5, 3.0, p.z);
    vAlpha = edgeFade * (0.55 + 0.8 * vCrest);
  }
`;

export const FLOOR_FRAGMENT = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform float uEnergy;
  varying float vAlpha;
  varying float vCrest;
  ${SOFT_POINT}
  void main() {
    vec3 color = mix(uInk, uAccent, vCrest * uEnergy * 0.8);
    gl_FragColor = vec4(color, softPoint() * vAlpha);
    #include <colorspace_fragment>
  }
`;
