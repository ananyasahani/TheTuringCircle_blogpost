"use client";

import { useEffect, useRef } from "react";

const GOLD = [212, 175, 55];
const IVORY = [238, 233, 218];

function createParticle(index, count, width, height) {
  const columns = Math.ceil(Math.sqrt(count * (width / height)));
  const rows = Math.ceil(count / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.32,
    vy: (Math.random() - 0.5) * 0.32,
    phase: Math.random() * Math.PI * 2,
    radius: 30 + Math.random() * Math.min(width, height) * 0.42,
    orbitSpeed: (0.00018 + Math.random() * 0.00034) * (index % 2 ? 1 : -1),
    gridX: ((column + 0.5) / columns) * width,
    gridY: ((row + 0.5) / rows) * height,
    size: index % 11 === 0 ? 1.8 : 0.8 + Math.random() * 0.8,
    light: index % 7 === 0,
  };
}

export default function ParticleField({ mode = "network" }) {
  const canvasRef = useRef(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let frame;
    let startTime = performance.now();
    const pointer = { x: 0, y: 0, active: false };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const count = width < 640 ? 58 : Math.min(118, Math.round(width / 12));
      particles = Array.from({ length: count }, (_, index) =>
        createParticle(index, count, width, height),
      );
      startTime = performance.now();
    };

    const onPointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const targetFor = (particle, index, now) => {
      if (modeRef.current === "orbit") {
        const centerX = width * (width < 700 ? 0.58 : 0.68);
        const centerY = height * 0.48;
        const angle = particle.phase + (now - startTime) * particle.orbitSpeed;
        const ellipse = 0.42 + (index % 5) * 0.08;
        return {
          x: centerX + Math.cos(angle) * particle.radius,
          y: centerY + Math.sin(angle) * particle.radius * ellipse,
        };
      }

      if (modeRef.current === "matrix") {
        const wave = Math.sin(now * 0.0011 + particle.gridX * 0.015) * 15;
        const ripple = Math.cos(now * 0.0008 + particle.gridY * 0.012) * 8;
        return { x: particle.gridX + ripple, y: particle.gridY + wave };
      }

      particle.x += reduceMotion ? 0 : particle.vx;
      particle.y += reduceMotion ? 0 : particle.vy;
      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;
      return { x: particle.x, y: particle.y };
    };

    const draw = (now) => {
      context.clearRect(0, 0, width, height);

      const points = particles.map((particle, index) => {
        const target = targetFor(particle, index, now);
        if (modeRef.current !== "network") {
          particle.x += (target.x - particle.x) * 0.045;
          particle.y += (target.y - particle.y) * 0.045;
        }

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 120 && distance > 0) {
            particle.x += (dx / distance) * (1 - distance / 120) * 0.8;
            particle.y += (dy / distance) * (1 - distance / 120) * 0.8;
          }
        }

        return particle;
      });

      const connectionDistance = modeRef.current === "matrix" ? 92 : 126;
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.18;
            context.beginPath();
            context.moveTo(points[i].x, points[i].y);
            context.lineTo(points[j].x, points[j].y);
            context.strokeStyle = `rgba(${GOLD.join(",")},${opacity})`;
            context.lineWidth = 0.65;
            context.stroke();
          }
        }
      }

      points.forEach((particle) => {
        const color = particle.light ? IVORY : GOLD;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color.join(",")},${particle.light ? 0.78 : 0.62})`;
        context.fill();
      });

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    resize();
    draw(performance.now());
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />;
}
