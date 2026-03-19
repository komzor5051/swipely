# Technology Stack Research — Milestone 2

**Project:** Swipely — Rich Carousels + Content Planning
**Researched:** 2026-03-19
**Scope:** swipely-nextjs only. Bot untouched.
**Overall confidence:** HIGH (decisions grounded in codebase audit + verified sources)

---

## Context: What Already Exists

The stack is fixed: Next.js 16, React 19, Tailwind v4, Supabase, Gemini, Zustand.

Current slide schema:
```ts
interface SlideData {
  type: string;        // hook | tension | value | accent | insight | cta
  title: string;       // may contain <hl>word</hl> tags
  content: string;
  imageUrl?: string;   // base64 data URL, Photo Mode only
}
```

Current export pipeline: React slide components rendered in DOM → `html2canvas` → PNG.

No Supabase Storage used anywhere yet. Images are either AI-generated (base64 inline) or absent.

---

## Decision 1: SVG Charts for html2canvas

### The Problem

Canvas-based chart libraries (Chart.js, Recharts AnimatedChart, ECharts) fail silently or partially with html2canvas because:
- They render to a `<canvas>` element internally
- html2canvas captures canvas elements as empty or low-fidelity bitmaps
- Animation state causes timing issues during capture

Recharts renders via SVG but has documented issues with html2canvas: SVG lines disappear in non-Chrome browsers, external fonts referenced in SVG don't embed, and CSS variables in SVG attributes are not resolved. Confirmed across multiple GitHub issues (#1543, #95, #2990 on html2canvas repo).

### The Verdict: Hand-Written SVG React Components

Do not install any chart library. Write minimal purpose-built React SVG components for bar and pie charts. This is the only approach that guarantees html2canvas fidelity across all browsers.

Pure SVG is fully supported by html2canvas when:
1. All styles are inline (no CSS classes, no CSS variables)
2. No external resources (no `<image href>` pointing to URLs)
3. No filters or `mix-blend-mode` (html2canvas does not support these)
4. SVG has explicit `width` and `height` attributes (not just `viewBox`)

### Implementation: BarChart Component

```tsx
// components/slides/charts/BarChart.tsx
interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  color: string;        // single accent color from template
  bgColor: string;      // bar track background
  labelColor: string;   // text color for labels/values
  width: number;
  height: number;
}

export function BarChart({ data, color, bgColor, labelColor, width, height }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value));
  const barHeight = Math.floor((height - 40) / data.length) - 8;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {data.map((d, i) => {
        const barWidth = Math.round((d.value / max) * (width - 100));
        const y = i * (barHeight + 8);
        return (
          <g key={i}>
            {/* Track */}
            <rect x={0} y={y} width={width - 100} height={barHeight} fill={bgColor} rx={4} />
            {/* Fill */}
            <rect x={0} y={y} width={barWidth} height={barHeight} fill={color} rx={4} />
            {/* Label */}
            <text
              x={width - 95}
              y={y + barHeight / 2 + 5}
              fill={labelColor}
              fontSize={14}
              fontWeight="600"
              fontFamily="sans-serif"
            >
              {d.label}
            </text>
            {/* Value */}
            <text
              x={barWidth - 8}
              y={y + barHeight / 2 + 5}
              fill={labelColor}
              fontSize={13}
              textAnchor="end"
              fontFamily="sans-serif"
            >
              {d.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

### Implementation: PieChart Component

```tsx
// components/slides/charts/PieChart.tsx
// Uses SVG stroke-dasharray technique — no path math required.
interface PieSlice { label: string; value: number; color: string }

