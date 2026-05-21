# Async Chat URL-to-Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `carousel_from_url` work out of the 60s-capped chat stream into a durable Inngest job so YouTube/article carousels reliably appear in the thread instead of an empty result.

**Architecture:** The chat tool sends an Inngest event and returns a placeholder immediately. A new Inngest function runs extract → condense → generate as durable steps and writes the carousel as a follow-up assistant message. The job calls the existing `/api/generate` route over loopback using a new internal-auth path (`CRON_SECRET`). The chat client polls the thread for the job result.

**Tech Stack:** Next.js 16 (App Router, `output: standalone`), Inngest (self-hosted), Vitest, Supabase, AI SDK v6, TypeScript.

**Spec:** `docs/superpowers/specs/2026-05-21-chat-url-carousel-async-design.md`

**Working directory for all paths:** `swipely-nextjs/`

**Test runner:** Vitest. Run a single file with `npx vitest run <path>`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `lib/auth/internal-user.ts` | Resolve internal service-call identity from `CRON_SECRET` bearer | Create |
| `lib/auth/__tests__/internal-user.test.ts` | Tests for the above | Create |
| `app/api/generate/route.ts` | Add internal-auth path alongside cookie auth | Modify |
| `app/api/generate/route.test.ts` | Auth-rejection tests | Create |
| `lib/inngest/client.ts` | Add `chat/carousel-from-url.run` event type | Modify |
| `lib/inngest/functions/chat-carousel.ts` | Inngest job: extract → condense → generate → persist | Create |
| `lib/inngest/__tests__/chat-carousel.test.ts` | Tests for the job handler | Create |
| `app/api/inngest/route.ts` | Register the new function | Modify |
| `lib/chat/tools.ts` | Rewrite `carousel_from_url` to dispatch the job; add `threadId` to `ToolContext` | Modify |
| `lib/chat/__tests__/carousel-from-url.test.ts` | Rewrite for the async tool | Modify |
| `app/api/chat/route.ts` | Pass `threadId` into `buildTools` | Modify |
| `lib/chat/system-prompt.ts` | Tweak `carousel_from_url` description | Modify |
| `lib/chat/pending-job.ts` | `hasPendingJob(messages)` helper | Create |
| `lib/chat/__tests__/pending-job.test.ts` | Tests for the above | Create |
| `lib/chat/poll-thread.ts` | `pollThreadForJobResult` — React-free poll loop | Create |
| `lib/chat/__tests__/poll-thread.test.ts` | Tests for the above | Create |
| `components/dashboard/conv/ChatHub.tsx` | Wire the poll loop into a React effect | Modify |

---

## Task 1: Internal-user auth helper

**Files:**
- Create: `lib/auth/internal-user.ts`
- Test: `lib/auth/__tests__/internal-user.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/auth/__tests__/internal-user.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveInternalUserId } from "../internal-user";

describe("resolveInternalUserId", () => {
  const ORIGINAL = process.env.CRON_SECRET;
  beforeEach(() => { process.env.CRON_SECRET = "s3cret"; });
  afterEach(() => { process.env.CRON_SECRET = ORIGINAL; });

  it("returns the user id when the bearer matches CRON_SECRET", () => {
    expect(resolveInternalUserId("Bearer s3cret", { internalUserId: "user-1" })).toBe("user-1");
  });

  it("returns null when the bearer is wrong", () => {
    expect(resolveInternalUserId("Bearer wrong", { internalUserId: "user-1" })).toBeNull();
  });

  it("returns null when the auth header is absent", () => {
    expect(resolveInternalUserId(null, { internalUserId: "user-1" })).toBeNull();
  });

  it("returns null when the bearer matches but internalUserId is missing", () => {
    expect(resolveInternalUserId("Bearer s3cret", {})).toBeNull();
  });

  it("returns null when CRON_SECRET is not configured", () => {
    delete process.env.CRON_SECRET;
    expect(resolveInternalUserId("Bearer s3cret", { internalUserId: "user-1" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/auth/__tests__/internal-user.test.ts`
Expected: FAIL — cannot find module `../internal-user`.

- [ ] **Step 3: Write the implementation**

Create `lib/auth/internal-user.ts`:

```ts
/**
 * Internal service auth for server-to-server calls — e.g. the Inngest
 * chat-carousel job calling /api/generate over loopback.
 *
 * When the request carries the shared CRON_SECRET as a bearer token, the
 * caller may act as an explicit user via `body.internalUserId`. Returns the
 * user id to act as, or null to fall back to normal cookie-session auth.
 *
 * Security: CRON_SECRET is a server-only secret. A leak lets the holder
 * generate carousels as any user — same trust level as the existing
 * /api/email/trigger internal calls. It must never reach the client bundle.
 */
export function resolveInternalUserId(
  authHeader: string | null,
  body: { internalUserId?: unknown },
): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  if (authHeader !== `Bearer ${secret}`) return null;
  const id = body.internalUserId;
  return typeof id === "string" && id.length > 0 ? id : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/auth/__tests__/internal-user.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/internal-user.ts lib/auth/__tests__/internal-user.test.ts
git commit -m "feat(auth): internal service-call user resolution via CRON_SECRET"
```

---

## Task 2: Internal-auth path in `/api/generate`

**Files:**
- Modify: `app/api/generate/route.ts`
- Test: `app/api/generate/route.test.ts`

The route currently authenticates via cookie session only (`route.ts:31-40`) and parses the body later (`route.ts:85-104`). This task moves body parsing to the top and adds an internal-auth branch. Downstream code uses `user.id` / `user.email` — we keep a `user` object with that exact shape, so no downstream lines change.

