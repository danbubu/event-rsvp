# Mary-Ann RSVP — Frontend Redesign Prompt (New Inspo)

## CRITICAL RULES — READ BEFORE TOUCHING ANYTHING

- Do **NOT** touch any backend files: `src/app/api/`, `src/lib/email.ts`, `src/lib/googleSheets.ts`, `src/lib/supabase.ts`
- Do **NOT** touch any submission logic: `onSubmit`, RHF setup, validation schema, API payload shape
- Do **NOT** touch DB schema, Sheets sync, Supabase writes, or email sender logic
- Do **NOT** change countdown math logic — only visual styling and target date if needed
- Do **NOT** change confetti trigger behavior — only color palette
- Frontend-only edits in: `src/app/page.tsx`, `src/app/globals.css`, and presentational UI components

---

## DESIGN GOAL (based on new inspiration)

Transform the page into an elegant **digital invitation** aesthetic:

- Rich dark teal base with warm gold accents
- Ornamental invitation framing and subtle texture
- Serif/script-forward typography for headings and moments
- Vertical section flow: invitation -> event details -> countdown -> registry -> RSVP -> save-the-date
- Premium, classy, celebratory mood (not neon/club UI)

---

## CONTENT UPDATES (apply first)

### Date/time copy
- Party date: **Friday, 24th April 2026, 9:00 PM**
- RSVP deadline copy: **RSVP by Friday, April 24th**
- Countdown target: `new Date('2026-04-24T21:00:00')`

### Frontend form fields
- Keep frontend RSVP to: **Name, Email, Attending (yes/no), Diet request, Comment**
- Remove any visible "Bringing anyone?" extra guest section in UI
- Do not alter backend guest columns; just stop rendering/sending extra guest inputs from UI

---

## TYPOGRAPHY

Use a luxury invite mix of serif + script + clean sans.

Add to top of `globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Great+Vibes&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --font-display: 'Playfair Display', serif;
  --font-script: 'Great Vibes', cursive;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-alt-serif: 'Cormorant Garamond', serif;
}
```

- Headings and section titles: `var(--font-display)`
- Signature/script moments ("Celebrating", "Save the Date"): `var(--font-script)`
- Body text and form labels: `var(--font-body)`
- Elegant secondary lines: `var(--font-alt-serif)`

---

## COLOR SYSTEM (new inspo)

```txt
Primary dark teal:      #113A3E
Secondary deep teal:    #0D2E32
Card dark teal:         #1A4A4E
Antique gold primary:   #C9A15D
Warm gold highlight:    #D9B878
Muted champagne:        #E8D9B5
Soft cream text:        #F7F1E3
Muted text:             #CFC3A8
Divider gold:           rgba(201,161,93,0.35)
Border gold:            rgba(201,161,93,0.45)
```

Avoid bright pink/purple gradients and neon glows.

---

## SECTION 1 — PAGE BACKGROUND + FRAME

- Remove space/aurora/starfield visuals.
- Global page background should be deep teal with subtle diamond texture.
- Add elegant inner frame on main content container (double-border effect in gold tones).

Suggested texture:

```css
background-color: #113A3E;
background-image:
  radial-gradient(circle at 1px 1px, rgba(201,161,93,0.15) 1px, transparent 0);
background-size: 18px 18px;
```

---

## SECTION 2 — HERO / INVITATION PANEL

- Build a top "invitation card" feel, centered, with monogram seal and celebratory heading.
- Replace emoji-heavy heading with elegant composition:
  - script eyebrow (e.g., "Celebrating")
  - large numeric age `50` style can become `21` for Mary-Ann if desired
  - display line: `"Mary-Ann's Birthday"`

Monogram seal style:
```css
width: 64px;
height: 64px;
border-radius: 50%;
border: 1.5px solid #C9A15D;
background: rgba(201,161,93,0.12);
display: flex;
align-items: center;
justify-content: center;
color: #D9B878;
font-family: var(--font-display);
font-weight: 700;
```

---

## SECTION 3 — EVENT DETAILS STRIP

- Date, time, and venue should appear in a slim, formal information strip.
- Use uppercase small labels and elegant serif values.
- Replace colorful per-row accents with one unified gold language.
- Add one polished CTA button: `Open Map` (frontend only visual action can keep existing link behavior).

---

## SECTION 4 — COUNTDOWN BLOCK

- Keep countdown logic unchanged.
- Restyle to match invite theme:
  - dark-teal container
  - strong gold numbers
  - subtle uppercase labels
  - optional script label above timer ("The Celebration Begins In")
- Keep only tasteful, minimal motion.

---

## SECTION 5 — REGISTRY PANEL

- Add a "Gift Registry" section styled like a gold accent band/panel.
- Include clear action buttons (e.g., `Amazon`, `Target`, `Cash App`) with consistent visual hierarchy.
- Preserve existing links/actions if already wired; frontend redesign only.

---

## SECTION 6 — RSVP PANEL

- Keep existing form logic and validation behavior.
- Restyle with:
  - framed heading block
  - gold/cream inputs on dark background
  - segmented yes/no control (pill style)
  - cleaner checkbox/radio treatment for diet options
  - prominent gold submit CTA

Input baseline:

```css
background: rgba(232,217,181,0.1);
border: 1px solid rgba(201,161,93,0.45);
color: #F7F1E3;
border-radius: 10px;
```

---

## SECTION 7 — SUCCESS STATE

- Keep success flow behavior unchanged.
- Restyle success card to match invitation tone.
- Confetti color update only:

```js
colors: ['#C9A15D', '#D9B878', '#E8D9B5', '#F7F1E3', '#113A3E']
```

---

## SECTION 8 — SAVE THE DATE BLOCK

- Add/refine a lower-page "Save the Date" section in script + serif style.
- Include optional `Add to Calendar` button with outlined gold style.
- Keep it visually calm and elegant, not oversized.

---

## SECTION 9 — LAYOUT + SPACING

```css
/* Main invitation column */
max-width: min(100%, 460px);
margin: 0 auto;
padding: 1.5rem 1rem;

/* Vertical rhythm */
display: flex;
flex-direction: column;
gap: 1rem;
```

- Prefer compact card stacking with clear separators.
- Keep mobile-first design as top priority.

---

## COMPONENT STYLE NOTES

- Buttons: rounded rectangles or pills, gold-forward, subtle shadows
- Borders: thin gold lines; avoid thick/glassy effects
- Motion: minimal and intentional; no flashy animations
- Iconography: restrained and consistent; avoid excessive emojis
- Keep accessibility: readable contrast, visible focus states

---

## ABSOLUTE DO NOT TOUCH LIST

| File/Area | Reason |
|---|---|
| `src/app/api/rsvp/route.ts` | Backend RSVP handler |
| `src/lib/email.ts` | Email templates and send logic |
| `src/lib/googleSheets.ts` | Sheets sync |
| `src/lib/supabase.ts` | DB client |
| `onSubmit` in `src/app/page.tsx` | Form submission behavior |
| RHF/validation schema | Existing validation rules stay intact |
| Countdown logic functions | Behavior stable; style-only updates |
| Confetti trigger timing | Behavior stable; colors-only update |

---

## FINAL CHECKLIST

- [ ] Frontend visuals match new teal/gold invitation inspiration
- [ ] No backend or submission logic changed
- [ ] Date/deadline copy reflects April 24th everywhere
- [ ] RSVP UI feels premium and mobile-first
- [ ] Countdown and success states are visually consistent
