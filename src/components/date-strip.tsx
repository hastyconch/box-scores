import Link from "next/link";
import { yyyymmdd } from "@/lib/espn";

export function DateStrip({ days, selected }: { days: Date[]; selected: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      {days.map((d) => {
        const v = yyyymmdd(d);
        const isSel = v === selected;
        return (
          <Link
            key={v}
            href={`/schedule?date=${v}`}
            className={`shrink-0 flex flex-col items-center w-14 py-2 rounded-xl border text-xs font-medium transition-colors ${
              isSel
                ? "bg-foreground text-background border-foreground"
                : "bg-card hover:bg-muted text-foreground"
            }`}
          >
            <span className={`uppercase ${isSel ? "opacity-80" : "text-muted-foreground"}`}>
              {d.toLocaleDateString([], { weekday: "short", timeZone: "UTC" })}
            </span>
            <span className="text-base font-semibold">
              {d.toLocaleDateString([], { day: "numeric", timeZone: "UTC" })}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
