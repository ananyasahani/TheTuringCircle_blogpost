"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HelixDrop — a small Helix-Jump-style game for the blog side gutter.
 *
 * A stack of rotating rings; the ball bounces on the FRONT rim of the top ring.
 * Spin the tower (drag or ←/→) to line a gap up under the ball so it drops to
 * the next ring. Solid = bounce, gap = drop (score +1), trap (red) = game over.
 * Desktop-only, pauses when off-screen.
 *
 * Geometry note: rings are ellipses drawn as
 *   point(θ) = (cx + r·cosθ, cy + r·squash·sinθ)
 * so θ = +π/2 is the bottom-centre = the FRONT rim the ball rests on. The
 * "active" segment (under the ball) is the one whose arc covers θ = π/2.
 */

const SEGMENTS = 12;
const W = 300;
const H = 460;
const R = 88;
const SQUASH = 0.42;
const RIM = R * SQUASH; // vertical offset of front rim from ring centre
const TOP_Y = 128; // screen-y of the top (active) ring's centre
const RING_GAP = 66;
const BALL_R = 9;
const GRAVITY = 0.4;
const BOUNCE = -7.2;
const STEP = (Math.PI * 2) / SEGMENTS;

function makeRing(depth) {
  const cells = new Array(SEGMENTS).fill("solid");
  const gapCount = Math.max(1, 3 - Math.floor(depth / 6));
  for (let k = 0; k < gapCount; k++) {
    cells[(depth * 7 + k * 5 + 3) % SEGMENTS] = "gap";
  }
  const trapCount = Math.min(4, Math.floor(depth / 3));
  let placed = 0;
  let i = (depth * 5 + 1) % SEGMENTS;
  let guard = 0;
  while (placed < trapCount && guard < SEGMENTS * 2) {
    if (cells[i] === "solid") {
      cells[i] = "trap";
      placed += 1;
    }
    i = (i + 5) % SEGMENTS;
    guard += 1;
  }
  return cells;
}

