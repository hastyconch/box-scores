"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { yyyymmdd, parseYyyymmdd } from "@/lib/espn";

export function DayNavigator({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dateRef = useRef(date);
  dateRef.current = date;

  useEffect(() => {
    const shift = (offset: number) => {
      const d = parseYyyymmdd(dateRef.current);
      d.setUTCDate(d.getUTCDate() + offset);
      router.push(`/?date=${yyyymmdd(d)}`);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") shift(-1);
      else if (e.key === "ArrowRight") shift(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-no-swipe]")) {
      startX.current = null;
      return;
    }
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    startY.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const d = parseYyyymmdd(dateRef.current);
    d.setUTCDate(d.getUTCDate() + (dx < 0 ? 1 : -1));
    router.push(`/?date=${yyyymmdd(d)}`);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="touch-pan-y">
      {children}
    </div>
  );
}
