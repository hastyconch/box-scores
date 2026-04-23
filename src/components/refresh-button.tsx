"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinUntil, setSpinUntil] = useState(0);
  const spinning = isPending || Date.now() < spinUntil;

  const onClick = () => {
    setSpinUntil(Date.now() + 600);
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="inline-flex items-center justify-center h-9 w-9 rounded-lg border bg-card hover:bg-muted disabled:opacity-60"
      aria-label="Refresh"
      data-no-swipe
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-3-6.7" />
        <path d="M21 4v5h-5" />
      </svg>
    </button>
  );
}
