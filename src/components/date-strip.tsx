import Link from "next/link";
import { yyyymmdd } from "@/lib/espn";

export function DateStrip({ days, selected }: { days: Date[]; selected: string }) {
  const todayStr = yyyymmdd(new Date());
  const onToday = selected === todayStr;

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
      data-no-swipe
    >
      {days.map((d) => {
        const v = yyyymmdd(d);
        const isSel = v === selected;
        const isToday = v === todayStr;
        return (
          <Link
            key={v}
            href={`/?date=${v}`}
            className={`shrink-0 flex flex-col items-center w-14 py-2 rounded-xl border text-xs font-medium transition-colors ${
              isSel
                ? "bg-foreground text-background border-foreground"
                : "bg-card hover:bg-muted text-foreground"
            }`}
          >
            <span
              className={`uppercase ${
                isSel
                  ? "opacity-80"
                  : isToday
                  ? "text-accent"
                  : "text-muted-foreground"
              }`}
            >
              {isToday
                ? "Today"
                : d.toLocaleDateString([], { weekday: "short", timeZone: "UTC" })}
            </span>
            <span className="text-base font-semibold">
              {d.toLocaleDateString([], { day: "numeric", timeZone: "UTC" })}
            </span>
          </Link>
        );
      })}
      {!onToday && (
        <Link
          href="/"
          className="shrink-0 ml-1 rounded-full bg-accent/10 text-accent px-3 py-1.5 text-xs font-semibold hover:bg-accent/20"
        >
          Jump to today
        </Link>
      )}
    </div>
  );
}