export function PieChart({ slices, size = 160 }: { slices: PieSlice[]; size?: number }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
         xmlns="http://www.w3.org/2000/svg">
      {slices.map((s, i) => {
        const dashArray = `${(s.value / total) * circumference} ${circumference}`;
        const rotation = (offset / total) * 360 - 90;
        offset += s.value;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={20}
            strokeDasharray={dashArray}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
    </svg>
  );
}
```

### Rationale

- Zero new dependencies
- Every style value is computed and passed as a prop — no CSS class resolution at capture time
- Recharts (already installed for the admin analytics page) is NOT used for slide rendering — it stays in `/admin` only
- `html-to-image` (also already installed) handles SVG better than html2canvas via the foreignObject/XMLSerializer path, but switching the entire export pipeline is out of scope for this milestone. The hand-written SVG approach removes the need for that switch.

**Confidence: HIGH** — cross-referenced against html2canvas GitHub issues and community reports.

---

## Decision 2: Slide Layout + Rich Elements JSON Schema

### Current State

Gemini returns:
```json
{ "type": "hook", "title": "...", "content": "..." }
```

All slide templates receive the same `SlideData` shape. Layout logic is derived from `slide.type` via `getLayoutVariant()` in `utils.tsx` — a fixed mapping with no override mechanism.

### Extended Schema

Add two optional fields: `layout` and `elements`.

```ts
// components/slides/types.ts — extended

export type SlideLayout =
  | "default"       // existing behavior, title top + content below
  | "text-left"     // text block occupies left 55%, right side blank / decorative
  | "text-right"    // mirror of text-left
  | "big-number"    // oversized stat dominates center, label + caption below
  | "quote-center"  // quote text centered, large font, attribution at bottom
  | "split";        // left half text, right half image (userPhotoUrl or solid color)

export type SlideElementType = "list" | "stat" | "bar-chart" | "pie-chart" | "progress";

export interface SlideElement {
  type: SlideElementType;
  // list
  items?: string[];
  // stat / big-number
  value?: string;       // "47%", "3x", "$12k"
  label?: string;
  // bar-chart / pie-chart
  data?: Array<{ label: string; value: number; color?: string }>;
  // progress
  percent?: number;
  caption?: string;
}

export interface SlideData {
  type: string;
  title: string;
  content: string;
  imageUrl?: string;        // base64 data URL — Photo Mode (AI-generated)
  userPhotoUrl?: string;    // Supabase Storage public URL — user-uploaded photo
  layout?: SlideLayout;     // AI-chosen or default
  elements?: SlideElement[]; // rich content blocks rendered below title/content
}
```

### How Gemini Populates This

The system prompt for templates that support rich elements must be extended. Add a new instruction block:

```
RICH ELEMENTS (optional — use when content benefits from visual structure):
- "elements": array of objects, each with "type" field
- type "list": use for 3-6 enumerable points instead of prose content
  { "type": "list", "items": ["point 1", "point 2", "point 3"] }
- type "stat": use for accent slides with a single key number
  { "type": "stat", "value": "73%", "label": "конверсия вырастает" }
- type "bar-chart": use when comparing 3-5 values (survey results, percentages)
  { "type": "bar-chart", "data": [{"label": "Вариант А", "value": 65}, {"label": "Вариант Б", "value": 35}] }
- type "pie-chart": use for composition/share breakdowns (2-4 slices)
  { "type": "pie-chart", "data": [{"label": "Да", "value": 73}, {"label": "Нет", "value": 27}] }

LAYOUTS (AI must choose one per slide):
- "default" — standard vertical layout (use for most slides)
- "big-number" — when slide has a single stat element, make it dominant
- "quote-center" — for insight or cta slides with a short powerful statement
- "split" — when userPhotoUrl is present on this slide
```

### Layout Rendering Pattern

Each slide template switches on `slide.layout` to render the appropriate composition. Template components receive `SlideData` unchanged — the `layout` field drives internal composition:

```tsx
// Inside each slide template
const layout = slide.layout ?? "default";

if (layout === "big-number" && slide.elements?.[0]?.type === "stat") {
  return <BigNumberComposition slide={slide} {...templateStyles} />;
}
if (layout === "quote-center") {
  return <QuoteCenterComposition slide={slide} {...templateStyles} />;
}
// default: existing rendering
```

Create shared composition components in `components/slides/compositions/` so all templates can reuse them:
- `BigNumberComposition.tsx`
- `QuoteCenterComposition.tsx`
- `SplitPhotoComposition.tsx`
- `RichElementsRenderer.tsx` (renders `elements[]` array below content)

**Confidence: HIGH** — extends the existing pattern already in the codebase without breaking any existing template.

---

## Decision 3: Photo Upload to Supabase Storage

### Recommended Pattern: Signed URL via Server Action

Do NOT upload through an API route body. Next.js imposes a 1MB body limit on server actions by default, and carousel photos (JPEG from phone) will routinely exceed this.

The correct pattern:
1. Client requests a signed upload URL from a Next.js API route (passes user auth cookie, no file data)
2. Server generates the signed URL using service_role key, returns `{ signedUrl, token, path }`
3. Client uploads directly to Supabase Storage using the signed URL — file never touches your server
4. After upload, server issues a public URL or a signed read URL

```ts
// app/api/storage/signed-upload-url/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { fileName, contentType } = await req.json();
  const ext = fileName.split(".").pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("user-photos")
    .createSignedUploadUrl(path);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ signedUrl: data.signedUrl, token: data.token, path });
}
```

```ts
// Client component upload handler
async function uploadPhoto(file: File): Promise<string> {
  // Step 1: get signed URL
  const { signedUrl, token, path } = await fetch("/api/storage/signed-upload-url", {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
    headers: { "Content-Type": "application/json" },
  }).then(r => r.json());

  // Step 2: upload directly to Supabase Storage
  const { error } = await supabase.storage
    .from("user-photos")
    .uploadToSignedUrl(path, token, file);

  if (error) throw error;

  // Step 3: get public URL
  const { data } = supabase.storage.from("user-photos").getPublicUrl(path);
  return data.publicUrl;
}
```

### Bucket Setup

Bucket: `user-photos`
- Public bucket (for simplicity — images are carousels, not private documents)
- RLS policy on bucket: users can only upload to paths starting with their `user_id`
- Max file size: 5MB (enforce in client before requesting signed URL)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

```sql
-- Supabase Storage bucket policy
create policy "Users upload own photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'user-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public read user photos"
on storage.objects for select
to public
using (bucket_id = 'user-photos');
```

### How Photo URL Enters the Slide

The uploaded URL goes into `SlideData.userPhotoUrl`. This is distinct from `imageUrl` (which is AI-generated base64). The slide template checks `userPhotoUrl` first for split/background compositions, falls back to `imageUrl`, falls back to no photo.

**When rendering for html2canvas export**, the public Supabase Storage URL must be fetched and converted to a base64 data URL before capture — same pattern as currently used for `imageUrl`. html2canvas cannot load cross-origin URLs without a CORS proxy.

```ts
// utils: fetchImageAsBase64.ts
export async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
```

Call this before triggering html2canvas export, replace `userPhotoUrl` with the resulting base64 string in the slide data passed to the renderer.

**Confidence: HIGH** — Supabase signed URL upload pattern verified against official docs.

---

## Decision 4: Content Calendar Data Model

### Table Schema

```sql
-- content_plans table
create table content_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,          -- e.g. "Ноябрь 2026 — Маркетинг для кофеен"
  niche       text not null,          -- user input that Gemini used to generate this plan
  month_year  text not null,          -- "2026-11" (ISO year-month for display grouping)
  items       jsonb not null,         -- array of ContentPlanItem[]
  created_at  timestamptz default now()
);

