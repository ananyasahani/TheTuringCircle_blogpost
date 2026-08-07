"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SnakeGame — a classic snake with a Fibonacci twist for the blog side gutter.
 *
 * Each pellet carries the next Fibonacci number (1, 1, 2, 3, 5, 8 …). Eating it
 * grows the snake by that many segments and adds it to your score, so the score
 * is a running Fibonacci sum. Grid-based, so it's rock-solid — no physics.
 * Arrow keys / WASD to steer. Desktop-only, pauses when off-screen.
 */

const COLS = 13;
const ROWS = 19;
const CELL = 22;
const W = COLS * CELL; // 286
const H = ROWS * CELL; // 418
const TICK_MS = 120;

const fib = (n) => {
  let a = 1;
  let b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
};

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | playing | over
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [next, setNext] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const s = {
      snake: [],
      dir: { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      food: { x: 0, y: 0 },
      fibIndex: 0,
      grow: 0,
      running: false,
      dead: false,
      acc: 0,
      last: 0,
    };
    stateRef.current = s;

    const placeFood = () => {
      const occupied = new Set(s.snake.map((p) => `${p.x},${p.y}`));
      let x;
      let y;
      let guard = 0;
      do {
        x = Math.floor(Math.random() * COLS);
        y = Math.floor(Math.random() * ROWS);
        guard += 1;
      } while (occupied.has(`${x},${y}`) && guard < 200);
      s.food = { x, y };
    };

    const reset = () => {
      const cx = Math.floor(COLS / 2);
      const cy = Math.floor(ROWS / 2);
      s.snake = [
        { x: cx, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx, y: cy + 2 },
      ];
      s.dir = { x: 0, y: -1 };
      s.nextDir = { x: 0, y: -1 };
      s.fibIndex = 0;
      s.grow = 0;
      s.dead = false;
      placeFood();
      setScore(0);
      setNext(fib(0));
    };
    reset();

    const onKey = (e) => {
      if (!s.running || s.dead) return;
      const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const nd = map[e.key];
      if (!nd) return;
      e.preventDefault();
      if (nd.x === -s.dir.x && nd.y === -s.dir.y) return;
      s.nextDir = nd;
    };
    window.addEventListener("keydown", onKey);

    let onScreen = true;
    const io = new IntersectionObserver(
      (entries) => (onScreen = entries[0]?.isIntersecting ?? true),
      { threshold: 0 },
    );
    io.observe(canvas);

    const stepGame = () => {
      s.dir = s.nextDir;
      const head = s.snake[0];
      const nx = head.x + s.dir.x;
      const ny = head.y + s.dir.y;

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
        s.dead = true;
        setStatus("over");
        return;
      }
      if (s.snake.some((p, i) => i > 0 && p.x === nx && p.y === ny)) {
        s.dead = true;
        setStatus("over");
        return;
      }

      s.snake.unshift({ x: nx, y: ny });

      if (nx === s.food.x && ny === s.food.y) {
        const value = fib(s.fibIndex);
        s.grow += value;
        setScore((sc) => sc + value);
        s.fibIndex += 1;
        setNext(fib(s.fibIndex));
        placeFood();
      }

      if (s.grow > 0) {
        s.grow -= 1;
      } else {
        s.snake.pop();
      }
      setBest((b) => Math.max(b, s.snake.length));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, H);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(W, r * CELL);
        ctx.stroke();
      }

      const fx = s.food.x * CELL + CELL / 2;
      const fy = s.food.y * CELL + CELL / 2;
      ctx.beginPath();
      ctx.arc(fx, fy, CELL * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(212,175,55,0.18)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx, fy, CELL * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = "#d4af37";
      ctx.shadowColor = "rgba(212,175,55,0.6)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#000";
      ctx.font = "700 9px 'Space Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(fib(s.fibIndex)), fx, fy + 0.5);

      s.snake.forEach((p, i) => {
        const t = 1 - i / (s.snake.length + 4);
        const px = p.x * CELL;
        const py = p.y * CELL;
        ctx.fillStyle =
          i === 0 ? "#f5f6f8" : `rgba(157,204,244,${0.35 + t * 0.5})`;
        roundRect(ctx, px + 2, py + 2, CELL - 4, CELL - 4, 5);
        ctx.fill();
      });
    };

    let raf;
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      if (!onScreen) return;
      if (!s.last) s.last = ts;
      const dt = ts - s.last;
      s.last = ts;

      if (s.running && !s.dead) {
        s.acc += dt;
        while (s.acc >= TICK_MS) {
          s.acc -= TICK_MS;
          stepGame();
          if (s.dead) break;
        }
      }
      draw();
    };
    raf = requestAnimationFrame(loop);

    s._reset = reset;

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const start = () => {
    const s = stateRef.current;
    if (!s) return;
    s._reset();
    s.running = true;
    s.acc = 0;
    s.last = 0;
    setStatus("playing");
    canvasRef.current?.focus();
  };

  return (
    <div className="helix-drop">
      <div className="helix-head">
        <span className="helix-title">Fibonacci Snake</span>
        <span className="helix-score">
          {score} <i>/ next {next}</i>
        </span>
      </div>
      <div className="helix-stage">
        <canvas
          ref={canvasRef}
          className="helix-canvas"
          style={{ width: W, height: H }}
          tabIndex={0}
          aria-label="Fibonacci Snake mini game"
        />
        {status !== "playing" && (
          <div className="helix-overlay">
            <p>
              {status === "over"
                ? `Length ${best}. Eat pellets in Fibonacci order.`
                : "Snake, with a Fibonacci twist."}
            </p>
            <button type="button" onClick={start}>
              {status === "over" ? "Again" : "Play"}
            </button>
            <span className="helix-hint">arrow keys / WASD</span>
          </div>
        )}
      </div>
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
