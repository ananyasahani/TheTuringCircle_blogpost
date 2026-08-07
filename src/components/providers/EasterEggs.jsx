"use client";

import { useEffect } from "react";

/**
 * A handful of small, tasteful easter eggs — the kind the founding letter
 * promises. Nothing interferes with normal use; just handshakes for the
 * people who look closely.
 *
 *  1. Console greeting when dev tools open, plus a `ttc()` console command.
 *  2. Konami code (↑↑↓↓←→←→ B A) tips the whole page for a moment.
 *  3. Type "turing" anywhere → a quiet golden note appears.
 *  4. Type "fib" → the Fibonacci sequence prints to the console.
 */
export default function EasterEggs() {
  useEffect(() => {
    // A transient on-screen note for the visible eggs.
    const toast = (message) => {
      const el = document.createElement("div");
      el.className = "egg-toast";
      el.textContent = message;
      document.body.appendChild(el);
      // trigger the CSS transition
      window.requestAnimationFrame(() => el.classList.add("is-in"));
      window.setTimeout(() => {
        el.classList.remove("is-in");
        window.setTimeout(() => el.remove(), 400);
      }, 2600);
    };

    // ── 1. Console greeting + a `ttc()` command ──────────────────────────
    const titleCss =
      "font-family: Georgia, serif; font-size: 22px; color: #d4af37; font-style: italic;";
    const bodyCss = "font-family: monospace; font-size: 12px; color: #9dccf4;";
    // eslint-disable-next-line no-console
    console.log("%cThe Turing Circle", titleCss);
    // eslint-disable-next-line no-console
    console.log(
      "%cYou found one. There are more, on the page and off it. Type ttc() for a hint. Fancy building with us? hello@theturingcircle, bring something clever.",
      bodyCss,
    );
    try {
      Object.defineProperty(window, "ttc", {
        configurable: true,
        value: () => {
          // eslint-disable-next-line no-console
          console.log(
            "%cHints: try the Konami code. Type 'turing' while you read. Type 'fib'. And look closely at the founding letter.",
            bodyCss,
          );
          return "↑↑↓↓←→←→ B A";
        },
      });
    } catch {
      /* window.ttc already defined — fine */
    }

    // ── shared: a rolling buffer of recent keystrokes ────────────────────
    let buffer = "";
    const konami = "ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba";

    const onKey = (event) => {
      // ignore typing inside inputs / the editor
      const t = event.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }

      buffer = (buffer + event.key).slice(-64);

      // 2. Konami code → gentle page tilt
      if (buffer.endsWith(konami)) {
        document.documentElement.classList.add("konami-tilt");
        window.setTimeout(
          () => document.documentElement.classList.remove("konami-tilt"),
          1600,
        );
        toast("↑↑↓↓←→←→ B A — hello, you.");
      }

      // 3. Type "turing"
      if (buffer.toLowerCase().endsWith("turing")) {
        toast("Alan would be proud. Probably.");
      }

      // 4. Type "fib" → console Fibonacci
      if (buffer.toLowerCase().endsWith("fib")) {
        const fib = [0, 1];
        while (fib.length < 12) fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
        // eslint-disable-next-line no-console
        console.log("%c" + fib.join(", ") + " …", bodyCss);
        toast("Check the console. And read the Fibonacci piece.");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      try {
        delete window.ttc;
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}
