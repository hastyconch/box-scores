"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { yyyymmdd, parseYyyymmdd } from "@/lib/espn";

const SWIPE_THRESHOLD = 60;
const PULL_THRESHOLD = 70;
const PULL_MAX = 120;

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

  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

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
  const pullMode = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest("[data-no-swipe]")) {
      startX.current = null;
      return;
    }
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    pullMode.current = window.scrollY <= 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    const dx = e.touches[0].clientX - startX.current;
    if (pullMode.current && dy > 0 && Math.abs(dy) > Math.abs(dx)) {
      // Rubber-band pull indicator
      setPullY(Math.min(dy * 0.5, PULL_MAX));
    } else if (pullY > 0) {
      setPullY(0);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    const wasPulling = pullMode.current;
    startX.current = null;
    startY.current = null;
    pullMode.current = false;
    const currentPull = pullY;
    setPullY(0);

    // Pull-to-refresh: vertical pull from top
    if (wasPulling && currentPull >= PULL_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      setRefreshing(true);
      router.refresh();
      setTimeout(() => setRefreshing(false), 800);
      return;
    }

    // Horizontal swipe: day navigation
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const d = parseYyyymmdd(dateRef.current);
    d.setUTCDate(d.getUTCDate() + (dx < 0 ? 1 : -1));
    router.push(`/?date=${yyyymmdd(d)}`);
  };

  const showIndicator = pullY > 0 || refreshing;
  const indicatorY = refreshing ? PULL_THRESHOLD : pullY;
  const triggerReady = pullY >= PULL_THRESHOLD;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="touch-pan-y relative"
    >
      {showIndicator && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center h-8 w-8 rounded-full bg-card border shadow-sm transition-opacity"
          style={{
            top: 0,
            transform: `translate(-50%, ${indicatorY - 40}px)`,
            opacity: Math.min(indicatorY / PULL_THRESHOLD, 1),
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""} ${
              triggerReady ? "text-accent" : "text-muted-foreground"
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
        </div>
      )}
      {children}
    </div>
  );
}
