"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { yyyymmdd, parseYyyymmdd, todayYyyymmdd } from "@/lib/espn";

export function CalendarPicker({ selected }: { selected: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selDate = parseYyyymmdd(selected);
  const [view, setView] = useState(
    () => new Date(Date.UTC(selDate.getUTCFullYear(), selDate.getUTCMonth(), 1))
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const monthLabel = view.toLocaleDateString([], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const firstDow = view.getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(view.getUTCFullYear(), view.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const todayStr = todayYyyymmdd();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth(), d)));
  }

  const shift = (months: number) =>
    setView(new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth() + months, 1)));

  const pick = (v: string) => {
    router.push(`/?date=${v}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef} data-no-swipe>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted"
        aria-label="Pick a date"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span className="hidden sm:inline">Pick date</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 z-40 w-72 rounded-xl border bg-background p-3 shadow-lg"
          role="dialog"
          aria-label="Calendar"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-semibold">{monthLabel}</span>
            <button
              type="button"
              onClick={() => shift(1)}
              className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center uppercase">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const v = yyyymmdd(d);
              const isSel = v === selected;
              const isToday = v === todayStr;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(v)}
                  className={`aspect-square rounded-md text-xs font-medium transition-colors ${
                    isSel
                      ? "bg-foreground text-background"
                      : isToday
                      ? "bg-accent/15 text-accent"
                      : "hover:bg-muted"
                  }`}
                >
                  {d.getUTCDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => pick(todayStr)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Jump to today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
