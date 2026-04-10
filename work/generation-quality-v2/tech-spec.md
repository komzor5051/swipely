---
created: 2026-04-10
status: draft
size: L
branch: feature/generation-quality-v2
---

# Tech Spec: Generation Quality v2

## Overview

Refactor the Swipely carousel generation pipeline from a single monolithic Gemini API call into a 3-agent pipeline (Strategist -> Copywriter -> Formatter), add carousel framework selection, improve hook quality, and extract shared generation logic from duplicated endpoints.

**User-spec:** `work/generation-quality-v2/user-spec.md`
**Code research:** `work/generation-quality-v2/code-research.md`

## Architecture

### Current State

Single `POST /api/generate` endpoint builds a ~250-line Russian system prompt combining strategy, copywriting, and formatting rules, sends it to Gemini 2.5 Flash Lite in one call, parses JSON response, cleans markdown, saves to DB. The V1 B2B endpoint (`/api/v1/generate`) duplicates all prompt logic locally with different model (flash, not flash-lite) and no `responseSchema`.

### Target State

```
User Input + Framework Choice
    |
    v
POST /api/generate (auth, validation, rate limiting — unchanged)
    |
    v
lib/generation/pipeline.ts — shared multi-agent orchestrator
    |
    +---> Agent 1: Strategist (flash-lite)
    |     Input: topic, tone, framework, template constraints
    |     Output: StrategyOutput (hook type, slide structure, angles, element plan)
    |
    +---> Agent 2: Copywriter (flash-lite)
    |     Input: StrategyOutput + topic + ToV + brief + design preset
    |     Output: Raw slide content (titles, content, post_caption)
    |
    +---> Agent 3: Formatter (flash-lite, responseSchema enforced)
    |     Input: Raw content + template constraints (word limits, layouts, element types)
    |     Output: Validated SlideData[] matching renderer schema exactly
    |
    v
Save to DB + Return JSON
```

Both `/api/generate` and `/api/v1/generate` call the same shared pipeline. Photo mode and preserve-text mode are handled separately (preserve-text goes through formatter only).

### Shared Resources

**Gemini API Client**: Single `callGemini()` utility in `lib/generation/gemini.ts` used by all three agents. Owns the fetch logic, timeout, retry on 503/429, JSON extraction. Consumers: strategist, copywriter, formatter agents. One instance per request (no pooling needed — stateless HTTP calls).

### Component Map

```
lib/generation/
  pipeline.ts          — orchestrator: runs 3 agents sequentially, handles errors
  gemini.ts            — shared Gemini API caller (fetch, retry, timeout, JSON parse)
  agents/
    strategist.ts      — builds strategist prompt, calls gemini, returns StrategyOutput
    copywriter.ts      — builds copywriter prompt, calls gemini, returns raw content
    formatter.ts       — builds formatter prompt, calls gemini with responseSchema, returns SlideData[]
  prompts/
    strategist.ts      — strategist system prompt + hook library + framework definitions
    copywriter.ts      — copywriter system prompt + tone/ToV injection
    formatter.ts       — formatter system prompt + validation rules
  types.ts             — StrategyOutput, CopywriterOutput, FormatterInput, FrameworkId types
  presets.ts           — designPresets + contentTones (extracted from route.ts, single source of truth)
  frameworks.ts        — carousel framework definitions (structure, hook formulas, CTA types)
  slide-structure.ts   — buildSlideStructure() (extracted from route.ts)

app/api/generate/route.ts      — refactored: auth/validation only, delegates to pipeline
app/api/v1/generate/route.ts   — refactored: auth only, delegates to same pipeline
app/(dashboard)/generate/page.tsx — adds framework selector to form
```

## Decisions

### D1: Three agents, all flash-lite, sequential

**Why:** Splitting strategy/copywriting/formatting into separate calls lets each agent focus on one job with a cleaner, shorter prompt. Flash-lite for all three keeps cost at ~$0.003-0.006/carousel (3x current, still under $0.01). Sequential execution is simpler than parallel and the dependency chain is linear.

