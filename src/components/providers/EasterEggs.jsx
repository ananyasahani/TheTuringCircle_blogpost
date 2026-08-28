"use client";

import { useEffect } from "react";

/**
 * A couple of small, tasteful easter eggs — the kind the founding letter
 * promises. Nothing that interferes with normal use; just handshakes for the
 * people who look closely.
 *
 *  1. A console greeting for anyone who opens dev tools.
 *  2. The Konami code (↑↑↓↓←→←→ B A) tips the whole page for a moment.
 */
export default function EasterEggs() {
  useEffect(() => {
    // 1. Console greeting
    const title =
      "font-family: Georgia, serif; font-size: 22px; color: #d4af37; font-style: italic;";
    const body = "font-family: monospace; font-size: 12px; color: #9dccf4;";
    console.log("%cThe Turing Circle", title);
    console.log(
      "%cYou found the first one. There are more. Fancy building with us? mail hello@theturingcircle — bring something clever.",
      body,
    );

    // 2. Konami code → a brief, gentle tilt of the page
    const sequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ];
    let progress = 0;

    const onKey = (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      progress = key === sequence[progress] ? progress + 1 : 0;
      if (progress === sequence.length) {
        progress = 0;
        document.documentElement.classList.add("konami-tilt");
        window.setTimeout(
          () => document.documentElement.classList.remove("konami-tilt"),
          1600,
        );
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
