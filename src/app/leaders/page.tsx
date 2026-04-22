import { dereferenceCore, getLeaders, type CoreAthlete, type Team } from "@/lib/espn";
import { TeamLogo } from "@/components/team-logo";
import { PageHeader } from "@/components/page-header";
import { athleteHeadshot } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 3600;

const FEATURED = [
  "pointsPerGame",
  "assistsPerGame",
  "reboundsPerGame",
  "stealsPerGame",
  "blocksPerGame",
  "3PointsMadePerGame",
  "fieldGoalPercentage",
  "3PointPct",
];

type EnrichedLeader = {
  displayValue: string;
  value: number;
  athlete: CoreAthlete | null;
  team: Team | null;
};

export default async function LeadersPage() {
  // Try current postseason first; ESPN returns sparse data for postseason early on,
  // so fall back to the regular season if a category is empty.
  const season = currentSeasonYear();
  const [postLeaders, regLeaders] = await Promise.all([
    getLeaders(season, 3).catch(() => null),
    getLeaders(season, 2).catch(() => null),
  ]);

  const sourceList = [postLeaders, regLeaders].filter(Boolean) as NonNullable<typeof regLeaders>[];

  const cards = await Promise.all(
    FEATURED.map(async (catName) => {
      let cat: (typeof sourceList)[number]["categories"][number] | undefined;
      let sourceLabel = "";
      for (const src of sourceList) {
        const c = src.categories.find((x) => x.name === catName);
        if (c && c.leaders.length > 0) {
          cat = c;
          sourceLabel = src === postLeaders ? "Postseason" : "Regular Season";
          break;
        }
      }
      if (!cat) return null;
      const top = cat.leaders.slice(0, 5);
      const enriched: EnrichedLeader[] = await Promise.all(
        top.map(async (l) => {
          const [athlete, team] = await Promise.all([
            dereferenceCore<CoreAthlete>(l.athlete.$ref).catch(() => null),
            dereferenceCore<Team>(l.team.$ref).catch(() => null),
          ]);
          return { displayValue: l.displayValue, value: l.value, athlete, team };
        })
      );
      return { name: cat.displayName, abbr: cat.abbreviation ?? cat.shortDisplayName ?? "", leaders: enriched, source: sourceLabel };
    })
  );

  return (
    <div>
      <PageHeader title="Leaders" subtitle="Top performers across the league" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.filter(Boolean).map((card) => (
          <LeaderCard key={card!.name} {...card!} />
        ))}
      </div>
    </div>
  );
}

function LeaderCard({ name, abbr, leaders, source }: { name: string; abbr: string; leaders: EnrichedLeader[]; source: string }) {
  return (
    <section className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{source}</div>
          <h3 className="font-semibold text-sm">{name}</h3>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">{abbr}</span>
      </div>
      <ul className="divide-y">
        {leaders.map((l, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-xs font-mono text-muted-foreground w-4 text-right">{i + 1}</span>
            {l.athlete && (
              <Image src={l.athlete.headshot?.href ?? athleteHeadshot(l.athlete.id)} alt="" width={36} height={36} className="rounded-full bg-muted shrink-0" unoptimized />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{l.athlete?.displayName ?? "—"}</div>
              {l.team && (
                <Link href={`/teams/${l.team.id}`} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                  <TeamLogo team={l.team} size={12} />
                  {l.team.abbreviation}
                </Link>
              )}
            </div>
            <span className="font-mono font-semibold tabular-nums text-sm">{l.displayValue}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function currentSeasonYear(): number {
  const now = new Date();
  // NBA season spans Oct -> June. Year tag = ending year.
  const m = now.getMonth();
  return m >= 9 ? now.getFullYear() + 1 : now.getFullYear();
}