**Alternatives considered:**
- Two agents (strategist + copywriter-formatter combo): Formatter as separate agent is justified because it serves as a safety net against crashes — the main pain point the user identified.
- Flash for copywriter, flash-lite for others: Better quality but 10x cost on the main agent. Not justified yet — can upgrade later if quality delta is measurable.
- Parallel strategist + copywriter: Not possible — copywriter depends on strategist output.

### D2: Shared pipeline module, not middleware

**Why:** Both `/api/generate` and `/api/v1/generate` duplicate prompt logic. Extracting to `lib/generation/pipeline.ts` eliminates duplication. A module (not middleware) because each endpoint has different auth and response formatting needs.

### D3: Framework selector is optional

**Why:** User decision. When no framework is selected, the strategist agent picks the best framework based on topic and tone (same as current behavior where AI decides structure). When a framework IS selected, strategist is constrained to that framework's structure.

### D4: Formatter uses Gemini responseSchema

**Why:** The formatter agent's entire purpose is producing valid JSON for the renderer. Using Gemini's built-in `responseSchema` enforcement gives a structural guarantee. The formatter prompt focuses on content quality (word count, layout variety, element correctness) while the schema handles structure.

### D5: Preserve-text mode routes through formatter only

**Why:** Preserve-text doesn't rewrite content — it only structures existing text into slides. Current `buildPreservePrompt()` already does this in one call. Adding a formatter pass ensures the output matches the renderer schema without changing the text.

### D6: Timeout raised to 90 seconds

**Why:** Three sequential Gemini calls at ~10-15s each plus network overhead. 55s current timeout is too tight. 90s gives comfortable headroom. The UI already shows a loading state so UX impact is minimal.

### D7: Hook library as concrete templates, not abstract labels

**Why:** Current prompt has 6 hook types as abstract concepts ("CONTRARIAN", "SHOCK DATA"). Research shows fill-in-the-blank formulas ("X mistakes that cost you Y") produce better hooks than abstract directions. The strategist prompt will contain 15-20 concrete hook templates categorized by framework type.

### D8: designPresets as single source of truth

**Why:** Currently duplicated between `route.ts` (main), `v1/route.ts` (B2B), with inconsistent `max_words_per_slide` values vs `registry.ts`. Extract to `lib/generation/presets.ts` as the authoritative source. Update `registry.ts` to import from there.

## Verification Plan

### Agent Verification Plan (AVP)

**Scope:** All acceptance criteria from user-spec.

| # | Criterion | Method | Tools Required |
|---|-----------|--------|----------------|
| 1 | Generation uses 3-agent pipeline | Integration test: call /api/generate, verify logs show 3 Gemini calls | curl, server logs |
| 2 | User can select a carousel framework | UI check: framework selector visible on generate page | Browser / Playwright MCP |
| 3 | Hook quality uses concrete formulas | Inspect strategist output: hook should match a template pattern, not abstract label | curl /api/generate, inspect response |
| 4 | Formatter prevents crashes from malformed AI output | Send edge-case inputs (very long text, special chars, unicode), verify no 500 errors | curl with test payloads |
| 5 | All 24 templates continue to work | Generate carousel with each template, verify rendering | curl + manual spot-check |
| 6 | Cost stays within 3x | Check Gemini usage metadata in response logs | Server logs |
| 7 | Generation completes < 15s (p50) | Time 10 generations, measure median | curl with timing |

### Testing Strategy (Size L)

**Unit tests:**
- Each agent prompt builder: verify output contains required sections
- Framework definitions: each framework has hook templates, slide structure, CTA
- Presets extraction: verify all 24 templates have matching presets
- Formatter validation: test with malformed inputs (missing fields, wrong types, excess words)

**Integration tests:**
- Full pipeline: topic in -> valid SlideData[] out
- Pipeline with framework selection vs without
- Pipeline with preserve-text mode (formatter only)
- V1 endpoint uses shared pipeline
- Error propagation: strategist fails -> graceful error, copywriter fails -> graceful error

**No E2E tests** (no test infrastructure exists in the project; adding it is out of scope).

## Implementation Tasks

### Wave 1: Extract Shared Module

