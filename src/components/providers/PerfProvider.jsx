"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/**
 * PerfProvider — decides whether to run the full liquid-glass experience or a
 * "Lite" version (static image, cheap scrims). This is what keeps the site
 * usable on Brave (WebGL blocked), Firefox (slow continuous shaders), and
 * weaker integrated-GPU machines.
 *
 * Resolution order for the initial value:
 *   1. Manual override saved in localStorage ("ttc-lite" = "1" | "0") — wins.
 *   2. Auto: lite if WebGL is unavailable, prefers-reduced-motion is set, or the
 *      device looks weak (few cores / little memory).
 * The chosen mode is reflected as a `lite` class on <html> so CSS can drop the
 * expensive backdrop-filter blurs too.
 */

const PerfContext = createContext({ lite: false, setLite: () => {}, auto: true });

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function detectLite() {
  if (typeof window === "undefined") return false;
  if (!webglAvailable()) return true; // Brave Shields etc.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  // Note: phones keep the animation — the hero→intro scroll glitch is fixed by
  // ignoring URL-bar height changes in LiquidSpiral's resize, not by going lite.
  // Only drop to lite on genuinely weak hardware.
  const cores = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8; // GB, Chromium-only; undefined elsewhere
  if (cores <= 2) return true;
  if (mem <= 2) return true;
  return false;
}

export function PerfProvider({ children }) {
  // Start in full mode for SSR parity; correct on mount to avoid hydration flash.
  const [lite, setLiteState] = useState(false);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    let initial;
    let isAuto = true;
    try {
      const saved = localStorage.getItem("ttc-lite");
      if (saved === "1" || saved === "0") {
        initial = saved === "1";
        isAuto = false;
      }
    } catch {
      /* ignore */
    }
    if (initial === undefined) initial = detectLite();
    setLiteState(initial);
    setAuto(isAuto);
    document.documentElement.classList.toggle("lite", initial);
  }, []);

  const setLite = useCallback((value) => {
    setLiteState(value);
    setAuto(false);
    document.documentElement.classList.toggle("lite", value);
    try {
      localStorage.setItem("ttc-lite", value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <PerfContext.Provider value={{ lite, setLite, auto }}>
      {children}
    </PerfContext.Provider>
  );
}

export function usePerf() {
  return useContext(PerfContext);
}