- [ ] **Step 1: Write the failing test**

Create `app/api/generate/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

import { POST } from "./route";

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("/api/generate auth", () => {
  const ORIGINAL = process.env.CRON_SECRET;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "s3cret";
    getUser.mockResolvedValue({ data: { user: null } });
  });
  afterEach(() => { process.env.CRON_SECRET = ORIGINAL; });

  it("rejects with 401 when there is no auth at all", async () => {
    const res = await POST(req({ text: "x", template: "swipely", slideCount: 5 }));
    expect(res.status).toBe(401);
  });

  it("rejects with 401 when the internal bearer is wrong", async () => {
    const res = await POST(
      req(
        { text: "x", template: "swipely", slideCount: 5, internalUserId: "user-1" },
        { Authorization: "Bearer wrong" },
      ),
    );
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/generate/route.test.ts`
Expected: FAIL — the current route reads the body after auth, and with a malformed/early path the assertions will not hold (or the import of internal-user is missing once partially edited). Confirm RED before editing the route.

- [ ] **Step 3: Add the import**

In `app/api/generate/route.ts`, after the existing import block (after line 17 `import { fetchNotionContext } ...`), add:

```ts
import { resolveInternalUserId } from "@/lib/auth/internal-user";
```

- [ ] **Step 4: Move body parsing to the top and add the internal-auth branch**

In `app/api/generate/route.ts`, replace the current block from line 31 (`// ─── Auth check ───`) through line 40 (the closing `}` of the `if (!user)` block) with:

```ts
  // ─── Parse body early (needed to resolve internal-call identity) ───
  let body: {
    text: string;
    template: string;
    slideCount: number;
    format?: string;
    tone?: string;
    brief?: string;
    preserveText?: boolean;
    framework?: string;
    plannedIdeaId?: string;
    sourceText?: string;
    notion_page_id?: string;
    notion_connection_id?: string;
    internalUserId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ─── Auth: internal service call (CRON_SECRET) OR cookie session ───
  let user: { id: string; email: string | null };
  const internalUserId = resolveInternalUserId(
    request.headers.get("authorization"),
    body,
  );
  if (internalUserId) {
    // Trusted server-to-server call (Inngest chat-carousel job). No email —
    // the job-driven path intentionally skips onboarding email triggers.
    user = { id: internalUserId, email: null };
  } else {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    user = { id: authUser.id, email: authUser.email ?? null };
  }
```

- [ ] **Step 5: Delete the now-duplicate body declaration**

In `app/api/generate/route.ts`, delete the old body declaration and parse block — the lines starting `let body: {` through the closing `}` of `try { body = await request.json(); } catch { ... }` (originally lines 85-104). The destructuring line that follows (`const { text, template: rawTemplate, ... } = body;`) stays.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run app/api/generate/route.test.ts`
Expected: PASS — 2 tests. Both bail at 401 before any DB/pipeline call.

- [ ] **Step 7: Type-check the route**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "app/api/generate/route.ts" || echo "no route type errors"`
Expected: `no route type errors` (downstream `user.id`/`user.email` still resolve against the new `user` object).

- [ ] **Step 8: Commit**

```bash
git add app/api/generate/route.ts app/api/generate/route.test.ts
git commit -m "feat(generate): internal-auth path for server-to-server calls"
```

---

## Task 3: Inngest event type

**Files:**
- Modify: `lib/inngest/client.ts`

- [ ] **Step 1: Add the event to the `InngestEvents` type**

In `lib/inngest/client.ts`, inside the `InngestEvents` type, after the `"agent/analyst.run"` line, add:

```ts
  "chat/carousel-from-url.run": {
    data: {
      userId: string;
      threadId: string;
      url: string;
      slideCount: number;
      templateId: string;
    };
  };
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "lib/inngest/client.ts" || echo "no client type errors"`
Expected: `no client type errors`.

- [ ] **Step 3: Commit**

```bash
git add lib/inngest/client.ts
git commit -m "feat(inngest): chat/carousel-from-url.run event type"
```

---

## Task 4: chat-carousel Inngest function

**Files:**
- Create: `lib/inngest/functions/chat-carousel.ts`
- Test: `lib/inngest/__tests__/chat-carousel.test.ts`

The handler `runChatCarousel` is exported separately from the `chatCarousel` Inngest object so it can be unit-tested with `makeFakeStep` (see `lib/inngest/test-utils.ts`).

- [ ] **Step 1: Write the failing test**

