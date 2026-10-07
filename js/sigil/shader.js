/**
 * The scene, in one fragment shader.
 *
 * A stone floor under fog. The sigil is laid into the floor and lit from
 * within. The fog is marched from the eye: its density is noise that drifts
 * slowly, thickest at the floor, and it takes the ember's colour where the
 * sigil stands closest to it. The air and the floor share one pass, so there
 * is a single draw call per frame and nothing to composite.
 */

export const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uIgnite;   // 0..1, how far the sigil has been lit
uniform float uHover;    // order of the glyph under the pointer, or -1
uniform sampler2D uSigil;

const float HALF  = 1.25;                       // world half-width the texture covers
const vec3  EMBER = vec3(1.00, 0.16, 0.20);
const vec3  HOT   = vec3(1.00, 0.56, 0.40);
const vec3  STEEL = vec3(0.42, 0.46, 0.58);

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(11.7, 5.3);
    a *= 0.5;
  }
  return v;
}

/* fog density in the air at q: thick near the floor, thinning with height */
float density(vec3 q, float t) {
  float h = max(q.y, 0.0);
  float n = fbm(q.xz * 0.6 + vec2(t * 0.045, -t * 0.03) + q.y * 0.3);
  return smoothstep(0.44, 0.9, n) * exp(-h * 1.3) * 0.62;
}

/* the light the fog takes from the sigil at q */
vec3 fogColour(vec3 q, float reveal) {
  float r = length(q.xz);
  float glow = exp(-r * 1.5) * exp(-max(q.y, 0.0) * 1.1) * (0.35 + 0.65 * reveal);
  return mix(STEEL * 0.07, EMBER * 0.42, clamp(glow * 1.8, 0.0, 1.0));
}

/* a few texture taps in a ring, for the soft light the glyphs throw */
float glowAt(vec2 xz) {
  vec2 uv = xz / (2.0 * HALF) + 0.5;
  float px = 1.0 / 1024.0;
  float g = 0.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7853981;
    vec2 o = vec2(cos(a), sin(a));
    g += texture2D(uSigil, uv + o * px * 10.0).a;
    g += texture2D(uSigil, uv + o * px * 26.0).a * 0.5;
  }
  return g / 12.0;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag / uRes) * 2.0 - 1.0;
  p.x *= uRes.x / uRes.y;
  float t = uTime;

  // the camera drifts: a slow dolly and a sway, so the scene is never still
  vec3 eye = vec3(0.10 * sin(t * 0.09), 2.05 + 0.06 * sin(t * 0.13), 2.7 + 0.12 * sin(t * 0.07));
  vec3 target = vec3(0.0, 0.0, -0.25);
  vec3 fwd = normalize(target - eye);
  vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, fwd);
  // the zoom follows the shape of the window, so the ring keeps the same
  // share of the width on a phone as on a wide screen, and never runs off it
  float aspect = uRes.x / uRes.y;
  float zoom = min(2.25, 2.5 * aspect);
  vec3 rd = normalize(fwd * zoom + right * p.x + up * p.y);

  // the floor is the plane y = 0
  float hitT = rd.y < 0.0 ? -eye.y / rd.y : -1.0;
  bool onFloor = hitT > 0.0;
  float tEnd = onFloor ? hitT : 16.0;

  // march the fog from the eye to the floor, or out to the horizon
  float reveal = clamp(uIgnite, 0.0, 1.0);
  float jitter = hash12(frag + fract(t) * 17.0);
  const int STEPS = 14;
  float dt = tEnd / float(STEPS);
  vec3 acc = vec3(0.0);
  float T = 1.0;
  for (int i = 0; i < STEPS; i++) {
    float s = (float(i) + jitter) * dt;
    vec3 q = eye + rd * s;
    float d = density(q, t);
    if (d > 0.002) {
      float sT = exp(-d * dt * 2.2);
      acc += T * (1.0 - sT) * fogColour(q, reveal);
      T *= sT;
    }
  }

  vec3 col;
  if (onFloor) {
    vec3 hp = eye + rd * hitT;
    vec2 xz = hp.xz;

    // the stone: nearly black, with a faint grain
    vec3 stone = vec3(0.016, 0.014, 0.020) + 0.018 * fbm(xz * 2.4);

    // the sigil. A glyph's order decides when it lights; its red channel holds that order
    vec2 suv = xz / (2.0 * HALF) + 0.5;
    vec4 s = vec4(0.0);
    if (suv.x >= 0.0 && suv.y >= 0.0 && suv.x <= 1.0 && suv.y <= 1.0) {
      s = texture2D(uSigil, suv);
    }
    float o = s.r;
    float rv = smoothstep(o, o + 0.05, reveal * 1.12 - 0.02);
    float line = s.a * rv;

    float hov = (uHover >= 0.0 && abs(o - uHover) < 0.006) ? 1.0 : 0.0;
    float breath = 0.9 + 0.1 * sin(t * 0.9);
    float halo = glowAt(xz) * rv * breath;

    float pulse = 0.8 + 0.2 * sin(t * 5.0);
    vec3 lit = EMBER * line * (1.25 + 1.6 * hov * pulse) * breath;
    lit += HOT * line * line * 0.6;
    lit += EMBER * halo * 0.16;
    lit += EMBER * line * hov * 0.6 * pulse;
    lit += EMBER * halo * hov * 0.5;

    float pool = exp(-length(xz) * 1.7) * (0.25 + 0.75 * reveal);
    col = (stone + lit + EMBER * pool * 0.1) * T;
  } else {
    col = mix(vec3(0.012, 0.012, 0.018), vec3(0.03, 0.03, 0.045), clamp(rd.y * 3.0, 0.0, 1.0)) * T;
  }
  col += acc;

  // vignette, a soft tone curve, and dither against banding in the dark
  vec2 vq = (frag / uRes) * 2.0 - 1.0;
  float vig = smoothstep(1.6, 0.35, length(vq * vec2(0.85, 1.0)));
  col *= mix(0.35, 1.0, vig);
  col = 1.0 - exp(-col * 1.35);
  col = pow(col, vec3(0.95));
  col += (hash12(frag + 0.5) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;
