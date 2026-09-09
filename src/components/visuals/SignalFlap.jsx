"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SignalFlap — Flappy Bird with a probability twist, for the blog side gutter.
 *
 * Gap centres follow a SINE signal along x:  gapY(x) = mid + A·sin(ω·x).
 * Because it's periodic and bounded, the base path "resets itself" — it never
 * runs away. The twist: as you advance in x, an uncertainty term whose
 * amplitude GROWS with distance scatters each gap off the clean curve. Early
 * gaps sit on the signal (easy to read); later ones are noisy (you're flying
 * through a signal decaying into noise). A faint centreline + a widening
 * ±uncertainty band make the growing confidence interval visible.
 *
 * Flap: click / tap / Space. Desktop gutter only; pauses when off-screen.
 */

const W = 300;
const H = 460;
const BIRD_X = 78;
const BIRD_R = 8;
const GRAVITY = 0.42;
const FLAP = -6.6;
const SPEED = 1.9; // world scroll px/frame
const SPACING = 150; // px between walls
const WALL_W = 16;
const MID = H / 2;
const AMP = 96; // sine amplitude
const OMEGA = 0.014; // sine frequency (radians per world px)

export default function SignalFlap() {
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

    const s = {
      y: MID,
      vy: 0,
      worldX: 0, // total distance travelled
      walls: [],
      running: false,
      dead: false,
      spawnAt: 0,
    };
    stateRef.current = s;

    // Clean signal value at a given world x.
    const signal = (x) => MID + Math.sin(x * OMEGA) * AMP;
    // Uncertainty (std-dev-ish) grows with distance, capped.
    const uncertainty = (x) => Math.min(120, x * 0.02);

    const spawnWall = (worldX) => {
      const u = uncertainty(worldX);
      // gap centre = signal + noise scaled by current uncertainty
      const noise = (Math.random() * 2 - 1) * u;
      let gapY = signal(worldX) + noise;
      const gapH = Math.max(108, 168 - worldX * 0.01); // shrinks slowly
      gapY = Math.max(gapH / 2 + 12, Math.min(H - gapH / 2 - 12, gapY));
      s.walls.push({ x: W, gapY, gapH, passed: false });
    };

    const reset = () => {
      s.y = MID;
      s.vy = 0;
      s.worldX = 0;
      s.walls = [];
      s.dead = false;
      s.spawnAt = 0;
      setScore(0);
      // seed a couple ahead
      for (let i = 0; i < 3; i++) {
        s.walls.push({
          x: W + 40 + i * SPACING,
          gapY: signal((W + i * SPACING) * 0.5),
          gapH: 168,
          passed: false,
        });
      }
    };
    reset();

    const flap = () => {
      if (!s.running || s.dead) return;
      s.vy = FLAP;
    };
    const onKey = (e) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        flap();
      }
    };
    const onPointer = () => flap();
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onPointer);

    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => (onScreen = entries[0]?.isIntersecting ?? true),
      { threshold: 0 },
    );
    io.observe(canvas);

    const step = () => {
      s.vy += GRAVITY;
      s.y += s.vy;
      s.worldX += SPEED;

      // move walls, spawn new, cull old
      for (const w of s.walls) w.x -= SPEED;
      s.spawnAt -= SPEED;
      if (s.spawnAt <= 0) {
        spawnWall(s.worldX);
        s.spawnAt = SPACING;
      }
      s.walls = s.walls.filter((w) => w.x + WALL_W > -4);

      // ceiling / floor
      if (s.y < BIRD_R || s.y > H - BIRD_R) {
        s.dead = true;
        setStatus("over");
        return;
      }

      // collisions + scoring
      for (const w of s.walls) {
        const withinX = BIRD_X + BIRD_R > w.x && BIRD_X - BIRD_R < w.x + WALL_W;
        if (withinX) {
          const inGap =
            s.y - BIRD_R > w.gapY - w.gapH / 2 &&
            s.y + BIRD_R < w.gapY + w.gapH / 2;
          if (!inGap) {
            s.dead = true;
            setStatus("over");
            return;
          }
        }
        if (!w.passed && w.x + WALL_W < BIRD_X - BIRD_R) {
          w.passed = true;
          setScore((sc) => {
            const n = sc + 1;
            setBest((b) => Math.max(b, n));
            return n;
          });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // ── the signal: faint sine centreline + widening uncertainty band ──
      ctx.beginPath();
      for (let px = 0; px <= W; px += 4) {
        const wx = s.worldX + px - BIRD_X;
        const y = signal(wx);
        px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
      }
      ctx.strokeStyle = "rgba(157,204,244,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // uncertainty band (±u) as a filled ribbon
      ctx.beginPath();
      for (let px = 0; px <= W; px += 4) {
        const wx = s.worldX + px - BIRD_X;
        ctx.lineTo(px, signal(wx) - uncertainty(wx));
      }
      for (let px = W; px >= 0; px -= 4) {
        const wx = s.worldX + px - BIRD_X;
        ctx.lineTo(px, signal(wx) + uncertainty(wx));
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(157,204,244,0.06)";
      ctx.fill();

      // ── walls ──
      for (const w of s.walls) {
        ctx.fillStyle = "rgba(230,232,238,0.16)";
        // top
        roundRect(ctx, w.x, 0, WALL_W, w.gapY - w.gapH / 2, 4);
        ctx.fill();
        // bottom
        roundRect(
          ctx,
          w.x,
          w.gapY + w.gapH / 2,
          WALL_W,
          H - (w.gapY + w.gapH / 2),
          4,
        );
        ctx.fill();
        // gap-centre tick — shows where the signal said it should be
        ctx.fillStyle = "rgba(212,175,55,0.5)";
        ctx.fillRect(w.x, w.gapY - 1, WALL_W, 2);
      }

      // ── bird ──
      ctx.beginPath();
      ctx.arc(BIRD_X, s.y, BIRD_R, 0, Math.PI * 2);
      ctx.fillStyle = "#d4af37";
      ctx.shadowColor = "rgba(212,175,55,0.6)";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    let raf;
    let acc = 0;
    let last = 0;
    const TICK = 1000 / 60;
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      if (!onScreen) return;
      if (!last) last = ts;
      acc += ts - last;
      last = ts;
      if (s.running && !s.dead) {
        let guard = 0;
        while (acc >= TICK && guard < 5) {
          acc -= TICK;
          step();
          guard += 1;
          if (s.dead) break;
        }
      } else {
        acc = 0;
      }
      draw();
    };
    raf = requestAnimationFrame(loop);

    s._reset = reset;

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
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
        <span className="helix-title">Signal Flap</span>
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
          aria-label="Signal Flap mini game"
        />
        {status !== "playing" && (
          <div className="helix-overlay">
            <p>
              {status === "over"
                ? `Score ${score}. The gaps drift as uncertainty grows.`
                : "Flap through the signal. The noise grows with distance."}
            </p>
            <button type="button" onClick={start}>
              {status === "over" ? "Again" : "Play"}
            </button>
            <span className="helix-hint">click / space to flap</span>
          </div>
        )}
      </div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