Create `lib/inngest/__tests__/chat-carousel.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeFakeStep, makeEvent } from "@/lib/inngest/test-utils";

const { extractFromUrl, condenseSourceText, containsInjection, appendMessage } =
  vi.hoisted(() => ({
    extractFromUrl: vi.fn(),
    condenseSourceText: vi.fn(),
    containsInjection: vi.fn(),
    appendMessage: vi.fn(),
  }));
vi.mock("@/lib/content/url-source", () => ({ extractFromUrl, condenseSourceText }));
vi.mock("@/lib/ai-utils", () => ({ containsInjection }));
vi.mock("@/lib/chat/queries", () => ({ appendMessage }));

import { runChatCarousel } from "../functions/chat-carousel";

function mockFetch(ok: boolean, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 429,
    json: async () => body,
  } as unknown as Response);
}

const EVENT = makeEvent("chat/carousel-from-url.run", {
  userId: "user-1",
  threadId: "thread-1",
  url: "https://www.youtube.com/watch?v=abc",
  slideCount: 7,
  templateId: "swipely",
});

function lastAppend() {
  const call = appendMessage.mock.calls[appendMessage.mock.calls.length - 1];
  return call[0] as {
    role: string;
    parts: Array<{ output: { ok: boolean; ui_hint?: string; summary?: string } }>;
  };
}

describe("runChatCarousel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    extractFromUrl.mockResolvedValue({
      ok: true, kind: "youtube", title: "Видео", text: "Транскрипт видео.",
    });
    condenseSourceText.mockImplementation(async (t: string) => t);
    containsInjection.mockReturnValue(false);
    appendMessage.mockResolvedValue({ id: "msg-1" });
    mockFetch(true, { id: "gen-1", slides: [{ i: 0 }], post_caption: "cap" });
  });

  it("appends a carousel_card message on the happy path", async () => {
    const { step, calls } = makeFakeStep();
    const out = await runChatCarousel({ event: EVENT, step });

    expect(out).toEqual({ status: "done" });
    expect(calls.map((c) => c.name)).toEqual([
      "extract", "condense", "generate", "persist-result",
    ]);
    const msg = lastAppend();
    expect(msg.role).toBe("assistant");
    expect(msg.parts[0].output.ok).toBe(true);
    expect(msg.parts[0].output.ui_hint).toBe("carousel_card");
  });

  it("appends an error message when extraction fails", async () => {
    extractFromUrl.mockResolvedValue({ ok: false, reason: "no_transcript" });
    const { step } = makeFakeStep();

    const out = await runChatCarousel({ event: EVENT, step });

    expect(out).toEqual({ status: "extract_failed", reason: "no_transcript" });
    const msg = lastAppend();
    expect(msg.parts[0].output.ok).toBe(false);
    expect(msg.parts[0].output.summary).toContain("субтитров");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("appends an error message when the source contains an injection", async () => {
    containsInjection.mockReturnValue(true);
    const { step } = makeFakeStep();

    const out = await runChatCarousel({ event: EVENT, step });

    expect(out).toEqual({ status: "injection" });
    const msg = lastAppend();
    expect(msg.parts[0].output.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("appends an error message when /api/generate responds non-OK", async () => {
    mockFetch(false, { error: "Достигнут дневной лимит генераций." });
    const { step } = makeFakeStep();

    const out = await runChatCarousel({ event: EVENT, step });

    expect(out).toEqual({ status: "generate_failed" });
    const msg = lastAppend();
    expect(msg.parts[0].output.ok).toBe(false);
    expect(msg.parts[0].output.summary).toContain("лимит");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/inngest/__tests__/chat-carousel.test.ts`
Expected: FAIL — cannot find module `../functions/chat-carousel`.

- [ ] **Step 3: Write the implementation**

Create `lib/inngest/functions/chat-carousel.ts`:

```ts
import { randomUUID } from "node:crypto";
import { inngest } from "@/lib/inngest/client";
import { extractFromUrl, condenseSourceText } from "@/lib/content/url-source";
import type { ExtractReason } from "@/lib/content/url-source";
import { containsInjection } from "@/lib/ai-utils";
import { appendMessage } from "@/lib/chat/queries";

interface GenData {
  id?: string;
  slides?: unknown[];
  post_caption?: string;
}

const REASON_MESSAGE: Record<ExtractReason, string> = {
  unsupported_url:
    "Поддерживаю только статьи и YouTube-видео. Пришли текст тезисами или другую ссылку.",
  no_transcript: "У этого видео нет субтитров — пришли тезисы текстом.",
  empty_content:
    "Не вышло вытащить текст со страницы — возможно, paywall. Скинь текст напрямую.",
  provider_error: "Не получилось открыть ссылку. Попробуй ещё раз или пришли текст.",
};

const INJECTION_MESSAGE =
  "В материале по ссылке есть подозрительные инструкции — не могу собрать из него карусель. Пришли текст тезисами напрямую.";

/** Loopback call to /api/generate using internal (CRON_SECRET) auth. */
async function internalGenerate(args: {
  userId: string;
  topic: string;
  sourceText: string;
  templateId: string;
  slideCount: number;
}): Promise<{ ok: true; data: GenData } | { ok: false; error: string }> {
  const baseUrl = `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
    },
    body: JSON.stringify({
      text: args.topic,
      sourceText: args.sourceText,
      template: args.templateId,
      slideCount: args.slideCount,
      format: "portrait",
      internalUserId: args.userId,
    }),
    signal: AbortSignal.timeout(90_000),
  });
  const data = (await res.json().catch(() => null)) as
    | (GenData & { error?: string })
    | null;
  if (!res.ok) {
    const err =
      data && typeof data.error === "string"
        ? data.error
        : "Не удалось сгенерировать карусель";
    return { ok: false, error: err };
  }
  return { ok: true, data: (data ?? {}) as GenData };
}

async function appendErrorMessage(
  userId: string,
  threadId: string,
  summary: string,
): Promise<void> {
  await appendMessage({
    userId,
    threadId,
    role: "assistant",
    parts: [
      {
        type: "tool-result",
        toolName: "carousel_from_url",
        toolCallId: randomUUID(),
        output: { ok: false, summary, data: { error: "job_failed" }, ui_hint: "plain" },
      },
    ],
  });
}

async function appendCarouselMessage(
  userId: string,
  threadId: string,
  args: { gen: GenData; kind: "youtube" | "article"; topic: string; templateId: string },
): Promise<void> {
  const kindLabel = args.kind === "youtube" ? "видео" : "статьи";
  await appendMessage({
    userId,
    threadId,
    role: "assistant",
    generation_id: args.gen.id ?? null,
    parts: [
      {
        type: "tool-result",
        toolName: "carousel_from_url",
        toolCallId: randomUUID(),
        output: {
          ok: true,
          summary: `Собрал карусель из ${kindLabel} «${args.topic}»`,
          data: {
            generation_id: args.gen.id,
            slides: args.gen.slides,
            post_caption: args.gen.post_caption,
            templateId: args.templateId,
            format: "portrait",
          },
          ui_hint: "carousel_card",
        },
      },
    ],
  });
}

