---
name: snc-brand
description: St. Nicolas College (SNC) shared visual identity and UI patterns for library_rfid (Smart Library) and kiosk_permit (Permit, Promissory Note & SOA Kiosk) — colors, logo, fonts, kiosk screens, admin data tables, modals, notifications. Use whenever creating or restyling any frontend, kiosk screen, modal, header/navbar, admin page or data table, favicon, or printed slip for a St. Nicolas College system, or when the user asks to make a system "uniform", "same color/logo as the library", "match the school branding", or to give a system its own unique look while staying on-brand.
---

# St. Nicolas College — UI Brand

All SNC systems belong to one school: they share **logo, colors, fonts, and school name styling**.
Each system may have its **own layout** so they don't look identical (the user asked for this).

| System | Folder | Kiosk look | Admin look |
|---|---|---|---|
| Smart Library | `library_rfid` | Campus photo hero, centered, uppercase neon title | Green sidebar, light content |
| Permit / PN / SOA Kiosk | `kiosk_permit` | Aurora backdrop, left hero + Quick Guide card | Green sidebar, white top bar, "list card" data tables |

Brand tokens live in each project's `src/index.css`. **`library_rfid/src/index.css` is the source for the shared tokens** — if a token changes, copy it to the other system.

## 1. Logo

- File: `public/images/uploads/SCHOOL_LOGO.png` (official round seal, "St. Nicolas College of Business and Technology • 2004"). Copy it from `library_rfid/public/images/uploads/` into every new project.
- **Never** draw an SVG/CSS imitation of the seal.
- Favicon + apple-touch-icon in `index.html`.
- Render with `object-contain` (+ `drop-shadow`); no border or background circle. Alt: `St. Nicolas College of Business and Technology`.
- kiosk_permit: `<CollegeSeal size="sm|md|lg|xl|2xl" />` and the exported `SCHOOL_LOGO` constant.
- Campus photo: `public/images/uploads/snc-building-front.jpg` (library hero, permit kiosk dashboard).

## 2. Tokens (Tailwind v4 `@theme`)

```css
@theme {
  --font-sans: "Roboto", ui-sans-serif, system-ui, sans-serif;
  --color-snc-green: #004d00;       /* primary brand green, primary buttons */
  --color-snc-green-dark: #0a2e0a;  /* darkest panels, gradient start, "New Record" buttons */
  --color-snc-green-mid: #1a5c2e;   /* hover, links, progress bars */
  --color-snc-neon: #39ff14;        /* accents, icons, glow, "online" dots, step numbers */
  --color-snc-hero: #061a0a;        /* page background behind kiosk hero */
}
```

| Purpose | Value |
|---|---|
| Font | Roboto 400/500/700. JetBrains Mono (`font-mono-code`) only for IDs, LRNs, O.R. numbers, amounts |
| Success | dark: `bg-emerald-950/75 border-emerald-500/45 text-emerald-50` · light: `bg-emerald-50 text-emerald-600` |
| Warning | dark: `amber-950/70`, `amber-400/45` · light: `bg-amber-50 text-amber-600` |
| Error | dark: `red-950/80`, `red-500/45` · light: `bg-red-50 text-red-600`; error modal header `bg-red-700` |
| Modal overlay | `bg-slate-900/75 backdrop-blur-sm` |

Do **not** add other brand colors (no blue brand bars, no plain `emerald-600` buttons, no Plus Jakarta Sans). Blue/violet are allowed only as small status pills (e.g. activity type).

## 3. School name

- **St. Nicolas College** (full: St. Nicolas College of Business and Technology).
- Big kiosk title: uppercase, white, neon glow, **one line** (`white-space: nowrap`, font size with `clamp()` so it fits phones).
  - library: `title-text snc-hero-glow`
  - kiosk_permit: `kiosk-hero-title` (same glow, sized for a left-aligned hero)
- `<title>`: `St. Nicolas College — <System Name>`.

## 4. Kiosk (student-facing)

Shared rules: dark green background, white text, glass panels, neon accents, **white pill primary button** (`kiosk-cta rounded-full bg-white text-black uppercase`), touch targets ≥ 48px, text never below `text-xs`.

| Class | Use |
|---|---|
| `kiosk-glass` (+ `kiosk-glass-neon`) | Translucent green glass panel |
| `kiosk-action-card` (+ `__icon-wrap`) | Large touch option cards, neon icon chip, neon border on hover |
| `kiosk-cta` | Bold, letter-spaced button text |
| `kiosk-brand-title` | Uppercase neon heading inside header bars |
| `kiosk-eyebrow` | Small spaced uppercase label above a title ("WELCOME TO") |
| `kiosk-instruction` | Prompt text |
| `kiosk-input`, `kiosk-key` | Dark text field and touch-keypad keys on glass |
| `kiosk-avatar-ring` | Neon ring around a student avatar |
| `snc-hero-bg`, `snc-hero-overlay` | Campus photo + green vignette |
| `snc-modal-header` | Brand-green gradient title bar on white modals |

