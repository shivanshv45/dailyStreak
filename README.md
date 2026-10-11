<div align="center">

<img src="src/app/icon.png" alt="dStreak" width="96" />

# dStreak

**Show up. Every day.**
A streak board for anything. No feed, no friends, just you and your goals.

![Next.js](https://img.shields.io/badge/Next.js_16-141414?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_4-ff6fb1?style=flat-square&logo=tailwindcss&logoColor=white)
![Neon](https://img.shields.io/badge/Neon_Postgres-6f8f4e?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-9b5bd4?style=flat-square&logo=prisma&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_+_Gemini-ff7a2f?style=flat-square)

</div>

---

## What it is

Add the things you want to do, check them off, and watch the streaks stack up. Pick how strict each task is when you create it:

| | |
|---|---|
| **Tick it** | one tap and it's done |
| **Proof** | upload a screenshot and an AI checks it against what "done" means. Locked once created, so you can't go easy on yourself later |

Tasks repeat **daily, weekly, monthly, or every N days**. The board only shows what's due today, so a weekly task doesn't nag you every morning.

## Highlights

- **Paper-note board.** Pastel sticky notes in each task's color, taped to a dotted canvas, with a punch-card row for the last 7 days.
- **Proof mode.** Drag, paste or pick a screenshot. Groq (Llama 4 Scout) judges it, Gemini is the fallback. Images are never stored.
- **Real stats.** Year heatmap, consistency trend, weekday pattern, and a detail page for every task with its own history.
- **Tier list.** Climb from Noob to Mythic based on how consistent you actually are, not how long you've had the app.
- **Archive or delete.** Archive keeps all history, delete wipes it.
- **Timezone aware.** "Today" means your today.

## The ladder

![Noob](https://img.shields.io/badge/Noob-8a8580?style=for-the-badge)
![Rookie](https://img.shields.io/badge/Rookie-6f8f4e?style=for-the-badge)
![Grinder](https://img.shields.io/badge/Grinder-3d7fd6?style=for-the-badge)
![Pro](https://img.shields.io/badge/Pro-9b5bd4?style=for-the-badge)
![Veteran](https://img.shields.io/badge/Veteran-ff7a2f?style=for-the-badge)
![Master](https://img.shields.io/badge/Master-ff6fb1?style=for-the-badge)
![Grandmaster](https://img.shields.io/badge/Grandmaster-e8a723?style=for-the-badge)
![Legendary](https://img.shields.io/badge/Legendary-d63384?style=for-the-badge)
![Mythic](https://img.shields.io/badge/Mythic-141414?style=for-the-badge)

Your tier is the highest one where you meet **both** its all-time check-in count and its last-30-day consistency, so it follows your current form. Thresholds live in [`src/lib/ranks.ts`](src/lib/ranks.ts).

## Run it

You need Node 22+, a free [Neon](https://neon.com) project with **Neon Auth** enabled, and free API keys from [Groq](https://console.groq.com) and [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm install
```

Create `.env.local`:

```bash
DATABASE_URL=            # Neon connection string
NEON_AUTH_BASE_URL=      # Neon Console > Better Auth > Project Info
NEON_AUTH_COOKIE_SECRET= # openssl rand -base64 32
GROQ_API_KEY=
GEMINI_API_KEY=
```

```bash
npx prisma migrate dev   # create the tables
npm run dev              # http://localhost:3000
```

## Deploy (Vercel)

1. Import the repo and add the five environment variables above to **Production** and **Preview**. The build needs them, not just the running app.
2. In the Neon Console, add your Vercel domain under **Better Auth > Domains** so sign-in redirects are allowed.
3. Run `npx prisma migrate deploy` once against the production database.

Dependencies install runs `prisma generate` automatically, so there is no extra build step.

## Under the hood

```
src/
  app/          routes: board, /profile (stats), /ranks, /settings, /api/verify
  components/   task notes, charts, shell, rank card
  lib/
    streaks.ts    streaks and completion, per day / week / month / round
    schedule.ts   what's due today vs later
    stats.ts      heatmap, trends, per-task numbers
    ranks.ts      the tier ladder
    verify/       Groq first, Gemini fallback
prisma/         schema and migrations
```

Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion, Recharts, Prisma 7, Neon Auth, `groq-sdk`, `@google/genai`.

## Colors

| | Name | Hex |
|---|---|---|
| ![](https://img.shields.io/badge/-%20%20%20-ff6fb1?style=flat-square) | Pink | `#ff6fb1` |
| ![](https://img.shields.io/badge/-%20%20%20-9b5bd4?style=flat-square) | Purple | `#9b5bd4` |
| ![](https://img.shields.io/badge/-%20%20%20-ff7a2f?style=flat-square) | Orange | `#ff7a2f` |
| ![](https://img.shields.io/badge/-%20%20%20-fcefe4?style=flat-square) | Peach (sidebar) | `#fcefe4` |
| ![](https://img.shields.io/badge/-%20%20%20-faf8f5?style=flat-square) | Paper (canvas) | `#faf8f5` |
| ![](https://img.shields.io/badge/-%20%20%20-141414?style=flat-square) | Ink | `#141414` |

Type: **Urbanist** for headlines, **Inter** for text, **Caveat** for the handwritten bits.
