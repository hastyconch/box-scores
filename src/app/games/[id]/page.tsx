import { getGameSummary } from "@/lib/espn";
import { TeamLogo } from "@/components/team-logo";
import { athleteHeadshot, formatGameTime, formatLongDate } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 30;

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = await getGameSummary(id).catch(() => null);
  if (!summary?.header?.competitions?.[0]) notFound();

  const comp = summary.header.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === "home")!;
  const away = comp.competitors.find((c) => c.homeAway === "away")!;
  const state = comp.status?.type?.state ?? "pre";
  const isPre = state === "pre";

  const periods = Math.max(home.linescores?.length ?? 0, away.linescores?.length ?? 0, 4);

  return (
    <div>
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-block mb-3">
        ← Back
      </Link>

      <header className="rounded-2xl border bg-card p-5 mb-5">
        <div className="text-xs text-muted-foreground mb-2">
          {comp.notes?.[0]?.headline && <span>{comp.notes[0].headline} · </span>}
          {formatLongDate(comp.date)} · {summary.gameInfo?.venue?.fullName ?? ""}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamBlock c={away} align="left" />
          <ScoreBlock home={home} away={away} state={state} status={comp.status?.type?.detail ?? ""} startISO={comp.date} />
          <TeamBlock c={home} align="right" />
        </div>
      </header>

      {!isPre && (
        <Section title="Linescore">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-right">
                  <th className="text-left font-medium py-2 pr-2">Team</th>
                  {Array.from({ length: periods }).map((_, i) => (
                    <th key={i} className="font-medium px-2">
                      {i < 4 ? `Q${i + 1}` : `OT${i - 3}`}
                    </th>
                  ))}
                  <th className="font-semibold px-2 text-foreground">T</th>
                </tr>
              </thead>
              <tbody>
                {[away, home].map((c) => (
                  <tr key={c.id} className="border-t text-right tabular-nums">
                    <td className="py-2 pr-2 text-left">
                      <span className="inline-flex items-center gap-2">
                        <TeamLogo team={c.team} size={20} />
                        <span className="font-medium">{c.team.shortDisplayName}</span>
                      </span>
                    </td>
                    {Array.from({ length: periods }).map((_, i) => (
                      <td key={i} className="px-2">{c.linescores?.[i]?.value ?? "-"}</td>
                    ))}
                    <td className="px-2 font-bold">{c.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {summary.boxscore?.players?.map((teamBox, i) => (
        <Section key={i} title={`${teamBox.team.displayName}`}>
          <PlayerStats teamBox={teamBox} />
        </Section>
      ))}

      {summary.leaders && summary.leaders.length > 0 && (
        <Section title="Game Leaders">
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.leaders.map((tl, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TeamLogo team={tl.team} size={24} />
                  <span className="font-semibold text-sm">{tl.team.displayName}</span>
                </div>
                <div className="space-y-2">
                  {(tl.leaders ?? []).filter((l) => l.name !== "rating").map((l) => {
                    const top = l.leaders[0];
                    if (!top) return null;
                    return (
                      <div key={l.name} className="flex items-center gap-3">
                        <div className="text-[11px] uppercase font-semibold text-muted-foreground w-10">{l.name === "pointsRebounds" ? "PTS+REB" : l.displayName}</div>
                        <Image src={athleteHeadshot(top.athlete.id)} alt="" width={32} height={32} className="rounded-full bg-muted" unoptimized />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{top.athlete.displayName}</div>
                        </div>
                        <div className="text-sm font-mono font-semibold tabular-nums">{top.displayValue}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function TeamBlock({ c, align }: { c: import("@/lib/espn").Competitor; align: "left" | "right" }) {
  return (
    <Link href={`/teams/${c.team.id}`} className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
      <TeamLogo team={c.team} size={56} />
      <div>
        <div className="text-xs text-muted-foreground">{c.team.location}</div>
        <div className="text-lg font-bold leading-tight">{c.team.name ?? c.team.shortDisplayName}</div>
        {c.records?.[0]?.summary && <div className="text-xs text-muted-foreground">{c.records[0].summary}</div>}
      </div>
    </Link>
  );
}

function ScoreBlock({
  home,
  away,
  state,
  status,
  startISO,
}: {
  home: import("@/lib/espn").Competitor;
  away: import("@/lib/espn").Competitor;
  state: "pre" | "in" | "post";
  status: string;
  startISO: string;
}) {
  if (state === "pre") {
    return (
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase">Tipoff</div>
        <div className="text-xl font-semibold">{formatGameTime(startISO)}</div>
      </div>
    );
  }
  return (
    <div className="text-center px-2">
      <div className="flex items-center gap-3 text-3xl sm:text-4xl font-bold tabular-nums">
        <span className={away.winner === false ? "opacity-50" : ""}>{away.score}</span>
        <span className="text-muted-foreground text-xl">–</span>
        <span className={home.winner === false ? "opacity-50" : ""}>{home.score}</span>
      </div>
      <div className={`text-[11px] mt-1 font-semibold uppercase ${state === "in" ? "text-negative" : "text-muted-foreground"}`}>
        {state === "in" ? `● ${status}` : "Final"}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-2xl border bg-card p-4">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function PlayerStats({ teamBox }: { teamBox: NonNullable<NonNullable<import("@/lib/espn").GameSummary["boxscore"]>["players"]>[number] }) {
  const stat = teamBox.statistics?.[0];
  if (!stat) return <div className="text-sm text-muted-foreground">No stats yet.</div>;
  const labels = stat.labels;
  const players = stat.athletes;
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-xs sm:text-sm min-w-[640px]">
        <thead className="text-muted-foreground">
          <tr className="text-right">
            <th className="text-left font-medium py-2 pr-2">Player</th>
            {labels.map((l) => (
              <th key={l} className="font-medium px-1.5">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.athlete.id} className="border-t text-right tabular-nums">
              <td className="py-1.5 pr-2 text-left">
                <div className="flex items-center gap-2">
                  <Image
                    src={athleteHeadshot(p.athlete.id)}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded-full bg-muted shrink-0"
                    unoptimized
                  />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.athlete.shortName ?? p.athlete.displayName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {p.starter ? "Starter" : p.didNotPlay ? p.reason ?? "DNP" : ""}
                    </div>
                  </div>
                </div>
              </td>
              {labels.map((l, i) => (
                <td key={l} className="px-1.5">{p.didNotPlay ? "—" : (p.stats[i] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
