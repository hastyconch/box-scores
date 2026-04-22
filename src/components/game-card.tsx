import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { formatGameTime } from "@/lib/format";
import type { Event } from "@/lib/espn";

export function GameCard({ event }: { event: Event }) {
  const comp = event.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === "home")!;
  const away = comp.competitors.find((c) => c.homeAway === "away")!;
  const status = event.status ?? comp.status;
  const state = status?.type?.state ?? "pre";
  const statusDetail = status?.type?.shortDetail ?? "";
  const statusFullDetail = status?.type?.detail ?? "";
  const isLive = state === "in";
  const isFinal = state === "post";
  const isPre = state === "pre";

  const homeScore = Number(home.score ?? 0);
  const awayScore = Number(away.score ?? 0);

  function rowClasses(side: typeof home) {
    const lost = isFinal && side.winner === false;
    return lost ? "opacity-50" : "";
  }

  return (
    <Link
      href={`/games/${event.id}`}
      className="group block rounded-2xl border bg-card hover:border-foreground/20 transition-colors overflow-hidden"
    >
      <div className="px-4 pt-3 pb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground truncate pr-2">
          {comp.notes?.[0]?.headline ?? comp.series?.summary ?? ""}
        </span>
        <StatusPill state={state} detail={statusDetail} />
      </div>
      <div className="px-4 pb-3">
        <Row competitor={away} score={isPre ? null : awayScore} className={rowClasses(away)} />
        <Row competitor={home} score={isPre ? null : homeScore} className={rowClasses(home)} />
      </div>
      <div className="px-4 pb-3 text-xs text-muted-foreground border-t pt-2 flex items-center justify-between">
        <span>
          {isPre ? formatGameTime(event.date) : isLive ? statusFullDetail : "Final"}
        </span>
        {comp.venue?.fullName && <span className="truncate ml-2">{comp.venue.fullName}</span>}
      </div>
    </Link>
  );
}

function Row({
  competitor,
  score,
  className = "",
}: {
  competitor: import("@/lib/espn").Competitor;
  score: number | null;
  className?: string;
}) {
  const t = competitor.team;
  const record = competitor.records?.[0]?.summary;
  return (
    <div className={`flex items-center gap-3 py-1.5 ${className}`}>
      <TeamLogo team={t} size={32} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">{t.shortDisplayName ?? t.name ?? t.displayName}</div>
        {record && <div className="text-[11px] text-muted-foreground">{record}</div>}
      </div>
      <div className="text-xl font-mono font-semibold tabular-nums w-12 text-right">
        {score === null ? "—" : score}
      </div>
    </div>
  );
}

function StatusPill({ state, detail }: { state: "pre" | "in" | "post"; detail: string }) {
  if (state === "in") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-negative">
        <span className="h-1.5 w-1.5 rounded-full bg-negative animate-pulse" />
        LIVE
      </span>
    );
  }
  if (state === "post") {
    return <span className="text-[11px] font-semibold text-muted-foreground">FINAL</span>;
  }
  return <span className="text-[11px] font-semibold text-muted-foreground uppercase">{detail}</span>;
}