-- RLS
alter table content_plans enable row level security;

create policy "Users own their content plans"
on content_plans
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Index for fast user queries
create index content_plans_user_id_idx on content_plans(user_id);
```

### items JSONB Schema

```ts
interface ContentPlanItem {
  day: number;                // 1-30, day of the month
  date: string;               // ISO date "2026-11-01"
  topic: string;              // "Почему кофе в пакете хуже зерновой обжарки"
  post_type: "carousel" | "reel" | "story" | "post";
  tone: "educational" | "entertaining" | "provocative" | "motivational";
  status: "planned" | "generated" | "skipped";
  generation_id?: string;     // references generations.id once carousel is made
}
```

The entire 30-day plan lives in one JSONB column. This is the right trade-off:
- No join complexity for reading/displaying the calendar
- Single row update when user edits a day or marks a topic as generated
- JSONB supports indexing if needed later (`items @> '[{"status":"planned"}]'`)
- 30 items × ~200 bytes per item = ~6KB per plan — well within Postgres limits

Do not normalize items into a separate table for this milestone. There is no query pattern that requires per-item indexing (users always load the entire plan at once).

### Gemini Prompt Pattern

```ts
// POST /api/content-plan/generate
// Prompt: ask Gemini to return a JSON array of 30 ContentPlanItem objects
const systemPrompt = `
Ты — контент-стратег. Создай 30-дневный контент-план для Instagram-аккаунта.

НИША: ${niche}
ПЕРИОД: ${monthLabel}

ПРАВИЛА:
- Каждый день — одна тема. Разнообразие: не более 2 смежных тем подряд.
- Чередуй типы постов: carousel (60%), reel (20%), post (15%), story (5%)
- Чередуй тональность: educational (40%), entertaining (30%), provocative (20%), motivational (10%)
- topic — конкретная идея, 5-10 слов, не абстракция

Верни ТОЛЬКО JSON-массив из 30 объектов:
[
  { "day": 1, "date": "YYYY-MM-DD", "topic": "...", "post_type": "carousel", "tone": "educational", "status": "planned" },
  ...
]
`;
```

### API Route

```
POST /api/content-plan/generate    — Gemini generates 30-day plan, saves to content_plans, returns id
GET  /api/content-plan             — list user's plans (id, title, month_year, created_at)
GET  /api/content-plan/[id]        — full plan with items
PATCH /api/content-plan/[id]       — update items (user edits a topic or marks as skipped)
```

**Confidence: HIGH** — straightforward Supabase schema, no unverified patterns.

---

## Dependency Changes

No new npm packages required for the core milestone. The following are already installed:

| Already Installed | Used for |
|-------------------|----------|
| `recharts` | Admin analytics only — NOT for slides |
| `html-to-image` | Currently unused; consider as a fallback for SVG export if issues arise |
| `@supabase/supabase-js` | Storage upload pattern |
| `lucide-react` | Icons in rich element compositions |
| `zustand` | UI state for content plan page |

The only potential new package: if pie/bar chart math becomes complex, add `d3-shape` (just the shape module, ~8KB) for arc calculations. Avoid the full `d3` bundle.

---

## Summary of Technical Approaches

| Feature | Approach | Why |
|---------|----------|-----|
| Bar chart in slides | Hand-written SVG React component, inline styles only | Only approach that reliably works with html2canvas |
| Pie chart in slides | SVG stroke-dasharray technique, no path math | Same — zero external deps, guaranteed capture |
| Layout variation | `layout` field in SlideData, composition components in `slides/compositions/` | Extends existing pattern, no breaking changes |
| Rich elements | `elements[]` in SlideData, `RichElementsRenderer` component | Additive to schema, AI chooses when to include |
| Photo upload | Signed URL via API route + direct client-to-Storage upload | Avoids 1MB Next.js body limit, security is server-enforced |
| Photo in slides | `userPhotoUrl` field, converted to base64 before html2canvas export | Cross-origin URL cannot be captured directly |
| Content calendar | Single `content_plans` table with JSONB `items[]` | No normalization needed; whole plan loads at once |
| Content calendar generation | Gemini → JSON array of 30 items → save to Supabase | Reuses existing Gemini integration pattern |

---

## html-to-image as Future Export Option

`html-to-image` is already installed (`html-to-image 1.11.13` in STACK.md). It handles SVG, CSS variables, and `mix-blend-mode` better than html2canvas by using `foreignObject` serialization rather than repainting the DOM. If during implementation SVG chart capture produces artifacts with html2canvas, switching the export call from `html2canvas(node)` to `htmlToImage.toPng(node)` is a single-line change. The hand-written SVG approach makes this swap optional rather than required.

---

## Sources

- html2canvas GitHub issues: [#1543](https://github.com/niklasvh/html2canvas/issues/1543), [#95](https://github.com/niklasvh/html2canvas/issues/95), [#2990](https://github.com/niklasvh/html2canvas/issues/2990) — SVG capture failures (MEDIUM confidence, community reports)
- [html-to-image vs html2canvas comparison — npm-compare](https://npm-compare.com/dom-to-image-more,html-to-image,html2canvas) — SVG architecture difference (MEDIUM confidence)
- [Supabase Storage: Create signed upload URL](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) — signed URL pattern (HIGH confidence, official docs)
- [Signed URL file uploads with Next.js and Supabase — Medium](https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0) — server action pattern (MEDIUM confidence)
- Codebase audit: `swipely-nextjs/components/slides/types.ts`, `utils.tsx`, `app/api/generate/route.ts`, `SwipelySlide.tsx` — current schema and rendering (HIGH confidence, direct source)
