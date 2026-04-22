import { getScoreboard, type Event, type Competition } from "@/lib/espn";
import { TeamLogo } from "@/components/team-logo";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/empty";
import Link from "next/link";
import { formatGameDate } from "@/lib/format";

export const revalidate = 600;

export default async function PlayoffsPage() {
  const today = new Date();
  // Pull the entire postseason window: NBA postseason runs ~mid-April to late June.
  const seasonEndYear = today.getMonth() >= 9 ? today.getFullYear() + 1 : today.getFullYear();
  const start = `${seasonEndYear}0410`;
  const end = `${seasonEndYear}0625`;
  const sb = await getScoreboard(`${start}-${end}`).catch(() => ({ events: [] }));
  const events = sb.events ?? [];

  if (events.length === 0) {
    return (
      <div>
        <PageHeader title="Playoffs" />
        <Empty title="Playoffs haven't started yet" hint="Come back during the postseason." />
      </div>
    );
  }

  // Group events into series by sorted-team-pair key, scoped to a round.
  type Series = {
    round: string;
    conference: "East" | "West" | "Finals" | "Play-In";
    matchupKey: string;
    teams: Competition["competitors"];
    series?: Competition["series"];
    games: Event[];
  };
  const seriesMap = new Map<string, Series>();

  for (const e of events) {
    const comp = e.competitions[0];
    const headline = comp.notes?.[0]?.headline ?? "";
    const round = parseRound(headline);
    const conf = parseConference(headline);
    const ids = comp.competitors.map((c) => c.team.id).sort().join("-");
    const key = `${round}|${conf}|${ids}`;
    let s = seriesMap.get(key);
    if (!s) {
      s = { round, conference: conf, matchupKey: ids, teams: comp.competitors, series: comp.series, games: [] };
      seriesMap.set(key, s);
    }
    s.games.push(e);
    if (!s.series && comp.series) s.series = comp.series;
  }

  const allSeries = Array.from(seriesMap.values()).filter((s) => !s.teams.some((c) => c.team.abbreviation === "TBD"));

  const ROUND_ORDER = ["Play-In", "1st Round", "Conf. Semifinals", "Conf. Finals", "NBA Finals"];
  const grouped = ROUND_ORDER.map((r) => ({
    round: r,
    series: allSeries.filter((s) => s.round === r),
  })).filter((g) => g.series.length > 0);

  return (
    <div>
      <PageHeader title="Playoff Bracket" subtitle={`${seasonEndYear - 1}–${String(seasonEndYear).slice(2)} NBA Postseason`} />

      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-4 min-w-max">
          {grouped.map((g) => (
            <div key={g.round} className="w-72 shrink-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {g.round}
              </h2>
              <div className="space-y-3">
                {g.series.map((s) => (
                  <SeriesCard key={s.matchupKey + s.round} s={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeriesCard({ s }: { s: { round: string; conference: string; teams: Competition["competitors"]; series?: Competition["series"]; games: Event[] } }) {
  const wins = new Map<string, number>();
  for (const c of s.series?.competitors ?? []) wins.set(c.id, c.wins);
  const ranked = [...s.teams].sort((a, b) => (wins.get(b.id) ?? 0) - (wins.get(a.id) ?? 0));

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-3 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        {s.conference !== "Play-In" && s.conference !== "Finals" ? `${s.conference}ern Conference` : s.conference}
      </div>
      <div className="px-3 pb-3 pt-1">
        {ranked.map((c) => {
          const w = wins.get(c.id) ?? 0;
          const isLeader = ranked[0].id === c.id && w > (wins.get(ranked[1]?.id ?? "") ?? 0);
          return (
            <Link href={`/teams/${c.team.id}`} key={c.id} className="flex items-center gap-2 py-1.5 group">
              <TeamLogo team={c.team} size={28} />
              <span className={`flex-1 text-sm font-medium truncate ${isLeader ? "" : "text-foreground"}`}>
                {c.team.shortDisplayName}
              </span>
              <span className={`font-mono text-base font-bold tabular-nums ${isLeader ? "text-foreground" : "text-muted-foreground"}`}>
                {w}
              </span>
            </Link>
          );
        })}
      </div>
      {s.series?.summary && (
        <div className="px-3 py-1.5 border-t text-[11px] text-muted-foreground bg-muted/30">
          {s.series.summary}
        </div>
      )}
      <ul className="px-3 py-1.5 border-t text-[11px] divide-y divide-border/60">
        {s.games
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((g, i) => {
            const comp = g.competitions[0];
            const status = g.status ?? comp.status;
            const finished = status?.type?.completed;
            const winnerId = comp.competitors.find((c) => c.winner)?.team.id;
            return (
              <li key={g.id}>
                <Link href={`/games/${g.id}`} className="flex items-center justify-between py-1 hover:underline">
                  <span className="text-muted-foreground">G{i + 1} · {formatGameDate(g.date)}</span>
                  <span className="font-mono tabular-nums">
                    {finished
                      ? `${comp.competitors[0].team.abbreviation} ${comp.competitors[0].score}-${comp.competitors[1].score} ${comp.competitors[1].team.abbreviation}`
                      : status?.type?.shortDetail ?? ""}
                  </span>
                </Link>
                {finished && winnerId && <span className="sr-only">Winner: {winnerId}</span>}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function parseRound(headline: string): string {
  const h = headline.toLowerCase();
  if (h.includes("play-in")) return "Play-In";
  if (h.includes("nba finals") || h.includes("finals - game") && !h.includes("conf")) {
    if (h.includes("nba finals")) return "NBA Finals";
  }
  if (h.includes("conference finals") || h.includes("conf finals") || h.includes("conf. finals")) return "Conf. Finals";
  if (h.includes("semifinal") || h.includes("conf semis") || h.includes("2nd round")) return "Conf. Semifinals";
  if (h.includes("1st round") || h.includes("first round")) return "1st Round";
  if (h.includes("nba finals")) return "NBA Finals";
  return "1st Round";
}

function parseConference(headline: string): "East" | "West" | "Finals" | "Play-In" {
  const h = headline.toLowerCase();
  if (h.includes("play-in")) return "Play-In";
  if (h.includes("nba finals")) return "Finals";
  if (h.startsWith("east") || h.includes("eastern")) return "East";
  if (h.startsWith("west") || h.includes("western")) return "West";
  return "Finals";
}
