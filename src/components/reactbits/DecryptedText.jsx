"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/[]{}";

// Adapted from React Bits' DecryptedText component for this project's needs.
export default function DecryptedText({
  text,
  className = "",
  speed = 28,
  animateOn = "view",
}) {
  const [displayText, setDisplayText] = useState(text);
  const [running, setRunning] = useState(false);
  const [played, setPlayed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (animateOn !== "view" || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !played) {
          setRunning(true);
          setPlayed(true);
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [animateOn, played, text]);

  useEffect(() => {
    if (!running) return;
    let iteration = 0;

    const interval = window.setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((character, index) => {
            if (character === " " || index < iteration) return character;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );

      iteration += 0.7;
      if (iteration >= text.length) {
        window.clearInterval(interval);
        setDisplayText(text);
        setRunning(false);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [running, speed, text]);

  const handlePointerEnter = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (animateOn === "hover" && !running) setRunning(true);
  };

  return (
    <span
      ref={ref}
      className={`decrypted-text ${className}`}
      onPointerEnter={handlePointerEnter}
      aria-label={text}
    >
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
}
