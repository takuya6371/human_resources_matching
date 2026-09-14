import React from "react";

export default function AfricaLogo({ size = 36, withWordmark = true, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="flex items-center justify-center rounded-xl bg-black text-white shadow-sm"
        style={{ width: size, height: size }}
        aria-label="AfriTalent"
      >
        <svg
          viewBox="0 0 100 100"
          style={{ width: size * 0.72, height: size * 0.72 }}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20 12 Q42 7 60 10 Q63 12 64 16 Q66 24 68 28 Q75 33 82 40 Q83 43 78 44 Q71 50 72 58 Q66 68 60 74 Q54 84 50 92 Q46 94 43 88 Q40 78 34 68 Q30 62 26 58 Q18 50 14 40 Q12 30 16 24 Q18 16 20 12 Z" />
        </svg>
      </span>
      {withWordmark && <span className="font-display text-lg font-semibold tracking-tight">AfriTalent</span>}
    </span>
  );
}