interface ChatCarouselEvent {
  data: {
    userId: string;
    threadId: string;
    url: string;
    slideCount: number;
    templateId: string;
  };
}
interface StepLike {
  run: <T>(name: string, fn: () => T | Promise<T>) => Promise<T>;
}

/**
 * Durable job: extract source from a URL, condense it, generate a carousel
 * via /api/generate, and append the result (or an honest error) as a
 * follow-up assistant message in the chat thread.
 *
 * Each step is a short HTTP callback — none exceeds the ~60s reverse-proxy
 * idle timeout (transcription self-aborts at 55s; condense/generate <50s).
 */
export async function runChatCarousel({
  event,
  step,
}: {
  event: ChatCarouselEvent;
  step: StepLike;
}): Promise<{ status: string; reason?: string }> {
  const { userId, threadId, url, slideCount, templateId } = event.data;

  const extracted = await step.run("extract", () => extractFromUrl(url));
  if (!extracted.ok) {
    await step.run("persist-extract-error", () =>
      appendErrorMessage(userId, threadId, REASON_MESSAGE[extracted.reason]),
    );
    return { status: "extract_failed", reason: extracted.reason };
  }

  const sourceText = await step.run("condense", () =>
    condenseSourceText(extracted.text),
  );

  if (containsInjection(sourceText)) {
    await step.run("persist-injection-error", () =>
      appendErrorMessage(userId, threadId, INJECTION_MESSAGE),
    );
    return { status: "injection" };
  }

  const topic = extracted.title.trim() || "Материал по ссылке";

  const gen = await step.run("generate", () =>
    internalGenerate({ userId, topic, sourceText, templateId, slideCount }),
  );
  if (!gen.ok) {
    await step.run("persist-generate-error", () =>
      appendErrorMessage(userId, threadId, gen.error),
    );
    return { status: "generate_failed" };
  }

  await step.run("persist-result", () =>
    appendCarouselMessage(userId, threadId, {
      gen: gen.data,
      kind: extracted.kind,
      topic,
      templateId,
    }),
  );
  return { status: "done" };
}

export const chatCarousel = inngest.createFunction(
  {
    id: "chat-carousel-from-url",
    retries: 2,
    concurrency: { limit: 3, key: "event.data.userId" },
  },
  { event: "chat/carousel-from-url.run" },
  runChatCarousel,
);
```

Note: the test uses step names `extract`, `condense`, `generate`, `persist-result` for the happy path — they match. Error branches use distinct names (`persist-extract-error` etc.) so step IDs stay unique per run.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/inngest/__tests__/chat-carousel.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/inngest/functions/chat-carousel.ts lib/inngest/__tests__/chat-carousel.test.ts
git commit -m "feat(inngest): chat-carousel job — url to carousel as durable steps"
```

---

## Task 5: Register the function in the Inngest route

**Files:**
- Modify: `app/api/inngest/route.ts`

- [ ] **Step 1: Add the import and register the function**

In `app/api/inngest/route.ts`, add this import after the `analyst` import:

```ts
import { chatCarousel } from "@/lib/inngest/functions/chat-carousel";
```

Then change the `functions` array in `serve({...})` from:

```ts
  functions: [topicMiner, carouselFactory, publisher, analyst],
```

to:

```ts
  functions: [topicMiner, carouselFactory, publisher, analyst, chatCarousel],
```

- [ ] **Step 2: Verify the module loads cleanly**

Add a smoke assertion. In `lib/inngest/__tests__/agents.test.ts`, inside the `it("topic-miner / carousel-factory / publisher / analyst export createFunction objects", ...)` test, after the `const an = await import(...)` line add:

```ts
    const cc = await import("@/lib/inngest/functions/chat-carousel");
    expect(cc.chatCarousel).toBeTruthy();
```

- [ ] **Step 3: Run the smoke test**

Run: `npx vitest run lib/inngest/__tests__/agents.test.ts`
Expected: PASS — all tests, including the extended smoke assertion.

- [ ] **Step 4: Commit**

```bash
git add app/api/inngest/route.ts lib/inngest/__tests__/agents.test.ts
git commit -m "feat(inngest): register chat-carousel function in serve()"
```

---

## Task 6: Rewrite the `carousel_from_url` chat tool

**Files:**
- Modify: `lib/chat/tools.ts`
- Modify: `app/api/chat/route.ts`
- Modify: `lib/chat/system-prompt.ts`
- Test: `lib/chat/__tests__/carousel-from-url.test.ts` (rewrite)

The tool stops doing extract/condense/generate inline. It validates tier, fast-rejects unsupported URLs via `classifyUrl`, sends the Inngest event, and returns a placeholder.

- [ ] **Step 1: Rewrite the test**

Replace the entire contents of `lib/chat/__tests__/carousel-from-url.test.ts` with:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/lib/inngest/client", () => ({ inngest: { send } }));
vi.mock("@/lib/posthog", () => ({ captureEvent: vi.fn() }));

import { buildTools } from "../tools";
import type { ToolContext } from "../tools";

function ctxFor(tier: "free" | "start" | "creator" | "pro"): ToolContext {
  return {
    userId: `user-${tier}`,
    threadId: "thread-1",
    supabase: {} as ToolContext["supabase"],
    profile: { subscription_tier: tier } as ToolContext["profile"],
    baseUrl: "http://localhost:3000",
  };
}

