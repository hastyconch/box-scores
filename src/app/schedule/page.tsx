import { getScoreboard, yyyymmdd, parseYyyymmdd } from "@/lib/espn";
import { GameCard } from "@/components/game-card";
import { PageHeader } from "@/components/page-header";
import { Empty } from "@/components/empty";
import { DateStrip } from "@/components/date-strip";
import { formatLongDate } from "@/lib/format";

export const revalidate = 60;

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = new Date();
  const targetDate = date ? parseYyyymmdd(date) : today;
  const targetStr = yyyymmdd(targetDate);

  const sb = await getScoreboard(targetStr);
  const events = sb.events ?? [];

  // 7 days centered around target
  const days: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(targetDate);
    d.setUTCDate(targetDate.getUTCDate() + i);
    days.push(d);
  }

  return (
    <div>
      <PageHeader title="Schedule" subtitle={formatLongDate(targetDate.toISOString())} />
      <DateStrip days={days} selected={targetStr} />

      {events.length === 0 ? (
        <Empty title="No games on this date" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
          {events.map((e) => <GameCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}
