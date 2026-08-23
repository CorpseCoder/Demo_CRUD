"use client";

export default function Stars({
  value,
  onChange,
}: {
  value: number | null;
  onChange?: (v: number | null) => void;
}) {
  const current = value ?? 0;
  return (
    <div className="flex gap-0.5" role={onChange ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(current === n ? null : n)}
            aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
            className={`text-xl leading-none transition ${
              n <= current ? "text-amber-400" : "text-zinc-700 hover:text-zinc-500"
            }`}
          >
            ★
          </button>
        ) : (
          <span
            key={n}
            className={`text-sm leading-none ${n <= current ? "text-amber-400" : "text-zinc-700"}`}
          >
            ★
          </span>
        ),
      )}
    </div>
  );
}
