import { getScoreboard, parseYyyymmdd, todayYyyymmdd } from "@/lib/espn";
import { GameCard } from "@/components/game-card";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/empty";
import { DateStrip } from "@/components/date-strip";
import { CalendarPicker } from "@/components/calendar-picker";
import { DayNavigator } from "@/components/day-navigator";
import { RefreshButton } from "@/components/refresh-button";
import { formatLongDate } from "@/lib/format";

export const revalidate = 30;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const todayStr = todayYyyymmdd();
  const targetStr = date ?? todayStr;
  const targetDate = parseYyyymmdd(targetStr);
  const isToday = targetStr === todayStr;

  const sb = await getScoreboard(targetStr);
  const events = sb.events ?? [];
  const stateOf = (e: (typeof events)[number]) =>
    e.status?.type?.state ?? e.competitions[0]?.status?.type?.state;
  const live = events.filter((e) => stateOf(e) === "in");
  const upcoming = events.filter((e) => stateOf(e) === "pre");
  const finals = events.filter((e) => stateOf(e) === "post");

  const days: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(targetDate);
    d.setUTCDate(targetDate.getUTCDate() + i);
    days.push(d);
  }

  return (
    <DayNavigator date={targetStr}>
      <PageHeader
        title={isToday ? "Today's Games" : "Games"}
        subtitle={formatLongDate(targetDate.toISOString())}
        action={
          <div className="flex items-center gap-2">
            <RefreshButton />
            <CalendarPicker selected={targetStr} />
          </div>
        }
      />
      <DateStrip days={days} selected={targetStr} />

      <div className="mt-4">
        {events.length === 0 && (
          <Empty
            title="No games on this date"
            hint="Swipe or use ← → to browse days."
          />
        )}
        {live.length > 0 && (
          <Section label="Live">
            {live.map((e) => (
              <GameCard key={e.id} event={e} />
            ))}
          </Section>
        )}
        {upcoming.length > 0 && (
          <Section label={isToday ? "Upcoming" : "Scheduled"}>
            {upcoming.map((e) => (
              <GameCard key={e.id} event={e} />
            ))}
          </Section>
        )}
        {finals.length > 0 && (
          <Section label="Final">
            {finals.map((e) => (
              <GameCard key={e.id} event={e} />
            ))}
          </Section>
        )}
      </div>
    </DayNavigator>
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
