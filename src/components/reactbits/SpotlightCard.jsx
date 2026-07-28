"use client";

import { useRef } from "react";

// Adapted from React Bits' SpotlightCard component.
export default function SpotlightCard({
  as: Element = "div",
  children,
  className = "",
  spotlightColor = "rgba(212, 175, 55, 0.08)",
}) {
  const elementRef = useRef(null);

  const handlePointerMove = (event) => {
    const element = elementRef.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    element.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    element.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
    element.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <Element
      ref={elementRef}
      className={`spotlight-surface ${className}`}
      onPointerMove={handlePointerMove}
    >
      {children}
    </Element>
  );
}
