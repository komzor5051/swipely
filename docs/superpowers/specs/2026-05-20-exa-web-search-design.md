# EXA Web Search — Design Spec

Date: 2026-05-20
Status: Approved for planning
Scope: `swipely-nextjs/`

## Goal

Give Swipely's content agents high-quality web search via the EXA API, so generated
content (carousels, posts, blog articles, topic suggestions) is grounded in fresh,
relevant facts instead of relying only on the LLM's training knowledge.

## Problem

- The carousel generation pipeline (strategist -> copywriter -> formatter) does no web
  research. Agents invent facts, stats, and trends from training data.
- The chat agent has 10 tools but no web search — it cannot look anything up.
- EXA is used only by the blog factory, through a single thin `searchSources()` function
  with no retries, no result filtering, no freshness control.

## Approach

One shared EXA module, consumed by four call sites with thin integration code. The
existing `lib/blog/researcher.ts` migrates onto the shared module. Chosen over
per-consumer search functions (duplication) and over a separate LLM synthesis layer
(extra cost/latency — EXA's built-in `summary` feature covers it).

## Architecture

### 1. Core module — `lib/search/exa.ts`

The single point of contact with the EXA API. Public surface:

```
interface SearchResult {
  title: string;
  url: string;
  publishedDate: string | null;
  summary: string;        // EXA query-focused summary of the source
  highlights: string[];   // most relevant text excerpts
}

interface SearchOptions {
  numResults?: number;          // default 6
  freshness?: "fresh" | "any";  // default "any"
  category?: string;            // optional EXA category filter
}

async function webSearch(query: string, opts?: SearchOptions): Promise<SearchResult[]>
```

Quality and reliability requirements:

- Result quality: `type: "auto"` + `useAutoprompt`; request `contents.summary` with a
  query-focused prompt and `contents.highlights`. EXA produces the per-source digest —
  no extra LLM call needed.
- Freshness: when `freshness === "fresh"`, set `startPublishedDate` to roughly the last
  12 months and request `livecrawl: "preferred"`.
- Reliability: timeout on the request; retry with exponential backoff on 429/503/5xx
  (bounded attempts). On final failure, return `[]` — never throw. Web search must never
  break content generation.
- Cost control: in-memory LRU cache keyed by normalized query + options, TTL ~30 min, so
  repeated identical queries inside the window do not spend EXA quota.
- Garbage filtering: drop results with empty/too-short text and duplicate domains.

EXA key is already provisioned (`EXA_API_KEY` in `swipely-nextjs/.env.local`).

### 2. Carousel generation — research stage with a smart gate

Web search runs only when the topic actually benefits from fresh data, decided by the
strategist in its existing single call (zero extra LLM calls).

- Strategist output schema gains three fields: `needsResearch: boolean`,
  `researchQuery: string`, `freshnessHint: "fresh" | "any"`. The strategist prompt is
  updated to instruct: request research for topics involving current trends, statistics,
  prices, "in <year>", news, or named tools/companies; skip it for evergreen advice.
- `lib/generation/pipeline.ts`: after the strategist stage, if `needsResearch` is true,
  call `webSearch(researchQuery, { freshness: freshnessHint })`. Pass the results into
  the copywriter stage as `researchContext`.
- The copywriter prompt builder gains a `researchContext` block titled
  `АКТУАЛЬНЫЕ ДАННЫЕ ИЗ ВЕБ-ПОИСКА`, listing each source's summary and highlights, with
  an anti-hallucination instruction: rely on these facts for any numbers/statistics; do
  not invent figures; if a fact is not present, write without a precise number.
- Sources are silent grounding only. No URLs in slides, no source list in `post_caption`.

Failure behavior: if the strategist requests research but `webSearch` returns `[]`, the
pipeline proceeds normally without the research block.

### 3. Chat agent — `web_search` tool

A new tool added to `buildTools()` in `lib/chat/tools.ts`:

- Input: `query: string`, optional `freshness`. Calls `webSearch` and returns the
  standard `ToolResult` shape (`ui_hint: "plain"`) with sources in `data`.
- Access: paid tiers only (`start`, `blogger`, `creator`, `pro`). Free users get a
  result explaining the tool is unavailable on their plan — used as an upgrade prompt.
  The tool is excluded from the catalog (or short-circuits) based on `ctx.profile`.
- Cost safety net: a per-user daily call cap, even for paid tiers.

### 4. Blog factory and topic suggestions

- `lib/blog/researcher.ts`: `searchSources()` becomes a thin adapter over `webSearch`,
  keeping its current signature `(query, numResults)` and `Source` return shape so the
  three existing call sites (`app/api/cron/generate`, `lib/blog/pipeline/topic-miner`,
  `lib/inngest/functions/topic-miner`) need no changes. Output quality improves for free.

## Components and boundaries

| Unit | Responsibility | Depends on |
|------|----------------|------------|
| `lib/search/exa.ts` | EXA API access: search, retries, cache, filtering | EXA HTTP API |
| `lib/generation/agents/strategist.ts` + prompt | Decide if research is needed, craft query | — |
| `lib/generation/pipeline.ts` | Orchestrate research stage between agents | `exa.ts` |
| `lib/generation/prompts/copywriter.ts` | Render research context into the prompt | — |
| `lib/chat/tools.ts` | `web_search` tool with tier gating + daily cap | `exa.ts` |
| `lib/blog/researcher.ts` | Backward-compatible adapter | `exa.ts` |

## Testing

- `lib/search/exa.ts`: unit tests with mocked `fetch` — retry/backoff on 429/503,
  cache hit/miss, garbage filtering, graceful degradation (returns `[]` on failure),
  freshness -> `startPublishedDate` mapping.
- Strategist gate: research requested for trend/stat topics, skipped for evergreen ones.
- Copywriter prompt: research block rendered when context present, omitted when absent.
- Chat tool: paid tier passes, free tier blocked, daily cap enforced.

## Rollout phases

1. Core `lib/search/exa.ts` + tests.
2. Carousel generation research stage (largest impact).
3. Chat `web_search` tool.
4. Blog factory migration onto the shared module.

## Out of scope

- No alternative search provider / fallback engine — EXA only.
- No source citation in carousel slides or captions.
- No user-facing toggle in the generation UI — the smart gate decides automatically.
