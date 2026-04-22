import { getScoreboard } from "@/lib/espn";
import { GameCard } from "@/components/game-card";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/empty";
import { formatLongDate } from "@/lib/format";
import Link from "next/link";

export const revalidate = 30;

export default async function HomePage() {
  const sb = await getScoreboard();
  const events = sb.events ?? [];
  const stateOf = (e: (typeof events)[number]) =>
    e.status?.type?.state ?? e.competitions[0]?.status?.type?.state;
  const live = events.filter((e) => stateOf(e) === "in");
  const upcoming = events.filter((e) => stateOf(e) === "pre");
  const finals = events.filter((e) => stateOf(e) === "post");

  const today = new Date();
  return (
    <div>
      <PageHeader
        title="Today's Games"
        subtitle={formatLongDate(today.toISOString())}
        action={
          <Link
            href="/schedule"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Schedule →
          </Link>
        }
      />

      {events.length === 0 && (
        <Empty
          title="No games today"
          hint="Check the schedule for upcoming matchups."
        />
      )}

      {live.length > 0 && <Section label="Live">{live.map((e) => <GameCard key={e.id} event={e} />)}</Section>}
      {upcoming.length > 0 && <Section label="Upcoming">{upcoming.map((e) => <GameCard key={e.id} event={e} />)}</Section>}
      {finals.length > 0 && <Section label="Final">{finals.map((e) => <GameCard key={e.id} event={e} />)}</Section>}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}
