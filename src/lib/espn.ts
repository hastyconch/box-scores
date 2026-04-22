/**
 * Thin wrapper around ESPN's public NBA endpoints. No auth required.
 * Responses are cached at the fetch layer; per-call `revalidate` controls freshness.
 */

const SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const SITE_WEB = "https://site.web.api.espn.com/apis/v2/sports/basketball/nba";
const CORE = "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba";

type FetchOpts = { revalidate?: number };

async function getJson<T>(url: string, { revalidate = 60 }: FetchOpts = {}): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    throw new Error(`ESPN ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

export function yyyymmdd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function parseYyyymmdd(s: string): Date {
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6)) - 1;
  const d = Number(s.slice(6, 8));
  return new Date(Date.UTC(y, m, d));
}

/** Scoreboard for a given date (or today if undefined). Short cache for live games. */
export function getScoreboard(dateYyyymmdd?: string) {
  const url = dateYyyymmdd ? `${SITE}/scoreboard?dates=${dateYyyymmdd}` : `${SITE}/scoreboard`;
  return getJson<Scoreboard>(url, { revalidate: 30 });
}

export function getGameSummary(eventId: string) {
  return getJson<GameSummary>(`${SITE}/summary?event=${eventId}`, { revalidate: 30 });
}

export function getTeams() {
  return getJson<TeamsResponse>(`${SITE}/teams`, { revalidate: 60 * 60 });
}

export function getTeam(teamId: string) {
  return getJson<TeamResponse>(`${SITE}/teams/${teamId}`, { revalidate: 60 * 60 });
}

export function getTeamSchedule(teamId: string) {
  return getJson<TeamScheduleResponse>(`${SITE}/teams/${teamId}/schedule`, { revalidate: 60 * 5 });
}

export function getTeamRoster(teamId: string) {
  return getJson<TeamRosterResponse>(`${SITE}/teams/${teamId}/roster`, { revalidate: 60 * 60 });
}

export function getStandings() {
  return getJson<StandingsResponse>(`${SITE_WEB}/standings?level=3`, { revalidate: 60 * 5 });
}

export function getLeaders(season: number, seasontype: number = 2) {
  return getJson<CoreLeadersResponse>(
    `${CORE}/seasons/${season}/types/${seasontype}/leaders`,
    { revalidate: 60 * 60 }
  );
}

export function getAthlete(athleteId: string) {
  return getJson<CoreAthlete>(
    `${CORE}/athletes/${athleteId}`,
    { revalidate: 60 * 60 * 6 }
  );
}

export function dereferenceCore<T>($ref: string) {
  // ESPN $ref URLs are http but support https
  const url = $ref.replace(/^http:\/\//, "https://");
  return getJson<T>(url, { revalidate: 60 * 60 });
}

/* ------- Types: only the fields we use, kept loose so the schema can drift. ------- */

export type Logo = { href: string; width?: number; height?: number; rel?: string[] };

export type Team = {
  id: string;
  uid?: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  name?: string;
  location?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
  logos?: Logo[];
  recordSummary?: string;
  standingSummary?: string;
};

export type Competitor = {
  id: string;
  homeAway: "home" | "away";
  score?: string;
  winner?: boolean;
  team: Team;
  records?: { name: string; summary: string }[];
  linescores?: { value: number }[];
  statistics?: { name: string; abbreviation?: string; displayValue: string }[];
  leaders?: {
    name: string;
    displayName: string;
    leaders: {
      displayValue: string;
      value: number;
      athlete: { id: string; displayName: string; shortName?: string; headshot?: string; jersey?: string; position?: { abbreviation?: string } };
    }[];
  }[];
};

export type Status = {
  clock?: number;
  displayClock?: string;
  period?: number;
  type: { id: string; state: "pre" | "in" | "post"; completed: boolean; description: string; detail: string; shortDetail: string };
};

export type Event = {
  id: string;
  uid?: string;
  date: string;
  name: string;
  shortName: string;
  status?: Status;
  competitions: Competition[];
};

export type Competition = {
  id: string;
  date: string;
  venue?: { fullName?: string; address?: { city?: string; state?: string } };
  competitors: Competitor[];
  status?: Status;
  notes?: { type?: string; headline?: string }[];
  series?: {
    type?: string;
    title?: string;
    summary?: string;
    competitors?: { id: string; wins: number }[];
  };
};

export type Scoreboard = {
  leagues?: {
    season?: { year: number; type: { id: string; type: number; name: string; abbreviation: string } };
    calendar?: { label: string; value: string; entries?: { label: string; alternateLabel?: string; detail?: string; value: string; startDate: string; endDate: string }[] }[];
  }[];
  day?: { date: string };
  events: Event[];
};

export type GameSummary = {
  header?: {
    id?: string;
    competitions: Competition[];
    season?: { year: number; type: number };
  };
  boxscore?: {
    teams?: { team: Team; statistics: { name: string; displayValue: string; label: string }[] }[];
    players?: {
      team: Team;
      statistics: {
        names: string[];
        keys: string[];
        labels: string[];
        descriptions?: string[];
        athletes: {
          active?: boolean;
          starter?: boolean;
          didNotPlay?: boolean;
          reason?: string;
          stats: string[];
          athlete: { id: string; displayName: string; shortName: string; headshot?: { href: string }; jersey?: string; position?: { abbreviation?: string } };
        }[];
      }[];
    }[];
  };
  gameInfo?: {
    venue?: { fullName?: string; address?: { city?: string; state?: string } };
    attendance?: number;
  };
  leaders?: { team: Team; leaders: Competitor["leaders"] }[];
};

export type TeamsResponse = {
  sports: { leagues: { teams: { team: Team }[] }[] }[];
};

export type TeamResponse = {
  team: Team & {
    nextEvent?: Event[];
    record?: { items: { summary: string; stats?: { name: string; value: number }[] }[] };
  };
};

export type TeamScheduleResponse = {
  team: Team;
  events: Event[];
  requestedSeason?: { year: number; type: number; name: string };
};

export type TeamRosterResponse = {
  team: Team;
  athletes: {
    id: string;
    displayName: string;
    fullName?: string;
    jersey?: string;
    position?: { abbreviation?: string; displayName?: string };
    height?: number;
    displayHeight?: string;
    weight?: number;
    displayWeight?: string;
    age?: number;
    headshot?: { href: string };
  }[];
};

export type StandingsEntry = {
  team: Team;
  stats: { name: string; type?: string; abbreviation?: string; displayName?: string; displayValue: string; value?: number }[];
};

export type StandingsGroup = {
  id: string;
  name: string;
  abbreviation?: string;
  isConference?: boolean;
  standings?: { entries: StandingsEntry[] };
  children?: StandingsGroup[];
};

export type StandingsResponse = StandingsGroup;

export type CoreLeadersResponse = {
  categories: {
    name: string;
    displayName: string;
    shortDisplayName?: string;
    abbreviation?: string;
    leaders: {
      displayValue: string;
      value: number;
      athlete: { $ref: string };
      team: { $ref: string };
    }[];
  }[];
};

export type CoreAthlete = {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  jersey?: string;
  position?: { abbreviation?: string; displayName?: string };
  team?: { $ref: string };
  headshot?: { href: string };
};
