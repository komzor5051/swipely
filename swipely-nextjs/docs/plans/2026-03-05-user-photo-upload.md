# User Photo Upload — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let PRO users in Standard mode upload their own photos as slide backgrounds, skipping template selection.

**Architecture:** All changes in `app/(dashboard)/generate/page.tsx`. Photos stored as `objectURL[]` in component state. After generation, slides are mapped with `imageUrl` from the photo array. `photo_mode` template hardcoded when photos present.

**Tech Stack:** React state, `URL.createObjectURL`, existing `PhotoSlide` template, existing `/api/generate` route.

**Note:** No test framework exists — skip all test steps, go straight to implementation + commit.

---

### Task 1: Add state, ref, and objectURL cleanup

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx` (around line 135, after `fileInputRef`)

**Step 1: Add uploadedPhotos state and ref**

After `const fileInputRef = useRef<HTMLInputElement>(null);` (line ~132), add:

```tsx
const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
const userPhotoInputRef = useRef<HTMLInputElement>(null);
```

**Step 2: Add cleanup effect for objectURLs**

After the existing resize `useEffect` (around line 125), add a cleanup effect so objectURLs are revoked when component unmounts or photos change:

```tsx
useEffect(() => {
  return () => {
    uploadedPhotos.forEach((url) => URL.revokeObjectURL(url));
  };
}, [uploadedPhotos]);
```

**Step 3: Add `hasUserPhotos` derived variable**

After line ~190 (`const activeTemplate = ...`):

```tsx
const hasUserPhotos = uploadedPhotos.length > 0;
```

**Step 4: Update `activeTemplate`**

Change existing line:
```tsx
// Before:
const activeTemplate = mode === "photo" ? "photo_mode" : selectedTemplate;
// After:
const activeTemplate = (mode === "photo" || hasUserPhotos) ? "photo_mode" : selectedTemplate;
```

**Step 5: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(generate): add uploadedPhotos state and derived activeTemplate"
```

---

### Task 2: Add upload handlers

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx` (after `handleDrop`, around line 258)

**Step 1: Add multi-file upload handler**

After the existing `handleDrop` function, add:

```tsx
const VALID_IMAGE_TYPES = /^image\/(jpeg|png|webp)$/;

const handleUserPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  processUserPhotoFiles(files);
  if (userPhotoInputRef.current) userPhotoInputRef.current.value = "";
};

const processUserPhotoFiles = (files: File[]) => {
  const valid = files.filter((f) => {
    if (f.size > MAX_FILE_SIZE) {
      toast.error(`${f.name}: слишком большой файл (макс. 10 МБ)`);
      return false;
    }
    if (!f.type.match(VALID_IMAGE_TYPES)) {
      toast.error(`${f.name}: поддерживаются только JPEG, PNG, WebP`);
      return false;
    }
    return true;
  });

  if (!valid.length) return;

  setUploadedPhotos((prev) => {
    const next = [...prev, ...valid.map((f) => URL.createObjectURL(f))];
    if (next.length > 12) {
      toast.error("Максимум 12 фото");
      return next.slice(0, 12);
    }
    return next;
  });
};

const handleUserPhotoDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setIsDragging(false);
  const files = Array.from(e.dataTransfer.files);
  processUserPhotoFiles(files);
};

const handleRemoveUserPhoto = (index: number) => {
  setUploadedPhotos((prev) => {
    URL.revokeObjectURL(prev[index]);
    return prev.filter((_, i) => i !== index);
  });
};
```

**Step 2: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(generate): add user photo upload handlers (multi-file, drop, remove)"
```

---