**library_rfid welcome:** centered — logo → "Welcome to" → `title-text snc-hero-glow` → `moto-text` tagline → instruction → white pill "Tap to Scan".

**kiosk_permit welcome (its own look):**
- Backdrop: `kiosk-backdrop` + shifting `kiosk-aurora` glows + `kiosk-dotgrid` + faint `kiosk-seal-watermark` (no photo). `KioskSlideshow` / `useSlideIndex` rotate the aurora.
- Top bar (`KioskTopBar`): logo + name, exam-term pill, live clock, System Online badge.
- Left: `kiosk-eyebrow` "WELCOME TO" → `kiosk-hero-title` → one-sentence description → white pill **Click here to proceed** with `kiosk-cta-ring` pulse. The LRN entry only appears after this button.
- Right: **Quick Guide** card (`kiosk-guide-glass`): white with green polka dots, green `snc-modal-header` band with logo, auto carousel — summary list → one slide per step with an animated mini-demo (`KioskGuideDemos`, `.demo-*` classes). Summary 3 s, steps 2.8 s, slide transition 0.45 s.
- Student dashboard: `kiosk-id-card` "Student Account" card (strip + avatar + balance + permit status + End Session) and three `kiosk-action-card` services.

Kiosk modals: white `rounded-2xl` card, `snc-modal-header`, white body, footer with `btnSecondary` + `btnPrimary` (`KioskModal`).

Respect `prefers-reduced-motion` for every looping animation.

## 5. Admin portal (staff-facing)

Shared: dark-green gradient sidebar (`admin-sidebar`, `admin-nav-link`, `admin-nav-link--active`), light page background (`admin-shell`), `admin-login-*` split login page.

**kiosk_permit admin patterns (copy these for new admin pages):**

- **Top bar** (`admin-topbar`): white translucent bar — school-year pill, exam-term segmented buttons (`bg-snc-green` active), light `SystemStatusBadge variant="light"`, notification bell, dark rounded "Record Payment".
- **Page** (`AdminPageParts.tsx`):
  1. `AdminPageHeader` — breadcrumb (🏠 › Section), large title, subtitle.
  2. Row of `AdminStat` cards — small uppercase label + big number; clickable ones act as filters (`ring-2 ring-snc-green-mid` when active).
  3. `DataCard` — white `rounded-3xl` card: "X List" title, `NewRecordButton` (`bg-snc-green-dark`, "+ New Record") on the right, pill search (`bg-slate-100 rounded-full`) and optional `FilterTabs` underneath, then the table.
  4. Table classes from `tbl`: uppercase tracked headers, thin row dividers, mono for codes/IDs/amounts.
  5. Status column with `StatusPill` / `ActiveStatus` (green Active, gray Inactive); deactivated rows `opacity-60`.
  6. Actions column with icon-only `IconAction` buttons: ✏️ edit, 👤✕ deactivate (danger), ↺ restore (primary).
- **Modals:** `AdminModal` with `snc-modal-header`, `adminInput`, `adminBtnPrimary` / `adminBtnSecondary`.
- **File maintenance:** generic `MaintenancePanel` (fields config incl. `select`, `checkboxes`, `display`). Soft delete + restore everywhere.
- **Notifications:** `NotificationBell` (red count badge, dropdown) and `LiveToasts` (bottom-right cards) fed by Server-Sent Events from `/api/events`.

## 6. Printed slips

White card, logo on top, "ST. NICOLAS COLLEGE", monospace body, dashed separators; only `.printable-area` prints (`@media print` rule in index.css).

## 7. Checklist for a new or restyled SNC frontend

1. Copy `SCHOOL_LOGO.png` (and the campus photo if needed) into `public/images/uploads/`.
2. `index.html`: Roboto font, favicon = logo, `<title>` format above.
3. `src/index.css`: paste the `@theme` tokens, then only the classes the system uses.
4. Replace hand-drawn seals, off-brand colors, or other fonts.
5. Kiosk: dark green + glass + neon + white pill CTA; one-line glowing school name. Admin: green sidebar + `AdminPageParts` data-table pattern.
6. Run `npm run lint` and `npm run build`; look at the screens at 1920px, tablet (1280×800, 800×1280), and phone width.
7. Remove CSS classes and components that are no longer referenced.
8. Windows PowerShell 5.1: never write JSON with `Set-Content -Encoding utf8` (adds a BOM that breaks Vite); use the Edit tool or `sed`.
