# The Scout Network

A multi-agent AI scouting system for the FIFA World Cup 2026 final, built to
demonstrate the **orchestrator-worker** agentic pattern with genuinely live data.

One Orchestrator agent confirms the real matchup via web search and writes
non-overlapping research briefs. Three Scout agents deploy **in parallel**, each
running live web searches against its brief. A Chief Scout agent — synthesis
only, no search — reconciles the reports, attaches confidence scores, and flags
every gap it could not verify instead of bluffing. Five real model calls per
run; nothing about the match is hard-coded.

## Bring your own key

This is a pure static site with **no backend**. Your Anthropic API key is held
in the browser (in memory, or in localStorage only if you tick "Remember on
this device") and is sent exclusively to `api.anthropic.com`, using Anthropic's
explicit CORS opt-in header for browser use
(`anthropic-dangerous-direct-browser-access`). The "dangerous" in that header
name refers to embedding *your own* key in a public site's code — which this
app never does. In the BYOK pattern the key belongs to the visitor, who already
controls their own browser.

Cost note: a full run makes 5 calls to `claude-sonnet-4-6` with up to ~10 web
searches. Web search is billed by Anthropic on top of token usage — check
current pricing at https://docs.claude.com before heavy use.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel: **Add New → Project**, import the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output directory `dist` (both defaults).
4. No environment variables needed — keys are supplied by visitors.
5. Deploy.

Or from the CLI: `npm i -g vercel && vercel`.

## Architecture

```
            ORCHESTRATOR          (search: confirms matchup, scopes briefs)
                 │
      ┌──────────┼──────────┐
      ▼          ▼          ▼
   SCOUT A    SCOUT B    SCOUT C    (parallel · live web search · per-claim
   finalist 1 finalist 2 context     sources and confidence · gaps declared)
      └──────────┼──────────┘
                 ▼
            CHIEF SCOUT           (no search: reconcile, score, flag gaps)
                 ▼
        THE BRIEFING DOSSIER
```

Design decisions worth noting:

- **Scoped, non-overlapping briefs** — the orchestrator explicitly tells each
  scout what *not* to cover, so parallel workers don't duplicate effort.
- **Structured JSON contracts** between agents, parsed defensively (fence
  stripping, balanced-brace extraction, per-scout failure isolation via
  `Promise.allSettled` — one scout failing does not kill the run).
- **Blocks filtered by type, never position** — search-enabled responses
  interleave `text`, `server_tool_use` and `web_search_tool_result` blocks;
  the client extracts text and the *actual queries the agents ran* by type.
- **Epistemic honesty as a first-class feature** — confidence under 0.6 renders
  red, unverified points surface in an amber "flagged gaps" panel, and the
  Chief Scout's prediction confidence is pinned to its weakest evidence.

## Stack

Vite + React 18, no UI libraries — the agent graph is hand-rolled SVG + CSS.
Fonts: Saira Condensed / Inter / IBM Plex Mono.
