import { getStandings, type StandingsEntry, type StandingsGroup } from "@/lib/espn";
import { TeamLogo } from "@/components/team-logo";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

export const revalidate = 600;

export default async function StandingsPage() {
  const tree = await getStandings();
  const conferences = tree.children ?? [];

  return (
    <div>
      <PageHeader title="Standings" subtitle="Conference rankings" />
      <div className="grid gap-6 lg:grid-cols-2">
        {conferences.map((conf) => (
          <ConferenceTable key={conf.id} conf={conf} />
        ))}
      </div>
    </div>
  );
}

function ConferenceTable({ conf }: { conf: StandingsGroup }) {
  // Flatten divisions to one ranked list (ESPN sorts within divisions; we re-sort by playoff seed).
  const entries: StandingsEntry[] = (conf.children ?? []).flatMap(
    (d) => d.standings?.entries ?? []
  );
  entries.sort((a, b) => seed(a) - seed(b));

  return (
    <section className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold">{conf.name}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="text-muted-foreground bg-muted/50">
            <tr className="text-right">
              <th className="text-left font-medium py-2 pl-3 pr-2">#</th>
              <th className="text-left font-medium py-2 pr-2">Team</th>
              <th className="font-medium px-2">W</th>
              <th className="font-medium px-2">L</th>
              <th className="font-medium px-2">PCT</th>
              <th className="font-medium px-2">GB</th>
              <th className="font-medium px-2">L10</th>
              <th className="font-medium px-3">STRK</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const inPlay = seed(e) <= 6;
              const inPlayIn = seed(e) > 6 && seed(e) <= 10;
              return (
                <tr key={e.team.id} className="border-t tabular-nums text-right">
                  <td className="py-2 pl-3 pr-2 text-left">
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[11px] font-semibold ${
                      inPlay ? "bg-positive/15 text-positive" : inPlayIn ? "bg-accent/15 text-accent" : "text-muted-foreground"
                    }`}>{i + 1}</span>
                  </td>
                  <td className="py-2 pr-2 text-left">
                    <Link href={`/teams/${e.team.id}`} className="inline-flex items-center gap-2 hover:underline">
                      <TeamLogo team={e.team} size={20} />
                      <span className="font-medium truncate">{e.team.shortDisplayName}</span>
                    </Link>
                  </td>
                  <td className="px-2">{stat(e, "wins")}</td>
                  <td className="px-2">{stat(e, "losses")}</td>
                  <td className="px-2">{stat(e, "winPercent")}</td>
                  <td className="px-2">{stat(e, "gamesBehind")}</td>
                  <td className="px-2">{stat(e, "Last Ten Games")}</td>
                  <td className="px-3">{stat(e, "streak")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t text-[11px] text-muted-foreground flex gap-3">
        <span><span className="inline-block h-2 w-2 rounded bg-positive mr-1" />Playoffs</span>
        <span><span className="inline-block h-2 w-2 rounded bg-accent mr-1" />Play-In</span>
      </div>
    </section>
  );
}

function stat(e: StandingsEntry, name: string): string {
  const s = e.stats.find((x) => x.name === name || x.displayName === name);
  return s?.displayValue ?? "-";
}

function seed(e: StandingsEntry): number {
  const s = e.stats.find((x) => x.name === "playoffSeed");
  return s?.value ?? 99;
}
