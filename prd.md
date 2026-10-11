# DailyStreak — PRD

## 1. Product
A personal streak board for any daily habit. There are no social features, feeds or integrations. You add a task, show up each day and check it off.

**Principles**
- Lightweight: fast first load, few dependencies, no realtime features.
- Show, don't explain: the UI has headings, numbers and visuals, with no explanatory paragraphs under headings. Text appears only where an action needs it (for example, an error).
- Keep checking in satisfying: completing a task should feel rewarding.

## 2. Users & Auth
- Auth uses **Neon Auth** (managed Better Auth) via `@neondatabase/auth`.
- Sign up and log in with email and password. There is no email verification in v1. Google OAuth can be enabled later in the Neon Console.
- Neon Auth handles password hashing and sessions. We write no auth code of our own beyond the forms.
- Auth users live in Neon's auth tables (exact location to confirm during setup). App data references the user by `userId` (a string, with no cross-schema foreign key).
- Each user has a `Profile` row in our own schema that stores an IANA timezone, detected at first login and editable in settings. All "today" logic uses that timezone.
- Known limitation: password reset is deferred to after v1.

## 3. Tasks
Fields set at creation:
| Field | Required | Notes |
|---|---|---|
| title | yes | ≤ 60 chars |
| description | no | one line, ≤ 120 chars |
| doneCriteria ("what counts as done") | no | ≤ 200 chars; this is the AI's main reference |
| mode | yes | `normal` or `proof`, **locked after creation** |
| color / emoji | no | visual identity on the board |

- Title, description, color and emoji stay editable. Mode can't change, and doneCriteria is locked for proof-mode tasks so nobody can loosen the rule later.
- Tasks can be archived, which hides them while keeping their history. Deleting a task removes everything after a confirmation.
- Proof-mode tasks show a small lock/shield badge everywhere.

## 4. Daily check-in
**Normal mode:** tap the card and it's done for today. Tapping again within the same day undoes it.

**Proof mode:**
1. The user taps the card and is offered upload, paste (Ctrl+V) or drag-and-drop for a screenshot.
2. The client compresses the image (max 1280px, JPEG about 0.8 quality) and sends it to `POST /api/verify`.
3. The server sends the image plus title, description and doneCriteria to the vision model and asks for strict JSON: `{ verdict: "pass" | "fail", confidence: 0–1, reason: string }`.
4. On a pass, the check-in is marked `verified`. On a fail, a short reason is shown and the user can retry until the day ends in their timezone.
5. **The image is never stored.** It is held in memory for the request and then discarded. Only the verdict, reason and timestamp are saved.

Verifier prompt rules: judge only against the given task, and reject unrelated, blank or obviously stock images. When doneCriteria is empty, judge plausibility from the title and description. When the screenshot shows a visible date, a date that clearly isn't today is a fail.

Limits: at most 10 verify attempts per task per day, and a max upload of 4 MB.

Only today can be checked, with no backfilling.

## 5. AI provider
- **Primary: Groq**, model `meta-llama/llama-4-scout-17b-16e-instruct` (vision, free tier, JSON mode).
- **Fallback: Google Gemini Flash** (free tier, vision), used when Groq returns errors or rate-limit responses.
- Both sit behind one interface, `verifyProof(image, task) → Verdict`, in `lib/verify/`.

## 6. Dashboard (Board) — `/`
- Today's date with "X / Y done" and a progress ring.
- A grid of task cards. Each card shows the emoji/colour, title, current streak (🔥 n), a 7-day dot strip and its state (todo / done / verified).
- Animations: the card fills with its colour, the checkmark draws in, the streak counter ticks up, and a small burst plays when every task for the day is done. All of these respect `prefers-reduced-motion`.
- Undone tasks are listed first and finished ones drop lower.
- An "Add task" card opens a modal. When proof mode is selected, the modal asks the user to confirm that the mode can't be changed later.

## 7. Profile / Stats — `/profile`
- **Overview tiles:** current best streak, longest streak ever, 30-day completion %, total check-ins.
- **Year heatmap** (GitHub-style): one cell per day, shaded by the share of tasks completed that day.
- **Consistency trend:** rolling 7-day completion % as a line chart.
- **Weekday pattern:** completion % by day of the week, with the weakest day highlighted.
- **Per-task rows:** current and longest streak, a 30-day sparkline, completion %, and the proof pass rate for proof tasks.
- **Insights:** 2–4 short, rule-based sentences (for example "Gym slipped 20% this month").

## 8. Streak rules
- A day counts for a task if a `done` or `verified` check-in exists for that local date.
- The current streak is the number of consecutive days up to today. If today isn't done yet, counting starts from yesterday.
- Days before the task's creation date, and days while it was archived, don't count against completion %.

## 9. Tech stack
- Next.js (App Router, TypeScript), using Server Components and Server Actions.
- Postgres on Neon (free tier) with Prisma for app data.
- Neon Auth (`@neondatabase/auth`) for auth: the `createNeonAuth` server instance, the `/api/auth/[...path]` route, and `proxy.ts` for route protection.
- Tailwind CSS. Motion is used only for the check animation.
- Charts: hand-built SVG for the heatmap and sparklines, Recharts for the trend and weekday charts (lazy-loaded).
- Deploy on Vercel's free tier.

## 10. Data model (Prisma, app schema)
```
Profile       userId (PK, = Neon Auth user id), timezone, createdAt
Task          id, userId, title, description?, doneCriteria?, mode (NORMAL|PROOF),
              color, emoji?, archivedAt?, createdAt
CheckIn       id, taskId, userId, date (DATE, user-local), status (DONE|VERIFIED),
              createdAt                      @@unique([taskId, date])
VerifyAttempt id, taskId, userId, date, verdict (PASS|FAIL), confidence,
              reason, provider, createdAt
```

## 11. Routes / API
| Route | Purpose |
|---|---|
| `/auth/sign-in`, `/auth/sign-up` | auth forms (Neon Auth) |
| `/api/auth/[...path]` | Neon Auth handler |
| `/` | today's board |
| `/profile` | stats |
| `/settings` | name, timezone |
| Server Actions | createTask, updateTask, archiveTask, deleteTask, toggleCheckIn (normal only) |
| `POST /api/verify` | multipart image → verdict; creates CheckIn on pass |

The server enforces that `toggleCheckIn` rejects proof tasks, that only today's date is accepted, and that mode can never change.

## 12. Environment
```
DATABASE_URL=              # Neon connection string
NEON_AUTH_BASE_URL=        # Neon Console → Settings → Better Auth → Project Info
NEON_AUTH_COOKIE_SECRET=   # openssl rand -base64 32
GROQ_API_KEY=              # console.groq.com
GEMINI_API_KEY=            # aistudio.google.com/apikey
```

## 13. UI style
- Dark-first with a light theme. Neutral background, each task gets its own accent colour, rounded cards with soft depth.
- One typeface (Geist). Large numbers for streaks.
- Mobile-first, with touch targets of at least 44px.

## 14. Out of scope (v1)
Social features, sharing, reminders, email, password reset, backfilling past days, flexible schedules, storing images, native apps.

## 15. Milestones
1. Scaffold: Next.js, Tailwind, Prisma with Neon, Neon Auth sign-up/sign-in.
2. Tasks CRUD, board UI and normal-mode check-ins with animation.
3. Proof mode: upload/paste, `/api/verify`, Groq with Gemini fallback, retry cap.
4. Stats: queries, heatmap, trend, weekday chart, per-task rows, insights.
5. Polish: empty states, light/dark theme, mobile pass, deploy.
