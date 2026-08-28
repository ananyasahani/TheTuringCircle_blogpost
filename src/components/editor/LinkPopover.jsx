"use client";

import { useEffect, useRef, useState } from "react";

/** URL entry for the link button. Applies on Enter, cancels on Escape. */
export default function LinkPopover({ initial = "", onApply, onRemove, onCancel }) {
  const [value, setValue] = useState(initial);
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <div className="tc-link-popover">
      <input
        ref={ref}
        value={value}
        placeholder="https://…"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onApply(value.trim());
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        aria-label="Link URL"
      />
      <button type="button" onClick={() => onApply(value.trim())} title="Apply">
        Apply
      </button>
      {initial && (
        <button type="button" onClick={onRemove} title="Remove link">
          Remove
        </button>
      )}
    </div>
  );
}
