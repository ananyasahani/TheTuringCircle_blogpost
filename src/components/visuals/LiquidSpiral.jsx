"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * LiquidSpiral
 *
 * A WebGL distortion field that treats an image as molten liquid glass.
 * Two modes:
 *   - "vortex" : gravitational swirl toward a dark core (the black-hole look)
 *   - "flow"   : slow rotation + fluid domain-warp + iridescent dispersion,
 *                for the clear glass-ribbon / Apple liquid-glass aesthetic
 *
 * Both modes carry a pointer-driven lens bump so the glass catches light.
 */

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uTex;
  uniform float uTime;
  uniform vec2 uResolution;   // canvas size in px
  uniform vec2 uImageSize;    // texture native size in px
  uniform vec2 uPointer;      // smoothed pointer, -1..1
  uniform float uHover;       // 0..1 pointer presence
  uniform float uReduce;      // 1.0 when prefers-reduced-motion
  uniform float uMode;        // 0.0 vortex, 1.0 flow
  uniform float uIridescence; // 0..1 rainbow dispersion amount

  // -- value noise + fbm ----------------------------------------------------
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }

  // cover-fit uv so the image fills the canvas without stretching
  vec2 coverUv(vec2 uv, vec2 res, vec2 img) {
    float canvasAspect = res.x / res.y;
    float imgAspect = img.x / img.y;
    vec2 scale = canvasAspect > imgAspect
      ? vec2(1.0, imgAspect / canvasAspect)
      : vec2(canvasAspect / imgAspect, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c) * v;
  }

  // iridescent tint from a scalar phase — oil-slick blues/violets/cyans
  vec3 iris(float phase) {
    return 0.5 + 0.5 * cos(6.2831853 * (phase + vec3(0.0, 0.33, 0.66)) + vec3(0.9, 0.2, 0.55));
  }

  void main() {
    float t = uTime * (uReduce > 0.5 ? 0.18 : 1.0);

    vec2 res = uResolution;
    vec2 p = vUv - 0.5;
    p.x *= res.x / res.y;

    float r = length(p);
    float ang = atan(p.y, p.x);

    vec2 warpedUv;
    float pull = 0.0;   // lensing strength, used later for CA
    float lens = 0.0;

    // pointer lens shared by both modes
    vec2 ptr = uPointer;
    ptr.x *= res.x / res.y;
    float pd = length(p - ptr * 0.5);
    lens = exp(-pd * pd * 6.0) * uHover;

    if (uMode < 0.5) {
      // =========================== VORTEX ===============================
      pull = clamp(0.16 / (r * r + 0.05), 0.0, 2.2);
      float swirl = (0.9 / (r + 0.16)) * 0.6;
      float spin = t * 0.22;
      float twist = ang + swirl - spin - pull * 0.35;
      float rr = r * (1.0 - pull * 0.03);
      vec2 swirled = vec2(cos(twist), sin(twist)) * rr;

      float warpAmt = 0.11;
      vec2 q = vec2(
        fbm(swirled * 2.3 + vec2(0.0, t * 0.25)),
        fbm(swirled * 2.3 + vec2(5.2, -t * 0.2))
      );
      vec2 rq = vec2(
        fbm(swirled * 3.1 + q * 1.7 + vec2(1.7, 9.2) + t * 0.15),
        fbm(swirled * 3.1 + q * 1.7 + vec2(8.3, 2.8) - t * 0.13)
      );
      swirled += (q * 0.6 + rq * 0.4) * warpAmt;
      swirled += normalize(p - ptr * 0.5 + 1e-4) * lens * -0.06;

      warpedUv = swirled;
      warpedUv.x /= res.x / res.y;
      warpedUv += 0.5;
    } else {
      // ============================ FLOW ================================
      // slow rotation of the whole field — molten glass turning
      float rot = t * 0.035 + sin(t * 0.08) * 0.05;
      vec2 fp = rotate(p, rot);

      // fluid domain-warp: two octaves of fbm advected in time
      float warpAmt = 0.14;
      vec2 q = vec2(
        fbm(fp * 1.7 + vec2(0.0, t * 0.12)),
        fbm(fp * 1.7 + vec2(4.4, -t * 0.1))
      );
      vec2 rq = vec2(
        fbm(fp * 2.4 + q * 1.6 + vec2(2.1, 7.3) + t * 0.09),
        fbm(fp * 2.4 + q * 1.6 + vec2(6.7, 1.2) - t * 0.08)
      );
      fp += (q * 0.65 + rq * 0.45) * warpAmt;

      // breathing scale so the glass gently swells
      fp *= 1.0 + sin(t * 0.15) * 0.02;

      // pointer lens push
      fp += normalize(p - ptr * 0.5 + 1e-4) * lens * -0.05;

      // pull term reused for CA magnitude in flow: use warp energy
      pull = length(q) * 0.6;

      warpedUv = fp;
      warpedUv.x /= res.x / res.y;
      warpedUv += 0.5;
    }

    vec2 uv = coverUv(warpedUv, res, uImageSize);

    // ---- chromatic dispersion (glass refraction) -------------------------
    vec2 dir = normalize(p + 1e-4);
    float ca = 0.0009 + pull * 0.0012 + lens * 0.004;
    float rC = texture2D(uTex, uv - dir * ca).r;
    float gC = texture2D(uTex, uv).g;
    float bC = texture2D(uTex, uv + dir * ca).b;
    vec3 col = vec3(rC, gC, bC);

    float lum = dot(col, vec3(0.299, 0.587, 0.114));

    // ---- iridescence: oil-slick sheen driven by warp + luminance ---------
    if (uIridescence > 0.001) {
      float phase = pull * 1.6 + lum * 0.8 + t * 0.03 + r * 0.5;
      vec3 sheen = iris(phase);
      // apply the sheen where the glass is bright/refractive
      float mask = smoothstep(0.12, 0.75, lum);
      col = mix(col, col * (0.7 + sheen * 0.9), uIridescence * mask);
      col += sheen * mask * uIridescence * 0.12;
    }

    // gentle bloom on the brightest glass
    float bloom = smoothstep(0.72, 1.0, lum);
    col += bloom * vec3(0.12, 0.16, 0.26) * (0.7 + 0.3 * sin(t * 0.6));

    // pointer highlight — the glass catches light
    col += lens * vec3(0.07, 0.09, 0.15);

    // ---- depth grade -----------------------------------------------------
    float vig = smoothstep(1.25, 0.3, r);
    col *= 0.45 + 0.55 * vig;
    if (uMode < 0.5) {
      // event-horizon darkening at the very centre for the vortex
      col *= smoothstep(0.02, 0.16, r) * 0.5 + 0.5;
    }

    // filmic-ish soft clip
    col = col / (col + vec3(0.7)) * 1.7;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function LiquidSpiral({
  src = "/editorial/spiral.jpg",
  mode = "vortex",
  iridescence = 0.0,
  // Render-cost controls. "ambient" caps DPR + frame rate for cheap
  // background use (e.g. behind blog posts); "hero" runs full quality.
  quality = "hero",
  // When true, skip WebGL entirely and render the static image (Lite mode).
  lite = false,
}) {
  const canvasRef = useRef(null);
  // Falls back to the static image if WebGL can't start (e.g. Brave Shields).
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (lite) return; // Lite mode renders the <img> below — no WebGL work.
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ambient = quality === "ambient";
    // Ambient backdrops render cheap: half the pixels, capped frame rate, and
    // paused entirely when scrolled off-screen or the tab is hidden.
    const maxDpr = ambient ? 1 : 2;
    const targetFps = ambient ? 30 : 60;
    const frameInterval = 1 / targetFps;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !ambient,
        powerPreference: ambient ? "low-power" : "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      // WebGL blocked/unavailable — show the static image instead.
      setFailed(true);
      return;
    }
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTex: { value: null },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uImageSize: { value: new THREE.Vector2(2400, 1600) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uHover: { value: 0 },
      uReduce: { value: reduceMotion ? 1 : 0 },
      uMode: { value: mode === "flow" ? 1 : 0 },
      uIridescence: { value: iridescence },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const loader = new THREE.TextureLoader();
    loader.load(src, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      uniforms.uTex.value = texture;
      uniforms.uImageSize.value.set(texture.image.width, texture.image.height);
    });

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let hoverTarget = 0;
    let frameId;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    };

    const onPointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointerTarget.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointerTarget.y =
        -((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      hoverTarget = 1;
    };
    const onPointerLeave = () => {
      hoverTarget = 0;
    };

    // pause when off-screen (scrolled past) or the tab is hidden — the GPU
    // does no work while the backdrop can't be seen
    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const isRunnable = () => onScreen && !document.hidden;

    const clock = new THREE.Clock();
    let accumulator = 0;
    const render = () => {
      frameId = window.requestAnimationFrame(render);
      const delta = clock.getDelta();

      if (!isRunnable()) return; // skip work while invisible

      // frame-rate cap: only draw once enough time has accrued
      accumulator += delta;
      if (accumulator < frameInterval) return;
      accumulator = 0;

      uniforms.uTime.value = clock.getElapsedTime();
      pointer.lerp(pointerTarget, 0.06);
      uniforms.uPointer.value.copy(pointer);
      uniforms.uHover.value += (hoverTarget - uniforms.uHover.value) * 0.05;
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    if (reduceMotion) {
      // Honour reduced-motion: draw a single still frame and stop. No loop,
      // no pointer tracking, zero ongoing GPU cost.
      uniforms.uTime.value = 0;
      renderer.render(scene, camera);
      return () => {
        resizeObserver.disconnect();
        io.disconnect();
        uniforms.uTex.value?.dispose();
        material.dispose();
        quad.geometry.dispose();
        renderer.dispose();
      };
    }

    // Pointer interaction only on devices that actually hover (not touch). This
    // removes the mobile glitch where scroll-touch drove the shader.
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (canHover) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerleave", onPointerLeave);
    }
    render();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      uniforms.uTex.value?.dispose();
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
    };
  }, [src, mode, iridescence, quality, lite]);

  // Lite mode or a WebGL failure → render the static image instead of a canvas.
  if (lite || failed) {
    return (
      <img
        src={src}
        alt=""
        className="liquid-spiral liquid-spiral-static"
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="liquid-spiral"
      aria-label="Liquid glass ribbon flowing and refracting on a dark field"
      role="img"
    />
  );
}
