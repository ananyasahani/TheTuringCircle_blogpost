"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HelixDrop — a small, on-brand take on Helix Jump for the blog side gutter.
 *
 * A stack of rotating rings descends; each ring has segments that are either
 * solid (bounce), a gap (fall through to the next ring), or a trap (game over).
 * Rotate the tower with drag or ←/→ to line a gap up under the ball. Score is
 * how deep you get. Desktop-only (there's no room on narrow screens), pauses
 * when off-screen.
 */

const SEGMENTS = 12; // slices per ring
const W = 300;
const H = 460;

// Ring difficulty grows with depth: fewer gaps, more traps.
function makeRing(depth) {
  const cells = new Array(SEGMENTS).fill("solid");
  // always at least one gap
  const gapCount = Math.max(1, 3 - Math.floor(depth / 6));
  const gaps = new Set();
  while (gaps.size < gapCount) {
    gaps.add(Math.floor((depth * 7 + gaps.size * 5 + 3) % SEGMENTS));
  }
  gaps.forEach((g) => (cells[g] = "gap"));
  // traps appear after a few levels, never on a gap
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
  const [status, setStatus] = useState("idle"); // idle | playing | over
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const stateRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // game state
    const s = {
      depth: 0,
      rotation: 0, // radians
      rotVel: 0,
      ball: { y: 120, vy: 0 },
      rings: [],
      running: false,
      dead: false,
      shake: 0,
    };
    stateRef.current = s;

    const reset = () => {
      s.depth = 0;
      s.rotation = 0;
      s.rotVel = 0;
      s.ball = { y: 120, vy: 0 };
      s.rings = Array.from({ length: 40 }, (_, d) => makeRing(d));
      s.dead = false;
      s.shake = 0;
      setScore(0);
    };
    reset();

    // ── input ────────────────────────────────────────────────────────────
    let dragging = false;
    let lastX = 0;
    const onDown = (e) => {
      if (s.dead || !s.running) return;
      dragging = true;
      lastX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    };
    const onMove = (e) => {
      if (!dragging) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      s.rotation += (x - lastX) * 0.01;
      lastX = x;
    };
    const onUp = () => {
      dragging = false;
    };
    const onKey = (e) => {
      if (!s.running || s.dead) return;
      if (e.key === "ArrowLeft") s.rotation -= 0.26;
      if (e.key === "ArrowRight") s.rotation += 0.26;
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("keydown", onKey);

    // pause when off-screen
    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => (onScreen = entries[0]?.isIntersecting ?? true),
      { threshold: 0 },
    );
    io.observe(canvas);

    // ── constants for layout ──────────────────────────────────────────────
    const cx = W / 2;
    const ballScreenY = 150; // ball's fixed screen position
    const ringGap = 74; // vertical spacing between rings
    const ringR = 96; // ring radius
    const gravity = 0.42;
    const bounce = -8.4;

    // Which segment sits at the front (under the ball). Must match the "front"
    // test used in drawRing: the segment whose mid-angle is nearest angle 0.
    const step = (Math.PI * 2) / SEGMENTS;
    const frontSegment = () => {
      let best = 0;
      let bestCos = -2;
      for (let i = 0; i < SEGMENTS; i++) {
        const mid = s.rotation + i * step + step / 2;
        const c = Math.cos(mid);
        if (c > bestCos) {
          bestCos = c;
          best = i;
        }
      }
      return best;
    };

    let raf;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!onScreen) return;

      // physics only while playing
      if (s.running && !s.dead) {
        s.rotation += s.rotVel;
        s.rotVel *= 0.9;

        s.ball.vy += gravity;
        s.ball.y += s.ball.vy;

        // ball meets the top ring's plane
        if (s.ball.y >= ballScreenY + 6 && s.ball.vy > 0) {
          const front = frontSegment();
          const cell = s.rings[s.depth]?.[front] ?? "solid";
          if (cell === "gap") {
            // fall through to next ring
            s.depth += 1;
            s.ball.y = ballScreenY - ringGap + 6;
            setScore(s.depth);
            if (s.depth > best) setBest(s.depth);
            // top up the ring buffer
            if (s.rings.length - s.depth < 12) {
              const start = s.rings.length;
              for (let k = 0; k < 12; k++) s.rings.push(makeRing(start + k));
            }
          } else if (cell === "trap") {
            s.dead = true;
            s.shake = 12;
            setStatus("over");
          } else {
            s.ball.vy = bounce;
          }
        }
      }

      // ── render ───────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      const shakeX = s.shake > 0 ? (Math.random() - 0.5) * s.shake : 0;
      if (s.shake > 0) s.shake *= 0.85;
      ctx.save();
      ctx.translate(shakeX, 0);

      // draw a handful of rings descending from current depth
      for (let d = 0; d < 6; d++) {
        const ringIndex = s.depth + d;
        const ring = s.rings[ringIndex];
        if (!ring) continue;
        const y = ballScreenY + d * ringGap;
        const fade = 1 - d * 0.14;
        drawRing(ctx, ring, cx, y, ringR, s.rotation, fade, reduce);
      }

      // the ball
      const by = Math.min(s.ball.y, ballScreenY);
      ctx.beginPath();
      ctx.arc(cx, by, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#d4af37";
      ctx.shadowColor = "rgba(212,175,55,0.6)";
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    };
    loop();

    // expose reset for the button
    s._reset = reset;

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("keydown", onKey);
    };
  }, [best]);

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
              {status === "over" ? `You reached depth ${score}.` : "A little game."}
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

// Draw one ring as an arc of colored segments. The front segment (under the
// ball) is emphasized so the player can read what they're about to land on.
function drawRing(ctx, ring, cx, y, r, rotation, fade, reduce) {
  const step = (Math.PI * 2) / SEGMENTS;
  // vertical squash to fake perspective
  const squash = 0.38;
  for (let i = 0; i < SEGMENTS; i++) {
    const cell = ring[i];
    if (cell === "gap") continue;
    const a0 = rotation + i * step;
    const a1 = a0 + step * 0.9;
    // is this the front segment (near angle pointing "down"/toward viewer)?
    const mid = a0 + step / 2;
    const front = Math.cos(mid) > 0.86; // near 0 rad = front
    ctx.beginPath();
    ctx.ellipse(cx, y, r, r * squash, 0, a0, a1);
    ctx.lineWidth = 13;
    ctx.lineCap = "butt";
    if (cell === "trap") {
      ctx.strokeStyle = `rgba(220,119,104,${0.85 * fade})`;
    } else {
      ctx.strokeStyle = front
        ? `rgba(245,246,248,${0.95 * fade})`
        : `rgba(140,150,165,${0.5 * fade})`;
    }
    ctx.stroke();
  }
}
