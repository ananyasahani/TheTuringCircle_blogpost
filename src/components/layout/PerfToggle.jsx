"use client";

import { usePerf } from "@/components/providers/PerfProvider";

/**
 * A small control to toggle Lite mode (static image + no heavy blur) on or off.
 * The honest answer to "not everyone has a fast machine" — let people choose.
 */
export default function PerfToggle() {
  const { lite, setLite } = usePerf();
  return (
    <button
      type="button"
      className="perf-toggle"
      onClick={() => setLite(!lite)}
      aria-pressed={lite}
      title={
        lite
          ? "Lite mode is on — animations off for performance"
          : "Full mode — liquid-glass animation on"
      }
    >
      <span className="dot" aria-hidden="true" />
      {lite ? "Lite mode" : "Full mode"}
    </button>
  );
}
