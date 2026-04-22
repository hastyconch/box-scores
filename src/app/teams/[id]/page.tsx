import { getTeam, getTeamRoster, getTeamSchedule } from "@/lib/espn";
import { TeamLogo } from "@/components/team-logo";
import { PageHeader } from "@/components/page-header";
import { GameCard } from "@/components/game-card";
import Link from "next/link";
import Image from "next/image";
import { athleteHeadshot } from "@/lib/format";
import { notFound } from "next/navigation";

export const revalidate = 600;

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [teamRes, scheduleRes, rosterRes] = await Promise.all([
    getTeam(id).catch(() => null),
    getTeamSchedule(id).catch(() => null),
    getTeamRoster(id).catch(() => null),
  ]);

  if (!teamRes?.team) notFound();
  const team = teamRes.team;
  const events = scheduleRes?.events ?? [];
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now).slice(0, 6);
  const recent = events.filter((e) => new Date(e.date).getTime() < now).slice(-6).reverse();

  const athletes = rosterRes?.athletes ?? [];

  return (
    <div>
      <Link href="/teams" className="text-sm text-muted-foreground hover:text-foreground inline-block mb-3">
        ← All teams
      </Link>
      <PageHeader
        title={team.displayName}
        subtitle={[team.standingSummary, team.recordSummary].filter(Boolean).join(" · ")}
        action={<TeamLogo team={team} size={64} />}
      />

      {upcoming.length > 0 && (
        <Section title="Upcoming">
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((e) => <GameCard key={e.id} event={e} />)}
          </div>
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Recent">
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((e) => <GameCard key={e.id} event={e} />)}
          </div>
        </Section>
      )}

      {athletes.length > 0 && (
        <Section title="Roster">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {athletes.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                <Image
                  src={a.headshot?.href ?? athleteHeadshot(a.id)}
                  alt=""
                  width={44}
                  height={44}
                  className="rounded-full bg-muted shrink-0"
                  unoptimized
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{a.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.jersey ? `#${a.jersey} · ` : ""}{a.position?.abbreviation ?? ""}
                    {a.displayHeight ? ` · ${a.displayHeight}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h2>
      {children}
    </section>
  );
}
