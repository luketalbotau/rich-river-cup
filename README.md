# The Rich River Cup ⛳

A mobile-first golf weekend app for 8 players: live draft, Day 1 scramble, Day 2 singles, a team scoreboard and momentum chart, an individual points leaderboard, player trading cards, a $50 team-v-individual bet with a "who owes who" ledger, and a victory screen.

## Go live (about 10 minutes)

You need three free accounts: **GitHub**, **Vercel** and **Supabase**.

### 1. Put the code on GitHub
1. Create a new **empty** repository on github.com, for example `rich-river-cup`. Don't add a README.
2. In this folder, run:
   ```bash
   git init
   git add .
   git commit -m "The Rich River Cup"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/rich-river-cup.git
   git push -u origin main
   ```

### 2. Create the database (Supabase)
1. Go to supabase.com → **New project**. Pick any name and password, and choose the Sydney region.
2. When it's ready, open **SQL Editor** → **New query**, paste everything in `supabase.sql`, and click **Run**.
3. Go to **Project Settings → API** (or **API Keys**) and copy:
   - the **Project URL**
   - the **service_role** key (it's secret, so don't share it)

### 3. Deploy on Vercel
1. Go to vercel.com → **Add New → Project** → import your `rich-river-cup` GitHub repo.
2. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |
   | `SESSION_SECRET` | any long random string, e.g. mash the keyboard for 40 characters |

3. Click **Deploy**. Send the URL to the group.

From now on, every push to GitHub redeploys automatically.

**Tip for the boys:** on iPhone, open the link in Safari → Share → **Add to Home Screen**. It then opens full-screen like a real app.

## How it works on the weekend

1. **Everyone logs in.** Tap your name, then set a 4-digit PIN the first time. Your phone stays logged in.
2. **The draft.** Gossy picks first, then Luke, alternating. Only the captain on the clock can pick. Either captain can undo the last pick.
3. **Day 1 · Scramble.** Two matches. Pairs come from the draft order: each captain plays with their 1st pick, and the 2nd and 3rd picks play together. 2 team points per hole won. Open a match and tap who won each hole (tap again to clear). Anyone logged in can score any match.
4. **Day 2 · Singles.** Four matches: captain v captain, 1st pick v 1st pick, and so on. 1 team point per hole won.

   **Leaders** gives every player 1 point per hole won on both days (both scramble partners get it). If players are level, most Day 2 holes won is ahead.
5. **Bets.** One bet for everyone: every player has $50 at risk. After both days, every player on the losing team pays $50 to the winning individual (most points on Leaders). Teams level: nobody pays. Tied winners split it. **More → Who owes who** shows who pays who.
6. **Mistakes.** Tap a hole again to change or clear its result. Payments marked by mistake can be undone on the Who owes who page.

**Luke (admin)** can reset anyone's PIN and reset the draft from **More**.

## Changing things

- **Player names, captains, app name:** `lib/config.ts`
- **Odds model:** `ODDS_MODEL` in `lib/config.ts`. It assumes each hole is 38% win / 24% halve / 38% lose.
- **Colours:** `app/globals.css`

## Run it locally (optional)

```bash
npm install
npm run dev
```

Without Supabase variables, local data is saved to `.data/db.json`. Delete that file to start fresh.