export default function HelixDrop() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | playing | over
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const cx = W / 2;

    const s = {
      depth: 0,
      rotation: 0,
      rotVel: 0,
      ballY: TOP_Y - 40,
      vy: 0,
      rings: [],
      running: false,
      dead: false,
      shake: 0,
    };
    stateRef.current = s;

    const reset = () => {
      s.depth = 0;
      s.rotation = 0.3;
      s.rotVel = 0;
      s.ballY = TOP_Y - 40;
      s.vy = 0;
      s.rings = Array.from({ length: 48 }, (_, d) => makeRing(d));
      s.dead = false;
      s.shake = 0;
      setScore(0);
    };
    reset();

    // Segment index whose arc covers θ = π/2 (the front rim, under the ball).
    const activeIndex = () => {
      const raw = Math.floor((Math.PI / 2 - s.rotation) / STEP);
      return ((raw % SEGMENTS) + SEGMENTS) % SEGMENTS;
    };

    // ── input ──────────────────────────────────────────────────────────
    let dragging = false;
    let lastX = 0;
    const onDown = (e) => {
      dragging = true;
      lastX = e.clientX;
      canvas.focus();
    };
    const onMove = (e) => {
      if (!dragging) return;
      s.rotation += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    };
    const onUp = () => {
      dragging = false;
    };
    const onKey = (e) => {
      if (!s.running || s.dead) return;
      if (e.key === "ArrowLeft" || e.key === "a") {
        s.rotation -= 0.28;
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "d") {
        s.rotation += 0.28;
        e.preventDefault();
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    // key handling on window so focus isn't required, but only act while playing
    window.addEventListener("keydown", onKey);

    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => (onScreen = entries[0]?.isIntersecting ?? true),
      { threshold: 0 },
    );
    io.observe(canvas);

    const frontRimY = TOP_Y + RIM; // where the ball rests on the top ring

    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!onScreen) return;

      if (s.running && !s.dead) {
        s.vy += GRAVITY;
        s.ballY += s.vy;

        if (s.ballY >= frontRimY - BALL_R && s.vy > 0) {
          const cell = s.rings[s.depth]?.[activeIndex()] ?? "solid";
          if (cell === "gap") {
            // drop through: tower shifts up one level
            s.depth += 1;
            s.ballY = TOP_Y - 30;
            s.vy = 2;
            setScore(s.depth);
            setBest((b) => Math.max(b, s.depth));
            if (s.rings.length - s.depth < 14) {
              const start = s.rings.length;
              for (let k = 0; k < 14; k++) s.rings.push(makeRing(start + k));
            }
          } else if (cell === "trap") {
            s.dead = true;
            s.shake = 14;
            setStatus("over");
          } else {
            s.ballY = frontRimY - BALL_R;
            s.vy = BOUNCE;
          }
        }
      }

      // ── render ─────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      const sx = s.shake > 0 ? (Math.random() - 0.5) * s.shake : 0;
      if (s.shake > 0) s.shake *= 0.86;
      ctx.save();
      ctx.translate(sx, 0);

      const active = activeIndex();
      for (let d = 5; d >= 0; d--) {
        const ring = s.rings[s.depth + d];
        if (!ring) continue;
        const y = TOP_Y + d * RING_GAP;
        const fade = 1 - d * 0.14;
        drawRing(ctx, ring, cx, y, s.rotation, fade, d === 0 ? active : -1);
      }

      // ball
      ctx.beginPath();
      ctx.arc(cx, Math.min(s.ballY, frontRimY - BALL_R + 2), BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = "#d4af37";
      ctx.shadowColor = "rgba(212,175,55,0.6)";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    };
    loop();

    s._reset = reset;

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const start = () => {
    const s = stateRef.current;
    if (!s) return;
    s._reset();
    s.running = true;
    setStatus("playing");
    canvasRef.current?.focus();
  };

  return (
    <div className="helix-drop">
      <div className="helix-head">
        <span className="helix-title">Helix Drop</span>
        <span className="helix-score">
          {score} <i>/ best {best}</i>
        </span>
      </div>
      <div className="helix-stage">
        <canvas
          ref={canvasRef}
          className="helix-canvas"
          style={{ width: W, height: H }}
          tabIndex={0}
          aria-label="Helix Drop mini game"
        />
        {status !== "playing" && (
          <div className="helix-overlay">
            <p>
              {status === "over"
                ? `You reached depth ${score}.`
                : "A little game."}
            </p>
            <button type="button" onClick={start}>
              {status === "over" ? "Again" : "Play"}
            </button>
            <span className="helix-hint">drag or ← → to spin</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Draw one ring. Back half (sinθ < 0) first, then front half, so the near rim
// overlaps. `activeIdx` (or -1) marks the segment under the ball — drawn brightest.
function drawRing(ctx, ring, cx, y, rotation, fade, activeIdx) {
  const order = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const mid = rotation + i * STEP + STEP / 2;
    order.push({ i, front: Math.sin(mid) > 0 });
  }
  order.sort((a, b) => (a.front === b.front ? 0 : a.front ? 1 : -1));

  for (const { i, front } of order) {
    const cell = ring[i];
    if (cell === "gap") continue;
    const a0 = rotation + i * STEP;
    const a1 = a0 + STEP * 0.92;
    ctx.beginPath();
    ctx.ellipse(cx, y, R, R * SQUASH, 0, a0, a1);
    ctx.lineWidth = 12;
    if (cell === "trap") {
      ctx.strokeStyle = `rgba(220,119,104,${0.9 * fade})`;
    } else if (i === activeIdx) {
      ctx.strokeStyle = `rgba(212,175,55,${0.95 * fade})`; // gold: aim here
    } else {
      ctx.strokeStyle = front
        ? `rgba(230,232,238,${0.9 * fade})`
        : `rgba(120,130,145,${0.45 * fade})`;
    }
    ctx.stroke();
  }
}
