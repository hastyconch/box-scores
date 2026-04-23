"use client";

import { useState } from "react";
import Link from "next/link";
import { TeamLogo } from "@/components/team-logo";
import { formatGameDate } from "@/lib/format";
import type { Event, Competition } from "@/lib/espn";

export type Series = {
  round: string;
  conference: "East" | "West" | "Finals";
  matchupKey: string;
  teams: Competition["competitors"];
  series?: Competition["series"];
  games: Event[];
};

export type RoundGroup = { round: string; series: Series[] };

type Props = {
  east: RoundGroup[];
  west: RoundGroup[];
  finals: Series[];
};

export function BracketView({ east, west, finals }: Props) {
  const defaultTab: "East" | "West" =
    east.length === 0 && west.length > 0 ? "West" : "East";
  const [tab, setTab] = useState<"East" | "West">(defaultTab);
  const mobileRounds = tab === "East" ? east : west;

  return (
    <>
      {/* Mobile: segmented tabs + single conference */}
      <div className="md:hidden">
        <div className="sticky top-14 z-20 -mx-4 bg-background/90 px-4 pt-1 pb-3 backdrop-blur">
          <div
            role="tablist"
            aria-label="Conference"
            className="flex rounded-full border bg-muted/40 p-1"
          >
            <TabButton
              active={tab === "East"}
              onClick={() => setTab("East")}
              disabled={east.length === 0}
            >
              Eastern
            </TabButton>
            <TabButton
              active={tab === "West"}
              onClick={() => setTab("West")}
              disabled={west.length === 0}
            >
              Western
            </TabButton>
          </div>
        </div>
        {mobileRounds.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No series yet for this conference.
          </p>
        ) : (
          <RoundsList rounds={mobileRounds} />
        )}
      </div>

      {/* Desktop: side-by-side columns */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        <ConferenceColumn label="Eastern Conference" rounds={east} />
        <ConferenceColumn label="Western Conference" rounds={west} />
      </div>

      {finals.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold mb-3 text-center uppercase tracking-wider">
            NBA Finals
          </h2>
          <div className="max-w-md mx-auto space-y-3">
            {finals.map((s) => (
              <SeriesCard key={`${s.conference}-${s.round}-${s.matchupKey}`} s={s} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-full py-1.5 text-sm font-medium transition ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      } disabled:opacity-40 disabled:pointer-events-none`}
    >
      {children}
    </button>
  );
}

function ConferenceColumn({ label, rounds }: { label: string; rounds: RoundGroup[] }) {
  if (rounds.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold mb-3">{label}</h2>
      <RoundsList rounds={rounds} />
    </section>
  );
}

function RoundsList({ rounds }: { rounds: RoundGroup[] }) {
  return (
    <div className="space-y-5">
      {rounds.map((g) => (
        <div key={g.round}>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {g.round}
          </h3>
          <div className="space-y-3">
            {g.series.map((s) => (
              <SeriesCard key={`${s.conference}-${s.round}-${s.matchupKey}`} s={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeriesCard({ s }: { s: Series }) {
  if (s.round === "Play-In") return <PlayInCard s={s} />;

  const wins = new Map<string, number>();
  for (const c of s.series?.competitors ?? []) wins.set(c.id, c.wins);
  const ranked = [...s.teams].sort((a, b) => (wins.get(b.id) ?? 0) - (wins.get(a.id) ?? 0));
  const leaderId = ranked[0]?.id;
  const leaderWins = wins.get(leaderId ?? "") ?? 0;
  const runnerWins = wins.get(ranked[1]?.id ?? "") ?? 0;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="px-3 py-2">
        {ranked.map((c) => {
          const w = wins.get(c.id) ?? 0;
          const isLeader = c.id === leaderId && leaderWins > runnerWins;
          return (
            <Link
              href={`/teams/${c.team.id}`}
              key={c.id}
              className="flex items-center gap-2 py-1.5"
            >
              <TeamLogo team={c.team} size={28} />
              <span className="flex-1 text-sm font-medium truncate">
                {c.team.shortDisplayName}
              </span>
              <span
                className={`font-mono text-base font-bold tabular-nums ${
                  isLeader ? "text-foreground" : "text-muted-foreground"
                }`}
              >
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
          .slice()
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((g, i) => {
            const comp = g.competitions[0];
            const status = g.status ?? comp.status;
            const finished = status?.type?.completed;
            return (
              <li key={g.id}>
                <Link
                  href={`/games/${g.id}`}
                  className="flex items-center justify-between py-1 hover:underline"
                >
                  <span className="text-muted-foreground">
                    G{i + 1} · {formatGameDate(g.date)}
                  </span>
                  <span className="font-mono tabular-nums">
                    {finished
                      ? `${comp.competitors[0].team.abbreviation} ${comp.competitors[0].score}-${comp.competitors[1].score} ${comp.competitors[1].team.abbreviation}`
                      : status?.type?.shortDetail ?? ""}
                  </span>
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function PlayInCard({ s }: { s: Series }) {
  const game = s.games[0];
  if (!game) return null;
  const comp = game.competitions[0];
  const status = game.status ?? comp.status;
  const finished = status?.type?.completed;
  const sorted = [...comp.competitors].sort(
    (a, b) => Number(b.score ?? 0) - Number(a.score ?? 0)
  );
  const winnerId =
    finished && sorted[0] && sorted[1] && sorted[0].score !== sorted[1].score
      ? sorted[0].id
      : null;

  return (
    <Link
      href={`/games/${game.id}`}
      className="block rounded-2xl border bg-card overflow-hidden hover:bg-muted/30 transition"
    >
      <div className="px-3 py-2">
        {comp.competitors.map((c) => {
          const isWinner = c.id === winnerId;
          const dim = finished && winnerId && !isWinner;
          return (
            <div key={c.id} className="flex items-center gap-2 py-1.5">
              <TeamLogo team={c.team} size={28} />
              <span
                className={`flex-1 text-sm font-medium truncate ${
                  dim ? "text-muted-foreground" : ""
                }`}
              >
                {c.team.shortDisplayName}
              </span>
              {finished && (
                <span
                  className={`font-mono text-base font-bold tabular-nums ${
                    isWinner || !winnerId ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {c.score}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-3 py-1.5 border-t text-[11px] text-muted-foreground bg-muted/30 flex items-center justify-between">
        <span>{formatGameDate(game.date)}</span>
        <span>{finished ? "Final" : status?.type?.shortDetail ?? ""}</span>
      </div>
    </Link>
  );
}
