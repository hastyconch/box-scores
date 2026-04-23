import { getScoreboard, type Competition } from "@/lib/espn";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/empty";
import { BracketView, type RoundGroup, type Series } from "./bracket-view";

export const revalidate = 600;

export default async function PlayoffsPage() {
  const today = new Date();
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

  const allSeries = Array.from(seriesMap.values()).filter(
    (s) => !s.teams.some((c: Competition["competitors"][number]) => c.team.abbreviation === "TBD")
  );

  const CONF_ROUNDS = ["Conf. Finals", "Conf. Semifinals", "1st Round", "Play-In"];
  const byConf = (conf: "East" | "West"): RoundGroup[] =>
    CONF_ROUNDS.map((r) => ({
      round: r,
      series: allSeries.filter((s) => s.conference === conf && s.round === r),
    })).filter((g) => g.series.length > 0);

  const east = byConf("East");
  const west = byConf("West");
  const finals = allSeries.filter((s) => s.round === "NBA Finals");

  return (
    <div>
      <PageHeader
        title="Playoff Bracket"
        subtitle={`${seasonEndYear - 1}–${String(seasonEndYear).slice(2)} NBA Postseason`}
      />
      <BracketView east={east} west={west} finals={finals} />
    </div>
  );
}

function parseRound(headline: string): string {
  const h = headline.toLowerCase();
  if (h.includes("play-in")) return "Play-In";
  if (h.includes("nba finals")) return "NBA Finals";
  if (h.includes("conference finals") || h.includes("conf finals") || h.includes("conf. finals"))
    return "Conf. Finals";
  if (h.includes("semifinal") || h.includes("conf semis") || h.includes("2nd round"))
    return "Conf. Semifinals";
  if (h.includes("1st round") || h.includes("first round")) return "1st Round";
  return "1st Round";
}

function parseConference(headline: string): "East" | "West" | "Finals" {
  const h = headline.toLowerCase();
  if (h.includes("nba finals")) return "Finals";
  if (/\beast(ern)?\b/.test(h)) return "East";
  if (/\bwest(ern)?\b/.test(h)) return "West";
  return "Finals";
}