### Task 3: Add photo upload UI block to form step

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx`

**Step 1: Find insertion point**

Find the closing `{/* E. Preserve text toggle */}` block (around line 691). The new block goes right after it, still inside the left column `<div className="space-y-5">`.

**Step 2: Add the upload block**

After the preserve text toggle block (after line `}`  closing the `{mode === "standard" && (...)}` block for preserve text, around line 691), insert:

```tsx
{/* H. User photo upload — Standard mode, PRO only */}
{mode === "standard" && isPro && (
  <FadeIn className="space-y-2">
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-[#0D0D14]">Свои фото</label>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#D4F542] text-[#0D0D14]">PRO</span>
      <span className="text-xs text-[#9CA3AF]">опционально</span>
    </div>

    {uploadedPhotos.length > 0 ? (
      <div className="space-y-3">
        {/* Thumbnails */}
        <div className="flex flex-wrap gap-2">
          {uploadedPhotos.map((url, i) => (
            <div key={url} className="relative">
              <img
                src={url}
                alt={`Фото ${i + 1}`}
                className="w-16 h-16 object-cover rounded-xl border border-[#E8E8E4]"
              />
              <button
                onClick={() => handleRemoveUserPhoto(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0D0D14] text-white flex items-center justify-center shadow hover:bg-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-bold text-white/80">{i + 1}</span>
            </div>
          ))}
          {/* Add more button */}
          {uploadedPhotos.length < 12 && (
            <button
              onClick={() => userPhotoInputRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed border-[#E8E8E4] flex items-center justify-center hover:border-[#D4F542]/50 transition-colors text-[#9CA3AF] hover:text-[#0D0D14]"
            >
              <Upload className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Distribution hint */}
        {uploadedPhotos.length < slideCount && (
          <p className="text-xs text-[#9CA3AF]">
            {uploadedPhotos.length} из {slideCount} слайдов получат фото — остальные на тёмном фоне
          </p>
        )}
        {uploadedPhotos.length >= slideCount && (
          <p className="text-xs text-[#6B7280]">
            ✓ {uploadedPhotos.length} фото → {slideCount} слайдов, шаблон не нужен
          </p>
        )}
      </div>
    ) : (
      <button
        onClick={() => userPhotoInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleUserPhotoDrop}
        className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
          isDragging
            ? "border-[#D4F542] bg-[#D4F542]/10 scale-[1.02]"
            : "border-[#E8E8E4] hover:border-[#D4F542]/50 bg-[#F8F8F6] hover:bg-[#F5F5F2]"
        }`}
      >
        <Upload className="h-5 w-5 text-[#9CA3AF]" />
        <div className="text-center">
          <p className="text-sm font-medium text-[#374151]">
            {isDragging ? "Отпусти фото" : "Загрузи свои фото"}
          </p>
          <p className="text-xs text-[#9CA3AF]">до 12 файлов · JPG, PNG, WebP · макс. 10 МБ</p>
        </div>
      </button>
    )}

    <input
      ref={userPhotoInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      onChange={handleUserPhotosChange}
      className="hidden"
    />
  </FadeIn>
)}
```

**Step 3: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(generate): add user photo upload UI block to standard mode form"
```

---

### Task 4: Skip template step + update CTA labels

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx` (CTA buttons, lines ~855 and ~881)

**Step 1: Add a helper boolean for "skip template"**

After `const hasUserPhotos = uploadedPhotos.length > 0;` add:

```tsx
const skipTemplate = mode !== "standard" || templateFromUrl || hasUserPhotos;
```

**Step 2: Update both CTA buttons (desktop + mobile)**

There are TWO identical CTA buttons — one desktop (line ~853) and one mobile (line ~879). Update both:

```tsx
// onClick — replace both instances:
onClick={() => skipTemplate ? handleGenerate() : setStep("template")}

// disabled — replace both instances:
disabled={!text.trim() || (mode === "photo" && !referencePhoto)}

// Button label — replace both instances:
{!skipTemplate ? (
  <>
    <ArrowRight className="h-4 w-4" />
    Выбрать шаблон{balanceHint ? ` ${balanceHint}` : ""}
  </>
) : (
  <>
    <Sparkles className="h-4 w-4" />
    Создать карусель{balanceHint ? ` ${balanceHint}` : ""}
  </>
)}
```

**Step 3: Update resultStyleLabel**

Find `const resultStyleLabel` (line ~441). Add user photos case:

```tsx
const resultStyleLabel =
  hasUserPhotos
    ? "Свои фото"
    : mode === "photo"
      ? `AI Фото — ${IMAGE_STYLES.find((s) => s.id === imageStyle)?.label}`
      : templates.find((t) => t.id === selectedTemplate)?.nameRu;
```

**Step 4: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(generate): skip template step when user photos uploaded"
```

---

### Task 5: Map slides with imageUrls after generation + fix error fallback

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx` (`handleGenerate` function, around line 346)

**Step 1: Map slides with imageUrls**

In `handleGenerate`, find where `setResult(data)` is called after standard generation (around line 347). Replace:

```tsx
// Before:
const data: CarouselResult = await res.json();
setResult(data);

// After:
const data: CarouselResult = await res.json();
const slidesWithPhotos = hasUserPhotos
  ? data.slides.map((s, i) => ({ ...s, imageUrl: uploadedPhotos[i] ?? undefined }))
  : data.slides;
setResult({ ...data, slides: slidesWithPhotos });
```

**Step 2: Fix error fallback step**

In the catch block of `handleGenerate` (around line 357), update to go back to `form` when photos are uploaded (since there's no template step to go back to):

```tsx
// Before:
setStep(mode === "standard" ? "template" : "form");

// After:
setStep(mode === "standard" && !hasUserPhotos ? "template" : "form");
```

Also update the COOLDOWN error handler (around line 340) the same way:

```tsx
// Before:
setStep(mode === "standard" ? "template" : "form");

// After:
setStep(mode === "standard" && !hasUserPhotos ? "template" : "form");
```

**Step 3: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(generate): map slides with user imageUrls after generation"
```

---

### Task 6: Clean up uploadedPhotos on reset

**Files:**
- Modify: `app/(dashboard)/generate/page.tsx` (`handleReset` function, around line 378)

**Step 1: Add cleanup to handleReset**

In `handleReset`, add:

```tsx
// Revoke objectURLs to free memory
uploadedPhotos.forEach((url) => URL.revokeObjectURL(url));
setUploadedPhotos([]);
if (userPhotoInputRef.current) userPhotoInputRef.current.value = "";
```

Add these lines after the existing `setReferencePhoto(null);` line.

**Step 2: Commit**

```bash
git add app/(dashboard)/generate/page.tsx
git commit -m "feat(generate): cleanup user photo objectURLs on reset"
```

---

### Task 7: Manual verification

**Test flow:**

1. Log in as PRO user → go to `/generate`
2. Select Standard mode → verify "Свои фото" block appears below preserve text toggle
3. Upload 3 photos → see thumbnails with × buttons, numbered labels
4. CTA button should now say "Создать карусель" (no template step)
5. Enter a topic → click "Создать карусель"
6. Result: slides 1-3 have uploaded photos as backgrounds, slides 4+ have dark gradient fallback
7. Open editor → photos visible in editor and export
8. Click "Создать ещё" → photos are cleared, back to form

**Edge cases to verify:**
- Upload more than 12 → capped at 12 with toast
- Upload invalid file type → error toast, file rejected
- Upload file > 10MB → error toast, file rejected
- Remove a photo with × → objectURL revoked, array updated
- With 0 photos → CTA says "Выбрать шаблон" again, template step shown normally
- Non-PRO user → photo block not shown

**Step: Push to GitHub**

```bash
git push origin main
```
