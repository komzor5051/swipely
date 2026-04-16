---
created: 2026-04-10
status: approved
size: L
---

# User Spec: Generation Quality v2

## Problem

AI-generated carousels from Swipely get fewer views/saves than manually created ones. Three root causes:
1. Weak first slides — generic hooks don't stop the scroll
2. No storytelling structure — slides read as lists, not narratives
3. AI tone — averaged-out language, no specifics or personal voice

Additionally, generation failures occur when AI returns malformed JSON, wrong layouts, or exceeds word limits — causing crashes in the renderer.

## Solution

### 1. Multi-Agent Generation Pipeline

Split the single monolithic Gemini call into three specialized agents:

- **Strategist**: Receives topic + tone + framework choice. Outputs: hook type, slide structure, element placement plan, key angles. Small output, fast.
- **Copywriter**: Receives strategy + topic. Writes actual slide content following the structure. Main output.
- **Formatter**: Validates and normalizes the copywriter's output into strict JSON schema for the renderer. Fixes layouts, elements, word counts, strips markdown artifacts. Safety net against generation crashes.

Cost constraint: use flash-lite for all three agents. Total cost must stay within 2-3x of current single-call cost (acceptable given the quality improvement).

### 2. Carousel Frameworks & Hook Library

Replace free-form generation with structured frameworks users can choose:
- "3 mistakes" (mistake callout)
- "Case study" (results breakdown)
- "Step-by-step guide" (how-to)
- "Before/After" (transformation)
- "Myths vs Reality" (stereotype breaking)
- "Checklist" (actionable list)

Each framework defines: hook formula, slide progression, CTA type.

Improve hook formulas from abstract labels ("CONTRARIAN", "SHOCK DATA") to concrete templates with fill-in-the-blank patterns and examples.

### 3. Visual Polish & Stability

- Fix rendering bugs across templates
- Optimize generation speed
- Improve error handling for malformed AI responses
- Template visual improvements where needed

## Constraints

- Generation economics must work (flash-lite only, no expensive models)
- Backward compatibility — existing templates, API contracts, and user data unaffected
- Scope: swipely-nextjs only (bot untouched)
- No new external dependencies or services

## Acceptance Criteria

1. Generation uses 3-agent pipeline (strategist -> copywriter -> formatter)
2. User can select a carousel framework before generation
3. Hook quality is measurably better (concrete formulas, not abstract labels)
4. Formatter prevents generation crashes from malformed AI output
5. All 23 existing templates continue to work
6. Generation cost stays within 3x of current per-carousel
7. No regression in generation speed (< 15 seconds total)
