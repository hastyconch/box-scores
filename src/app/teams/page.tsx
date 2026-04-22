import { getTeams } from "@/lib/espn";
import { TeamLogo } from "@/components/team-logo";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

export const revalidate = 3600;

export default async function TeamsPage() {
  const data = await getTeams();
  const teams = data.sports[0]?.leagues[0]?.teams.map((t) => t.team) ?? [];
  teams.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div>
      <PageHeader title="Teams" subtitle={`${teams.length} NBA franchises`} />
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {teams.map((t) => (
          <Link
            key={t.id}
            href={`/teams/${t.id}`}
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl border bg-card hover:border-foreground/20 transition-colors"
          >
            <TeamLogo team={t} size={56} />
            <div className="text-sm font-semibold text-center leading-tight">{t.shortDisplayName}</div>
            <div className="text-[11px] text-muted-foreground">{t.abbreviation}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
