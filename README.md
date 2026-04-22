# Box Scores

A clean, fast, mobile-first NBA app. Today's games front and center, no autoplay videos, no clutter.

## Stack

- Next.js 16 (App Router) on Vercel
- React 19, TypeScript, Tailwind CSS v4
- ESPN's public NBA endpoints (no API key)

## Pages

- `/` Today's games (live / upcoming / final)
- `/games/[id]` Box score (linescore, player stats, leaders)
- `/schedule` Date-based schedule
- `/teams` All 30 teams
- `/teams/[id]` Team page (upcoming, recent, roster)
- `/standings` Conference standings with playoff / play-in markers
- `/leaders` Stat leaders (PPG, AST, REB, STL, BLK, 3PM, FG%, 3P%)
- `/playoffs` Playoff bracket grouped by round

## Develop

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deploy

```bash
vercel
```