**Task 1.1: Extract generation utilities to lib/generation/**
Extract `designPresets`, `contentTones`, `buildSlideStructure()`, `cleanMarkdown()`, `containsInjection()` from `route.ts` into dedicated files under `lib/generation/`. Create `presets.ts`, `slide-structure.ts`. Update both `/api/generate/route.ts` and `/api/v1/generate/route.ts` to import from shared module. Sync `max_words_per_slide` values between presets and registry.

- Skill: `code-writing`
- Reviewers: `code-reviewer`, `completeness-validator`
- Files to modify: `app/api/generate/route.ts`, `app/api/v1/generate/route.ts`, `lib/ai-utils.ts`, `lib/templates/registry.ts`
- Files to create: `lib/generation/presets.ts`, `lib/generation/slide-structure.ts`, `lib/generation/types.ts`
- Files to read: `components/slides/types.ts`

**Task 1.2: Create shared Gemini API caller**
Extract Gemini fetch logic (URL construction, headers, timeout, retry on 503/429, JSON extraction, response parsing) into `lib/generation/gemini.ts`. Single `callGemini(prompt, config)` function that handles all error cases. Both endpoints use this instead of inline fetch.

- Skill: `code-writing`
- Reviewers: `code-reviewer`
- Files to modify: `app/api/generate/route.ts`, `app/api/v1/generate/route.ts`
- Files to create: `lib/generation/gemini.ts`

### Wave 2: Agent Pipeline

**Task 2.1: Implement strategist agent**
Create `lib/generation/agents/strategist.ts` and `lib/generation/prompts/strategist.ts`. The strategist receives topic, tone, framework (optional), and template constraints. Returns `StrategyOutput`: hook type with concrete formula, slide-by-slide plan (type, angle, element placement), and key angles. Prompt includes the hook library (15-20 concrete templates) and framework definitions.

- Skill: `code-writing`
- Reviewers: `code-reviewer`
- Verify-smoke: Call strategist with test topic, verify StrategyOutput JSON structure
- Files to create: `lib/generation/agents/strategist.ts`, `lib/generation/prompts/strategist.ts`
- Files to read: `lib/generation/types.ts`, `lib/generation/presets.ts`

**Task 2.2: Implement copywriter agent**
Create `lib/generation/agents/copywriter.ts` and `lib/generation/prompts/copywriter.ts`. The copywriter receives StrategyOutput, original text, ToV guidelines, brief, design preset tone, and content tone. Writes slide content following the strategy structure. Output is raw slide content (titles, content, post_caption) without strict schema enforcement.

- Skill: `code-writing`
- Reviewers: `code-reviewer`
- Verify-smoke: Call copywriter with test strategy + topic, verify slide content returned
- Files to create: `lib/generation/agents/copywriter.ts`, `lib/generation/prompts/copywriter.ts`
- Files to read: `lib/generation/types.ts`, `lib/generation/presets.ts`

**Task 2.3: Implement formatter agent**
Create `lib/generation/agents/formatter.ts` and `lib/generation/prompts/formatter.ts`. The formatter receives raw copywriter output and template constraints (word limits, allowed layouts, element types). Uses Gemini `responseSchema` to guarantee valid SlideData[] output. Enforces: word count per slide, layout variety (min 3 different), valid element structures, clean text (no markdown, no emoji). Also handles preserve-text mode input.

- Skill: `code-writing`
- Reviewers: `code-reviewer`
- Verify-smoke: Feed malformed JSON to formatter, verify it produces valid SlideData[]
- Files to create: `lib/generation/agents/formatter.ts`, `lib/generation/prompts/formatter.ts`
- Files to read: `lib/generation/types.ts`, `components/slides/types.ts`

**Task 2.4: Create pipeline orchestrator**
Create `lib/generation/pipeline.ts` that runs the three agents sequentially. Handles: framework selection routing, preserve-text mode (formatter only), error propagation with clear error messages per stage, timeout management (90s total, proportional per agent). Exports `generateCarousel(input: PipelineInput): Promise<PipelineOutput>`.

- Skill: `code-writing`
- Reviewers: `code-reviewer`, `completeness-validator`
- Verify-smoke: Call pipeline end-to-end with test input, verify SlideData[] output
- Files to create: `lib/generation/pipeline.ts`
- Files to read: `lib/generation/agents/*.ts`, `lib/generation/types.ts`

### Wave 3: Carousel Frameworks & Hook Library

**Task 3.1: Define carousel frameworks and hook library**
Create `lib/generation/frameworks.ts` with 6 framework definitions: "mistakes" (3 ошибки), "case-study" (кейс-разбор), "step-by-step" (пошаговый гайд), "before-after" (до/после), "myths-vs-reality" (мифы vs реальность), "checklist" (чек-лист). Each framework defines: slide progression template, recommended hook formulas (2-3 per framework), CTA type, optimal slide count range. Create hook library with 15-20 concrete fill-in-the-blank templates categorized by framework.

- Skill: `code-writing`
- Reviewers: `code-reviewer`
- Files to create: `lib/generation/frameworks.ts`
- Files to read: `lib/generation/types.ts`

### Wave 4: Endpoint Integration

**Task 4.1: Refactor main generation endpoint to use pipeline**
Replace inline prompt building and Gemini call in `/api/generate/route.ts` with call to `generateCarousel()` from pipeline. Keep all auth, validation, rate limiting, DB save logic. Add `framework` field to request body parsing. Raise timeout to 90s. Remove all duplicated prompt/preset code (now in shared module).

- Skill: `code-writing`
- Reviewers: `code-reviewer`, `completeness-validator`
- Verify-smoke: `curl -X POST /api/generate` with test payload, verify valid carousel response
- Verify-user: Generate a carousel on localhost, verify slides render correctly
- Files to modify: `app/api/generate/route.ts`
- Files to read: `lib/generation/pipeline.ts`, `lib/generation/types.ts`

**Task 4.2: Refactor V1 B2B endpoint to use pipeline**
Replace duplicated prompt logic in `/api/v1/generate/route.ts` with shared pipeline call. Keep B2B-specific auth (API key), quota management, response format (generation_id, view_url), and optional PNG rendering. Remove all local copies of designPresets, buildSystemPrompt, etc.

- Skill: `code-writing`
- Reviewers: `code-reviewer`
- Verify-smoke: `curl -X POST /api/v1/generate` with API key, verify response structure
- Files to modify: `app/api/v1/generate/route.ts`
- Files to read: `lib/generation/pipeline.ts`

### Wave 5: UI Integration

**Task 5.1: Add framework selector to generation page**
Add optional framework selector to the generate form in `page.tsx`. Follow existing pattern of tone selector (2-column grid of toggle buttons). Frameworks displayed with Russian labels. Selection sent as `framework` field in API request. Default: none selected (AI chooses).

- Skill: `code-writing`
- Reviewers: `code-reviewer`
- Verify-user: Open generate page on localhost, verify framework selector appears and works
- Files to modify: `app/(dashboard)/generate/page.tsx`
- Files to read: `lib/generation/frameworks.ts`

### Wave 6: Audit

**Task 6.1: Code Audit**
Holistic code quality review of all new and modified files in the generation pipeline.

- Skill: `code-reviewing`
- Reviewers: none

**Task 6.2: Security Audit**
OWASP Top 10 review across all generation components — prompt injection, input validation, auth boundaries.

- Skill: `security-auditor`
- Reviewers: none

**Task 6.3: Test Audit**
Test quality and coverage review across all generation pipeline components.

- Skill: `test-master`
- Reviewers: none

### Wave 7: Final

**Task 7.1: QA**
Acceptance testing: verify all 7 acceptance criteria from user-spec. Run through full generation flow with multiple templates, frameworks, edge cases. Test preserve-text mode through formatter. Test V1 endpoint.

- Skill: `pre-deploy-qa`

**Task 7.2: Deploy**
Deploy to Selectel VPS via existing CI/CD pipeline. Verify generation works in production with Gemini proxy.

- Skill: `deploy-pipeline`
- Verify-user: Generate a carousel on swipely.ru, verify it works end-to-end

**Task 7.3: Post-deploy verification**
Verify generation pipeline works on production: test multiple templates, framework selection, error handling. Check Gemini proxy passes all three agent calls.

- Skill: `post-deploy-qa`