const ARTICLE_URL = "https://habr.com/ru/articles/123456/";
const YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

async function callTool(
  ctx: ToolContext,
  args: { url: string; slideCount?: number; templateId?: string },
) {
  const tools = buildTools(ctx);
  return tools.carousel_from_url.execute!(
    { url: args.url, slideCount: args.slideCount ?? 7, templateId: args.templateId },
    { toolCallId: "t", messages: [] },
  ) as Promise<import("../tools").ToolResult>;
}

describe("chat carousel_from_url tool (async)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    send.mockResolvedValue(undefined);
  });

  it("blocks free-tier users with tier_locked, does not dispatch a job", async () => {
    const res = await callTool(ctxFor("free"), { url: ARTICLE_URL });
    expect(res.ok).toBe(false);
    expect((res.data as { error?: string }).error).toBe("tier_locked");
    expect(send).not.toHaveBeenCalled();
  });

  it("fast-rejects an unsupported URL without dispatching a job", async () => {
    const res = await callTool(ctxFor("pro"), { url: "https://example.com/page" });
    expect(res.ok).toBe(false);
    expect((res.data as { error?: string }).error).toBe("unsupported_url");
    expect(res.ui_hint).toBe("plain");
    expect(send).not.toHaveBeenCalled();
  });

  it("dispatches an Inngest job and returns a pending placeholder for an article", async () => {
    const res = await callTool(ctxFor("pro"), { url: ARTICLE_URL, slideCount: 9 });

    expect(res.ok).toBe(true);
    expect(res.ui_hint).toBe("plain");
    expect((res.data as { pending?: boolean }).pending).toBe(true);
    expect(send).toHaveBeenCalledWith({
      name: "chat/carousel-from-url.run",
      data: {
        userId: "user-pro",
        threadId: "thread-1",
        url: ARTICLE_URL,
        slideCount: 9,
        templateId: "swipely",
      },
    });
  });

  it("dispatches an Inngest job for a YouTube URL", async () => {
    const res = await callTool(ctxFor("creator"), { url: YOUTUBE_URL });
    expect(res.ok).toBe(true);
    expect((res.data as { pending?: boolean }).pending).toBe(true);
    const arg = send.mock.calls[0][0] as { data: { url: string } };
    expect(arg.data.url).toBe(YOUTUBE_URL);
  });

  it("returns ok:false (not a false 'pending') when inngest.send throws", async () => {
    send.mockRejectedValue(new Error("inngest down"));
    const res = await callTool(ctxFor("pro"), { url: ARTICLE_URL });
    expect(res.ok).toBe(false);
    expect(res.ui_hint).toBe("plain");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/chat/__tests__/carousel-from-url.test.ts`
Expected: FAIL — `threadId` not on `ToolContext`, tool still does the old synchronous flow.

- [ ] **Step 3: Update the imports in `tools.ts`**

In `lib/chat/tools.ts`, change the import line:

```ts
import { extractFromUrl, condenseSourceText } from "@/lib/content/url-source";
import { containsInjection } from "@/lib/ai-utils";
```

to:

```ts
import { classifyUrl } from "@/lib/content/url-source";
import { inngest } from "@/lib/inngest/client";
```

- [ ] **Step 4: Add `threadId` to `ToolContext`**

In `lib/chat/tools.ts`, in the `ToolContext` interface, add the `threadId` field after `userId`:

```ts
export interface ToolContext {
  userId: string;
  threadId: string;
  supabase: SupabaseClient;
  profile: Profile | null;
  baseUrl: string;
  cookieHeader?: string;
}
```

- [ ] **Step 5: Replace the `carousel_from_url` tool body**

In `lib/chat/tools.ts`, replace the entire `carousel_from_url: tool({ ... }),` definition (currently the block from `carousel_from_url: tool({` to its closing `}),`) with:

```ts
    carousel_from_url: tool({
      description:
        "Запустить сборку карусели из статьи или YouTube-видео по ссылке. Используй, когда пользователь прислал URL статьи или видео и просит карусель. Сборка идёт в фоне — карточка появится в чате через пару минут.",
      inputSchema: z.object({
        url: z.string().url().describe("Ссылка на статью или YouTube-видео"),
        slideCount: z.number().int().min(3).max(15).optional().default(7),
        templateId: z.string().optional().describe("ID шаблона из реестра"),
      }),
      execute: async ({ url, slideCount, templateId }) => trackTool(ctx, "carousel_from_url", async (): Promise<ToolResult> => {
        try {
          const tier = ctx.profile?.subscription_tier ?? "free";
          if (tier === "free") {
            return {
              ok: false,
              summary: "Генерация из ссылки доступна на платных тарифах. Оформи подписку, чтобы собирать карусели из статей и видео.",
              data: { error: "tier_locked" },
              ui_hint: "plain",
            };
          }

          const cleanUrl = url.trim();
          if (classifyUrl(cleanUrl).kind === "unsupported") {
            return {
              ok: false,
              summary: "Поддерживаю только статьи и YouTube-видео. Пришли текст тезисами или другую ссылку.",
              data: { error: "unsupported_url" },
              ui_hint: "plain",
            };
          }

          try {
            await inngest.send({
              name: "chat/carousel-from-url.run",
              data: {
                userId: ctx.userId,
                threadId: ctx.threadId,
                url: cleanUrl,
                slideCount: slideCount ?? 7,
                templateId: templateId ?? "swipely",
              },
            });
          } catch (e) {
            return fail("Сервис генерации временно недоступен — попробуй чуть позже.", e);
          }

          return {
            ok: true,
            summary: "Принял ссылку — собираю карусель. Это пара минут: видео и статьи обрабатываю в фоне. Карточка появится прямо в этом чате.",
            data: { pending: true },
            ui_hint: "plain",
          };
        } catch (e) {
          return fail("Ошибка при запуске сборки карусели из ссылки", e);
        }
      }),
    }),
```

- [ ] **Step 6: Pass `threadId` into `buildTools` in the chat route**

In `app/api/chat/route.ts`, change the `buildTools({...})` call (around line 272) from:

```ts
  const tools = buildTools({
    userId: user.id,
    supabase: admin,
    profile,
    baseUrl,
    cookieHeader,
  });
```

to:

```ts
  const tools = buildTools({
    userId: user.id,
    threadId: capturedThreadId,
    supabase: admin,
    profile,
    baseUrl,
    cookieHeader,
  });
```

Note: `capturedThreadId` is declared lower in the file (`const capturedThreadId = threadId;`). Move that declaration up to just above the `buildTools` call so it is in scope. Concretely, in `app/api/chat/route.ts` delete the existing line `const capturedThreadId = threadId;` and add it immediately before `const tools = buildTools({`.

- [ ] **Step 7: Update the system prompt**

In `lib/chat/system-prompt.ts`, replace line 72 (the `carousel_from_url(...)` description line) with:

```ts
- carousel_from_url({ url, slideCount?, templateId? }) — запускает фоновую сборку карусели из ссылки на статью или YouTube-видео. Возвращает подтверждение «собираю», а готовая карточка приходит в чат отдельным сообщением через пару минут. Не обещай мгновенный результат. Только на платных тарифах.
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npx vitest run lib/chat/__tests__/carousel-from-url.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 9: Run the full chat test folder to catch regressions**

Run: `npx vitest run lib/chat/`
Expected: PASS — all chat tests (the `ToolContext` change must not break other tool tests; if another test builds a `ToolContext` literal it will need `threadId` added — fix any such literal by adding `threadId: "thread-test"`).

- [ ] **Step 10: Commit**

```bash
git add lib/chat/tools.ts app/api/chat/route.ts lib/chat/system-prompt.ts lib/chat/__tests__/carousel-from-url.test.ts
git commit -m "feat(chat): carousel_from_url dispatches a background job"
```

---

## Task 7: `hasPendingJob` helper

**Files:**
- Create: `lib/chat/pending-job.ts`
- Test: `lib/chat/__tests__/pending-job.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/chat/__tests__/pending-job.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { UIMessage } from "ai";
import { hasPendingJob } from "../pending-job";

function msg(role: "user" | "assistant", parts: unknown[]): UIMessage {
  return { id: `m-${Math.random()}`, role, parts } as unknown as UIMessage;
}

const pendingPart = {
  type: "tool-carousel_from_url",
  toolCallId: "t1",
  state: "output-available",
  output: { ok: true, ui_hint: "plain", data: { pending: true } },
};

describe("hasPendingJob", () => {
  it("returns true when the last assistant message holds a pending tool result", () => {
    expect(hasPendingJob([msg("user", [{ type: "text", text: "x" }]), msg("assistant", [pendingPart])]))
      .toBe(true);
  });

  it("unwraps the AI SDK { type:'json', value } persisted wrapper", () => {
    const wrapped = {
      type: "tool-carousel_from_url",
      state: "output-available",
      output: { type: "json", value: { ok: true, data: { pending: true } } },
    };
    expect(hasPendingJob([msg("assistant", [wrapped])])).toBe(true);
  });

  it("returns false when the last message is from the user", () => {
    expect(hasPendingJob([msg("user", [{ type: "text", text: "x" }])])).toBe(false);
  });

  it("returns false for a finished carousel result (no pending flag)", () => {
    const done = {
      type: "tool-carousel_from_url",
      state: "output-available",
      output: { ok: true, ui_hint: "carousel_card", data: { slides: [] } },
    };
    expect(hasPendingJob([msg("assistant", [done])])).toBe(false);
  });

  it("returns false for an empty message list", () => {
    expect(hasPendingJob([])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/chat/__tests__/pending-job.test.ts`
Expected: FAIL — cannot find module `../pending-job`.

- [ ] **Step 3: Write the implementation**

Create `lib/chat/pending-job.ts`:

```ts
import type { UIMessage } from "ai";

/** Unwrap the AI SDK's persisted { type:"json", value } tool-output wrapper. */
function unwrapOutput(output: unknown): unknown {
  if (
    output &&
    typeof output === "object" &&
    (output as { type?: unknown }).type === "json" &&
    "value" in output
  ) {
    return (output as { value: unknown }).value;
  }
  return output;
}

/**
 * True when the last message is an assistant turn whose tool result is a
 * still-running background job — the carousel_from_url placeholder carries
 * `data.pending === true`. Drives ChatHub's poll for the eventual job
 * result message written by the chat-carousel Inngest function.
 */
export function hasPendingJob(messages: UIMessage[]): boolean {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant") return false;
  for (const p of last.parts) {
    if (!p || typeof p !== "object" || !("type" in p)) continue;
    const type = (p as { type: string }).type;
    if (type !== "dynamic-tool" && !type.startsWith("tool-")) continue;
    const tp = p as { state?: string; output?: unknown };
    if (tp.state !== "output-available") continue;
    const output = unwrapOutput(tp.output) as
      | { data?: { pending?: unknown } }
      | undefined;
    if (output?.data?.pending === true) return true;
  }
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/chat/__tests__/pending-job.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/chat/pending-job.ts lib/chat/__tests__/pending-job.test.ts
git commit -m "feat(chat): hasPendingJob helper for background-job polling"
```

---

## Task 8: `pollThreadForJobResult` — the poll loop

**Files:**
- Create: `lib/chat/poll-thread.ts`
- Test: `lib/chat/__tests__/poll-thread.test.ts`

The poll loop is extracted React-free so it can be unit-tested without timers
or rendering. `wait` is injectable — tests pass an instant resolver, so the
test is deterministic, not flaky. ChatHub (Task 9) wires React state into it.

- [ ] **Step 1: Write the failing test**

Create `lib/chat/__tests__/poll-thread.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import type { ChatMessage } from "@/lib/chat/queries";
import { pollThreadForJobResult } from "../poll-thread";
import type { PollThreadOptions } from "../poll-thread";

function msgs(n: number): ChatMessage[] {
  return Array.from({ length: n }, (_, i) => ({ id: `m-${i}` }) as ChatMessage);
}

function baseOpts(over: Partial<PollThreadOptions>): PollThreadOptions {
  return {
    threadId: "thread-1",
    startCount: 2,
    isCancelled: () => false,
    fetchMessages: vi.fn(),
    onResult: vi.fn(),
    onStalled: vi.fn(),
    wait: () => Promise.resolve(),
    intervalMs: 1,
    maxAttempts: 3,
    ...over,
  };
}

describe("pollThreadForJobResult", () => {
  it("calls onResult when the thread grows past startCount", async () => {
    const fetchMessages = vi
      .fn()
      .mockResolvedValueOnce(msgs(2)) // no growth yet
      .mockResolvedValueOnce(msgs(3)); // job result landed
    const opts = baseOpts({ fetchMessages });
    await pollThreadForJobResult(opts);
    expect(opts.onResult).toHaveBeenCalledWith(msgs(3));
    expect(opts.onStalled).not.toHaveBeenCalled();
  });

  it("calls onStalled when the result never appears within maxAttempts", async () => {
    const fetchMessages = vi.fn().mockResolvedValue(msgs(2));
    const opts = baseOpts({ fetchMessages });
    await pollThreadForJobResult(opts);
    expect(opts.onStalled).toHaveBeenCalledOnce();
    expect(opts.onResult).not.toHaveBeenCalled();
    expect(fetchMessages).toHaveBeenCalledTimes(3);
  });

  it("stops without calling either callback once cancelled", async () => {
    let cancelled = false;
    const fetchMessages = vi.fn().mockImplementation(async () => {
      cancelled = true; // simulate thread navigation mid-fetch
      return msgs(3); // would trigger onResult if the cancel check were missing
    });
    const opts = baseOpts({ fetchMessages, isCancelled: () => cancelled });
    await pollThreadForJobResult(opts);
    expect(opts.onResult).not.toHaveBeenCalled();
    expect(opts.onStalled).not.toHaveBeenCalled();
  });

  it("keeps polling when fetchMessages throws a transient error", async () => {
    const fetchMessages = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(msgs(3));
    const opts = baseOpts({ fetchMessages });
    await pollThreadForJobResult(opts);
    expect(opts.onResult).toHaveBeenCalledWith(msgs(3));
  });

  it("keeps polling when fetchMessages returns null", async () => {
    const fetchMessages = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(msgs(3));
    const opts = baseOpts({ fetchMessages });
    await pollThreadForJobResult(opts);
    expect(opts.onResult).toHaveBeenCalledWith(msgs(3));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/chat/__tests__/poll-thread.test.ts`
Expected: FAIL — cannot find module `../poll-thread`.

- [ ] **Step 3: Write the implementation**

Create `lib/chat/poll-thread.ts`:

```ts
import type { ChatMessage } from "@/lib/chat/queries";

export interface PollThreadOptions {
  threadId: string;
  /** Message count when polling began — a larger count means the result landed. */
  startCount: number;
  /** Fetch the thread's messages, or null on a transient/HTTP error. */
  fetchMessages: (threadId: string) => Promise<ChatMessage[] | null>;
  /** Polling stops immediately once this returns true (thread navigation). */
  isCancelled: () => boolean;
  onResult: (messages: ChatMessage[]) => void;
  onStalled: () => void;
  /** Injectable for tests; defaults to setTimeout. */
  wait?: (ms: number) => Promise<void>;
  intervalMs?: number;
  maxAttempts?: number;
}

const DEFAULT_INTERVAL_MS = 4000;
// ~5 min at 4s — covers a slow YouTube job plus Inngest step retries.
const DEFAULT_MAX_ATTEMPTS = 75;

/**
 * Poll a chat thread until a background-job result message appears — the
 * chat-carousel Inngest job writes the carousel as a follow-up message.
 * React-free: ChatHub wires component state into the callbacks.
 */
export async function pollThreadForJobResult(
  opts: PollThreadOptions,
): Promise<void> {
  const wait =
    opts.wait ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const maxAttempts = opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  for (let i = 0; i < maxAttempts; i++) {
    await wait(intervalMs);
    if (opts.isCancelled()) return;

    let messages: ChatMessage[] | null;
    try {
      messages = await opts.fetchMessages(opts.threadId);
    } catch {
      continue; // transient error — keep polling
    }
    if (opts.isCancelled()) return;

    if (messages && messages.length > opts.startCount) {
      opts.onResult(messages);
      return;
    }
  }
  if (!opts.isCancelled()) opts.onStalled();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/chat/__tests__/poll-thread.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/chat/poll-thread.ts lib/chat/__tests__/poll-thread.test.ts
git commit -m "feat(chat): pollThreadForJobResult — React-free job-result poll loop"
```

---

## Task 9: Wire the poll loop into ChatHub

**Files:**
- Modify: `components/dashboard/conv/ChatHub.tsx`

This is thin React wiring around the Task 8 loop (already unit-tested). The
effect glue itself is verified end-to-end in Task 10.

- [ ] **Step 1: Add the imports**

In `components/dashboard/conv/ChatHub.tsx`, add after the existing `import type { ChatMessage } ...` line:

```ts
import { hasPendingJob } from "@/lib/chat/pending-job";
import { pollThreadForJobResult } from "@/lib/chat/poll-thread";
```

- [ ] **Step 2: Add the poll state and ref**

In `ChatHub.tsx`, after the line `const [resuming, setResuming] = useState(false);`, add:

```ts
  // Set when a background-job poll gives up (carousel_from_url runs async via
  // Inngest — the carousel lands as a later message; this guards the timeout).
  const [jobStalled, setJobStalled] = useState(false);
  const jobPollRef = useRef<object | null>(null);
```

- [ ] **Step 3: Add the poll effect**

In `ChatHub.tsx`, immediately after the auto-scroll `useEffect` (the one ending `}, [messages, status]);`), add:

```ts
  // Poll for a background-job (carousel_from_url) result. The assistant turn
  // ends with a "собираю" placeholder; the real carousel is written later by
  // the chat-carousel Inngest job. Covers both the live case and a reload
  // mid-job. The token guards against starting a second loop; the loop is
  // cancelled only on thread navigation (the cleanup effect below).
  useEffect(() => {
    if (status !== "ready" || !threadId) return;
    if (jobPollRef.current) return;
    if (!hasPendingJob(messages)) return;

    const token = {};
    jobPollRef.current = token;
    setResuming(true);
    setJobStalled(false);

    void pollThreadForJobResult({
      threadId,
      startCount: messages.length,
      isCancelled: () => jobPollRef.current !== token,
      fetchMessages: async (id) => {
        const res = await fetch(`/api/chat/threads/${id}/messages`, {
          cache: "no-store",
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { messages?: ChatMessage[] };
        return data.messages ?? [];
      },
      onResult: (msgs) => {
        setMessages(chatMessagesToUIMessages(msgs));
        setResuming(false);
        jobPollRef.current = null;
      },
      onStalled: () => {
        setResuming(false);
        setJobStalled(true);
        jobPollRef.current = null;
      },
    });
  }, [status, threadId, messages, setMessages]);

  // Cancel an in-flight job poll when the user navigates to another thread.
  useEffect(() => {
    return () => {
      jobPollRef.current = null;
    };
  }, [threadId]);
```

- [ ] **Step 4: Reset `jobStalled` on a new submission**

In `ChatHub.tsx`, in the `onSubmit` function, after the `clearError?.();` line, add:

```ts
    setJobStalled(false);
```

- [ ] **Step 5: Render the stalled message**

In `ChatHub.tsx`, inside the `active && (...)` block, immediately after the `{error && (...)}` block (after its closing `)}`), add:

```tsx
              {jobStalled && (
                <AssistantRow>
                  <div className={styles.botText}>
                    Сборка карусели затянулась. Открой чат чуть позже или
                    пришли ссылку ещё раз.
                  </div>
                </AssistantRow>
              )}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep "ChatHub.tsx" || echo "no ChatHub type errors"`
Expected: `no ChatHub type errors`.

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/conv/ChatHub.tsx
git commit -m "feat(chat): wire job-result polling into ChatHub"
```

---

## Task 10: Full verification

- [ ] **Step 1: Run the whole test suite**

Run: `npx vitest run`
Expected: PASS — all tests, no regressions.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds. Note — per project memory `npm run build` can fail locally on the Cyrillic path (Turbopack bug); if it fails only with a path-encoding error, verify via CI / an ASCII-path clone instead and record that in the task notes.

- [ ] **Step 3: Manual end-to-end check (local dev)**

Prerequisites: `npm run dev` running, and the Inngest dev server running (`npx inngest-cli dev`) so the event is picked up. `CRON_SECRET` must be set in `.env.local`.

1. Open the chat, send: `Сделай карусель из этого материала: https://www.youtube.com/watch?v=Baa71rPgxvA`
2. Expect within ~2s: an assistant message "Принял ссылку — собираю карусель…" and a streaming cursor (poll active).
3. In the Inngest dev dashboard, confirm `chat/carousel-from-url.run` ran the function with steps `extract` → `condense` → `generate` → `persist-result`.
4. Within ~2-3 min the carousel card appears in the thread as a new assistant message.
5. Reload the page mid-job → the placeholder loads from history and polling resumes; the card still appears.
6. Send a clearly broken link (`https://example.com/x`) → immediate "Поддерживаю только статьи и YouTube-видео…", no job dispatched.

- [ ] **Step 4: Commit any fixes**

If steps 1-3 surfaced issues, fix them, re-run `npx vitest run`, and commit with a descriptive `fix(...)` message.

---

## Notes / Known Limitations

- If the user sends another chat message while a job is still running, the live poll stops detecting the placeholder (it is no longer the last message); the carousel still lands in the DB and shows on the next reload. Accepted MVP tradeoff — consistent with the spec's YAGNI section.
- `/api/generate`'s internal path skips onboarding email triggers (`first_gen_followup`, `limit_reached`) because the job has no user email. Acceptable — those emails fire on the user's own direct generations.
- The `/api/generate` route has no full integration test (pre-existing). Task 2 covers the new auth logic via the `resolveInternalUserId` unit tests plus two route-level 401 rejection tests; the positive internal-auth path is covered by the Task 10 manual check.
