import Image from "next/image";
import { teamLogo } from "@/lib/format";
import type { Team } from "@/lib/espn";

export function TeamLogo({
  team,
  size = 40,
  className = "",
}: {
  team: Team;
  size?: number;
  className?: string;
}) {
  const src = teamLogo(team);
  if (!src) {
    return (
      <div
        className={`rounded-full bg-muted flex items-center justify-center text-xs font-semibold ${className}`}
        style={{ width: size, height: size }}
      >
        {team.abbreviation ?? "?"}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={`${team.displayName} logo`}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      unoptimized
    />
  );
}
