export function formatGameTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatGameDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(iso).toLocaleDateString([], opts);
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function teamLogo(team: { logo?: string; logos?: { href: string }[]; abbreviation?: string }): string {
  if (team.logo) return team.logo;
  if (team.logos && team.logos[0]?.href) return team.logos[0].href;
  if (team.abbreviation) return `https://a.espncdn.com/i/teamlogos/nba/500/${team.abbreviation.toLowerCase()}.png`;
  return "";
}

export function athleteHeadshot(id: string): string {
  return `https://a.espncdn.com/i/headshots/nba/players/full/${id}.png`;
}
