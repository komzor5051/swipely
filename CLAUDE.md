# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swipely.ai** - AI-powered Instagram carousel generator with professional design system. Creates viral-ready carousel posts from text using Claude 3.5 Haiku (via OpenRouter), with optional authentication and usage limits via Supabase.

**Tech Stack:**
- React 19 + TypeScript + Vite
- OpenRouter API (Claude 3.5 Haiku: `anthropic/claude-3.5-haiku`)
- Supabase (Auth, PostgreSQL, RLS) - optional for production
- Design: Inline styles with CSS variables, custom animations
- Export: html2canvas for PNG generation
- 25 Google Fonts with category grouping

**Brand Identity:**
- Name: Swipely.ai
- Design System: "Digital Atelier"
- Color Palette: Coral (#FF6B6B), Teal (#0D3B66), Butter (#FFD93D), Warm White (#FAF8F6), Cream (#F4F1EA)
- Typography: DM Serif Display (display), Outfit (body), JetBrains Mono (mono)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Vite Configuration (vite.config.ts):**
- Dev server: port 3000, host 0.0.0.0 (accessible externally for testing)
- Path alias: `@` → project root
- React plugin enabled

## Environment Setup

Required environment variables in `.env.local`:

```bash
# OpenRouter API - for Claude 3.5 Haiku
VITE_OPENROUTER_API_KEY=your_openrouter_key_here

# Supabase - optional for auth and database (can use placeholders for local dev)
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Current Setup (Production):**
- ✅ Supabase Auth ENABLED: https://ijmevkzcpsipyuufjemg.supabase.co
- ✅ Auth checks ACTIVE in App.tsx (lines 140-143) - registration required for generation
- ✅ SQL schema executed (profiles, usage_tracking, projects, payments with RLS policies)
- ✅ Database trigger `handle_new_user()` auto-creates profiles on signup
- ✅ Environment variables configured in .env.local
- Free tier: 5 generations/month (registered users only)
- Pro tier: 50 generations/month for 790₽

## Architecture

### Core Flow

**1. Carousel Generation (src/App.tsx:136-154)**
- User must be authenticated to generate (App.tsx:140-143)
- Opens FormatSettingsModal to configure: language (Russian/English), slide count (3-15), include original text
- After settings confirmed → `generateCarouselContent()` calls Claude 3.5 Haiku via OpenRouter
- AI returns structured JSON: `{ globalDesign: {...}, slides: [...] }`
- **CRITICAL**: `globalDesign` applied to ALL slides for consistency
- Saves to localStorage history (max 10 items, FIFO)
- Tracks usage in Supabase (decrements monthly generation limit)

**2. Visual Editor (src/components/CarouselEditor.tsx)**
- WYSIWYG drag-and-drop interface
- Global controls: pattern (7 types), background/accent colors → affect ALL slides
- Element controls: text, font (25 choices), size, color, position
- Preset system: 7 built-in + user custom presets
- Export: html2canvas renders all slides to PNG (540x540px Instagram format)

### Design System: "Digital Atelier"

All colors defined in index.html as CSS variables:

```css
--color-coral: #FF6B6B;        /* Primary accent */
--color-coral-dark: #EE5A6F;
--color-teal: #0D3B66;          /* Secondary accent */
--color-teal-light: #1A5F7A;
--color-butter: #FFD93D;        /* Tertiary accent */
--color-charcoal: #2D3142;      /* Text */
--color-warm-white: #FAF8F6;    /* Background */
--color-cream: #F4F1EA;         /* Secondary background */

--font-display: 'DM Serif Display', serif;
--font-body: 'Outfit', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**Visual Effects:**
- Grain texture overlay (SVG noise filter)
- Floating animated blob shapes (coral, teal, butter)
- Glassmorphism on input fields (backdrop-blur + transparency)
- Coral focus states on all interactive elements
- Custom scrollbar with coral thumb
- Staggered animations with cubic-bezier easing

**Key UI Patterns:**
- All buttons use coral gradient with glow shadow
- All inputs have cream background with coral focus border
- All modals/panels use warm-white background with cream borders
- Icons use teal color, headers use charcoal, labels use teal-light

### Service Layer

**src/services/aiService.ts:**
- `generateCarouselContent(topic, style)` - Core AI function
- Model: `anthropic/claude-3.5-haiku` via OpenRouter
- API endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Prompt enforces Russian language output (КРИТИЧЕСКИ ВАЖНО)
- Returns structured JSON with globalDesign + slides array
- Cleans response: removes ```json markdown wrappers via regex
- Extensive emoji logging: 🚀📡✅❌📦📝🧹
- Shows alert() on errors (for dev mode)
- Headers include HTTP-Referer and X-Title for OpenRouter tracking

**src/services/presetService.ts:**
- 7 built-in presets: modern-blue, minimal-dark, dots-light, stripes-dynamic, grid-tech, sketch-creative, gradient-sunset
- Custom presets saved to localStorage as `instagenius_presets`
- `loadPresets()`, `savePreset()`, `deletePreset()`

**src/services/usageService.ts:**
- `trackGeneration(userId, type)` - logs to usage_tracking table
- `checkUsageLimit(userId)` - calls SQL function `check_generation_limit()`
- Free: 5/month, Pro: 50/month

**src/services/adminService.ts (requires Supabase):**
- Admin functions: `getAllUsers()`, `upgradeUserToPro()`, `downgradeUserToFree()`
- Protected by `isAdmin()` check (src/utils/constants.ts)
- Requires RLS policies for production

### Authentication Flow (Production)

**src/contexts/AuthContext.tsx:**
- Provides: `user`, `profile`, `signIn`, `signUp`, `signOut`
- Auto-creates profile via DB trigger on signup
- Auth is REQUIRED for carousel generation

**Conversion Funnel:**
```
Unregistered user attempts generation
  ↓
AuthModal opens (signup/login)
  ↓
User registers → Email confirmation
  ↓
Free tier activated (5 generations/month)
  ↓
User exhausts limit → LimitReachedModal
  ↓
Upgrade to Pro (790₽/month for 50 generations)
```

**Modals:**
- `AuthModal` - Login/signup with coral gradient buttons (blocks generation until auth)
- `LimitReachedModal` - Blocks generation when limit exhausted, shows upgrade CTA
- `UpgradeModal` - Pricing tiers: Monthly 790₽, Quarterly 2086₽, Yearly 7205₽ (payment integration pending)
- `UsageBadge` - Header badge showing remaining generations
- `FormatSettingsModal` - Configure language, slide count (3-15), include original text

### Font System

25 fonts in 5 categories (loaded via single Google Fonts URL):

- **Sans-Serif (10):** Inter, Montserrat, Poppins, Roboto, Open Sans, Lato, Raleway, Work Sans, Outfit, Space Grotesk
- **Serif (5):** Playfair Display, Merriweather, Lora, Crimson Text, Libre Baskerville
- **Display (5):** Oswald, Bebas Neue, Anton, Righteous, Rubik Mono One
- **Handwriting (3):** Caveat, Pacifico, Dancing Script
- **Monospace (2):** Fira Code, JetBrains Mono

Font selector in CarouselEditor uses `<optgroup>` for organization.

### Style Options

7 background patterns (src/App.tsx:17-72):
- `auto` - AI chooses best for topic
- `solid` - Single background color
- `gradient-tr`, `gradient-bl` - Gradients to top-right/bottom-left
- `dots`, `stripes`, `grid` - Pattern overlays
- `sketch` - Crosshatch pattern

Each has visual preview bubble in style picker dropdown.

## Data Models

**Slide Structure (src/types.ts):**
```typescript
interface Slide {
  id: string;
  backgroundColor: string;
  accentColor: string;
  backgroundPattern: BackgroundPattern;
  elements: TextElement[];
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: FontFamily;
  color: string;
  fontWeight: string;
  width: number;
  textAlign?: 'left' | 'center' | 'right';
  animation?: TextAnimation;
}
```

**Default Element Positioning:**
- Title: x:40, y:60, fontSize:48, textAlign:left
- Content: x:40, y:280, fontSize:24
- Page number: x:40, y:490, fontSize:14, textAlign:right

**AI Generation Response:**
- Model returns `CarouselGenerationResponse` with `globalDesign` and array of slides
- Each slide has `content` (body text) and `title` fields
- globalDesign pattern options: solid, gradient-tr, gradient-bl, dots, stripes, grid, sketch

## Important Patterns

### Global Design Consistency

**CRITICAL**: The `globalDesign` object from AI response is applied to ALL slides via spread operator. The `updateGlobalStyle()` function in CarouselEditor updates all slides simultaneously when user changes background pattern or colors.

### Text Bold Markdown

Elements support `**bold**` syntax:
- `"Узнайте **5 способов** улучшить продажи"`
- Bold text uses slide's `accentColor`
- Rendered by `renderStyledText()` (CarouselEditor.tsx:185-199)

### History System

- Saved to localStorage as `instagenius_history`
- Max 10 items (FIFO - oldest deleted automatically)
- Structure: `{ id, type: 'carousel', timestamp, title, data: Slide[] }`
- Restored via `restoreHistoryItem()` in App.tsx

### LocalStorage Keys

- `instagenius_history` - Generation history (max 10 items)
- `instagenius_presets` - Custom user presets
- Supabase auth tokens (managed by Supabase SDK)

### Export System

Uses html2canvas (CDN-loaded):
1. Hidden container renders all slides off-screen (position: absolute, top: -9999px)
2. Each slide captured at 2x scale for quality
3. Downloads as `slide-1.png`, `slide-2.png`, etc.
4. 300ms delay between downloads prevents browser throttling

### Admin Panel

- Accessible via shield icon in header (only for admins)
- Admin emails in `ADMIN_EMAILS` array (src/utils/constants.ts)
- Features: view users, filter by tier, upgrade/downgrade, view usage
- Requires Supabase + RLS policies for production

## Component Architecture

**Directory Structure:**
```
src/
├── components/
│   ├── Auth/
│   │   └── AuthModal.tsx
│   ├── Admin/
│   │   └── AdminPanel.tsx
│   ├── Subscription/
│   │   ├── UsageBadge.tsx
│   │   ├── UpgradeModal.tsx
│   │   └── LimitReachedModal.tsx
│   ├── Presets/
│   │   ├── PresetManager.tsx
│   │   └── PresetCard.tsx
│   └── CarouselEditor.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── usePresets.ts
│   └── useUsageLimit.ts
├── services/
│   ├── aiService.ts
│   ├── presetService.ts
│   ├── usageService.ts
│   ├── adminService.ts
│   └── supabase.ts
├── utils/
│   └── constants.ts
├── types.ts
├── index.tsx
└── App.tsx
```

**Main Components:**
- `App.tsx` - Shell with generation flow, history sidebar, modals
- `CarouselEditor.tsx` - WYSIWYG editor with all controls
- `PresetManager.tsx` - Preset gallery in editor sidebar
- `AuthModal.tsx` - Login/signup modal
- `UpgradeModal.tsx` - Pricing tiers modal
- `LimitReachedModal.tsx` - Limit warning modal
- `UsageBadge.tsx` - Header usage indicator
- `AdminPanel.tsx` - Admin user management

**State Management:**
- React Context only for auth (`AuthContext`)
- Local useState in App.tsx for slides, history, modals
- Custom hooks: `useAuth()`, `useUsageLimit()`, `usePresets()`

## Database Schema (Optional)

**profiles table:**
- Auto-created on signup via trigger
- Fields: `subscription_tier` ('free' | 'pro'), `subscription_status`
- RLS: users see only their own data

**usage_tracking table:**
- Logs each generation
- Monthly limit via `check_generation_limit(user_id)` SQL function
- Indexed on `(user_id, created_at)`

**RLS Policies:**
- All tables have RLS enabled
- Users can only access their own rows (auth.uid() checks)
- Admin policies needed for AdminPanel (see supabase-schema.sql)

## Debugging

**OpenRouter API Issues:**
- Check `VITE_OPENROUTER_API_KEY` in .env.local
- Model must be exactly: `anthropic/claude-3.5-haiku`
- Common error: "model is not a valid model ID" → typo in model name
- Check credits at https://openrouter.ai/credits
- Response may include markdown wrappers - cleaned via regex
- Console shows detailed emoji logs: 🚀📡✅❌📦📝🧹

**Environment Variables:**
- Must restart dev server after .env.local changes
- All vars must be prefixed with `VITE_`
- Check browser console for "import.meta.env" values

**Export Not Working:**
- Verify html2canvas loaded (check Network tab)
- Check browser popup blocker
- Export container must be rendered but off-screen

**Supabase Issues (if enabled):**
- Verify `check_generation_limit()` function exists
- Check RLS policies allow user operations
- Monthly limit resets automatically via `DATE_TRUNC('month', NOW())`

## Production Status

**✅ Production-Ready Features:**
- Auth enabled and enforced - registration required for generation
- Supabase configured: https://ijmevkzcpsipyuufjemg.supabase.co
- Free tier: 5 generations/month (registered users only)
- Pro tier: 50 generations/month for 790₽
- Format settings: language selection, slide count (3-15), include original
- Full UI/UX with responsive design

**⚠️ Remaining Development Features (should be removed):**
- Extensive console.log() with emojis in aiService.ts
- alert() dialogs on API errors (replace with toast notifications)

**🔧 TODO Before Launch:**
1. Remove debug logging from aiService.ts (console.log with emojis)
2. Replace alert() with proper error UI in aiService.ts
3. Update ADMIN_EMAILS in src/utils/constants.ts with actual admin email
4. Add RLS policies for admin access in Supabase (see supabase-schema.sql comments)
5. **CRITICAL:** Optimize AI prompt to reduce cost from 15₽ to ~8₽ per generation (see economics.txt)
6. Implement payment integration with YooKassa for Pro subscriptions
7. Consider backend proxy for OpenRouter API to secure API key
8. Remove .env.local from version control if committed

## Code Style

- All UI text in Russian
- Phosphor Icons (`ph` classes) via CDN
- Inline styles using CSS variables
- No CSS framework - custom utility classes
- Animations via @keyframes in index.html
- Canvas size: 540x540px (Instagram format)

## Security Considerations

**Current Implementation (Development):**
- OpenRouter API key exposed in frontend (.env.local → VITE_OPENROUTER_API_KEY)
- Anyone with browser DevTools can extract the key
- Acceptable for local development only

**Production Recommendations:**
- Move OpenRouter API calls to backend proxy
- Implement rate limiting on backend
- Use Supabase Edge Functions or separate Node.js server
- Never expose API keys in frontend bundle
- Enable Supabase RLS policies for all tables
- Validate user subscriptions server-side before API calls
