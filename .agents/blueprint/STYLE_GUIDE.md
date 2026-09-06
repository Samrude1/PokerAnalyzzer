# Style Guide & Design System (STYLE_GUIDE.md)

This document is the official Single Source of Truth for the application's UI design, typography, and visual tokens. All developers and AI agents must follow these definitions. Ad-hoc styles, arbitrary hex codes, or unstyled components are strictly prohibited without updating this guide.

---

## 1. Color System (CSS Custom Properties)

All colors and visual effects are defined in `:root`:

```css
:root {
  /* Backgrounds & Surfaces */
  --bg-primary: #0b0f19;                   /* Page background (dark mode) */
  --bg-secondary: #111827;                 /* Card and section backgrounds */
  --bg-surface: rgba(15, 23, 42, 0.85);   /* Elevated surfaces, modals */
  --overlay-bg: rgba(0, 0, 0, 0.6);       /* Backdrop for modals and dialogs */
  --border-color: rgba(255, 255, 255, 0.1);/* Subtle borders */

  /* Brand & Action Colors */
  --primary: #38bdf8;                      /* Primary action (Sky/Cyan) */
  --primary-hover: #0ea5e9;                /* Primary hover state */
  --secondary: #64748b;                    /* Secondary elements (Slate) */
  --secondary-hover: #475569;              /* Secondary hover state */
  --accent: #8b5cf6;                       /* Accent / highlights (Violet) */
  --danger: #f43f5e;                       /* Destructive actions (Rose) */
  --success: #10b981;                      /* Success states (Emerald) */
  --warning: #f59e0b;                      /* Warning states (Amber) */

  /* Typography */
  --text-primary: #f8fafc;                 /* Primary text (Light) */
  --text-secondary: #94a3b8;              /* Secondary / muted text */
  --text-inverse: #0f172a;                 /* Text on light backgrounds */

  /* Spacing Scale */
  --space-xs: 0.25rem;                     /* 4px */
  --space-sm: 0.5rem;                      /* 8px */
  --space-md: 1rem;                        /* 16px */
  --space-lg: 1.5rem;                      /* 24px */
  --space-xl: 2rem;                        /* 32px */
  --space-2xl: 3rem;                       /* 48px */

  /* Radii */
  --radius-sm: 0.375rem;                   /* 6px - badges, chips */
  --radius-md: 0.5rem;                     /* 8px - buttons, inputs */
  --radius-lg: 1rem;                       /* 16px - cards, modals */
  --radius-full: 9999px;                   /* Pill shapes, avatars */

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 4px 15px rgba(56, 189, 248, 0.3);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 350ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Light Mode Overrides (Automatic via OS preference or manual data-theme toggle) */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-surface: rgba(255, 255, 255, 0.95);
    --overlay-bg: rgba(0, 0, 0, 0.4);
    --border-color: rgba(15, 23, 42, 0.12);

    --primary: #0284c7;
    --primary-hover: #0369a1;
    --secondary: #475569;
    --secondary-hover: #334155;

    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-inverse: #f8fafc;

    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
    --shadow-glow: 0 4px 15px rgba(2, 132, 199, 0.25);
  }
}

/* Explicit class or attribute toggles */
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-surface: rgba(255, 255, 255, 0.95);
  --overlay-bg: rgba(0, 0, 0, 0.4);
  --border-color: rgba(15, 23, 42, 0.12);

  --primary: #0284c7;
  --primary-hover: #0369a1;
  --secondary: #475569;
  --secondary-hover: #334155;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-inverse: #f8fafc;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
  --shadow-glow: 0 4px 15px rgba(2, 132, 199, 0.25);
}
```

---

## 2. Typography

- **Font Family**: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Headings**:
  - `H1`: 2.25rem (36px), bold (800), gradient or `--text-primary`.
  - `H2`: 1.5rem (24px), bold (700), `--text-primary`.
  - `H3`: 1.25rem (20px), semi-bold (600), `--text-secondary`.
- **Body Text**: 1rem (16px), `--text-secondary`, line-height 1.6.
- **Small / Caption**: 0.875rem (14px), `--text-secondary`.
- **Monospace** (code): `'JetBrains Mono', 'Fira Code', monospace`.

---

## 3. Component Library

All application components must use standardized classes:

### A. Buttons

#### Primary (`.btn-primary`)
Main actions: submit, confirm, save.
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, #2563eb 100%);
  color: #fff;
  border: none;
  padding: var(--space-sm) var(--space-lg);
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  box-shadow: var(--shadow-glow);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
}
.btn-primary:active { transform: translateY(1px); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
```

#### Secondary (`.btn-secondary`)
Cancel, back, alternative actions.
```css
.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: var(--space-sm) var(--space-lg);
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), transform var(--transition-fast);
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}
```

#### Danger (`.btn-danger`)
Delete, remove, destructive actions.
```css
.btn-danger {
  background: var(--danger);
  color: #fff;
  border: none;
  padding: var(--space-sm) var(--space-lg);
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-danger:hover { background: #e11d48; }
```

### B. Cards (`.card`)
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-normal), transform var(--transition-normal);
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### C. Form Inputs (`.input`)
```css
.input {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: var(--space-sm) var(--space-md);
  font-size: 1rem;
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}
```

### D. Modals & Dialogs
- **Backdrop**: `position: fixed; inset: 0; background: var(--overlay-bg); backdrop-filter: blur(8px);`
- **Container**: `background: var(--bg-surface); border-radius: var(--radius-lg); animation: popIn 0.3s var(--transition-slow);`

---

## 4. Responsive Breakpoints

```css
/* Mobile first */
/* sm: 640px */  @media (min-width: 640px)  { }
/* md: 768px */  @media (min-width: 768px)  { }
/* lg: 1024px */ @media (min-width: 1024px) { }
/* xl: 1280px */ @media (min-width: 1280px) { }
```

---

---

## 5. Poker Domain-Specific Visual Tokens

```css
:root {
  /* Poker Table & Accessories */
  --poker-felt: #35654d;                   /* Classic green poker table felt */
  --poker-felt-border: #234433;            /* Dark wooden rail border */
  --poker-dark: #1a1a1a;                   /* Dark background panels */
  --poker-gold: #d4af37;                   /* Premium gold accents / VIP badges */

  /* Playing Card Suits */
  --card-hearts: #ef4444;                  /* Red / Hearts ♥ */
  --card-diamonds: #3b82f6;                /* Blue or Red / Diamonds ♦ (four-color deck option) */
  --card-clubs: #10b981;                   /* Green or Dark / Clubs ♣ */
  --card-spades: #0f172a;                  /* Charcoal / Spades ♠ */

  /* HUD & Player Archetype Tags */
  --badge-fish: #22c55e;                   /* Loose-Passive / Green */
  --badge-nit: #3b82f6;                    /* Tight-Passive / Blue */
  --badge-tag: #f59e0b;                    /* Tight-Aggressive / Amber */
  --badge-lag: #ef4444;                    /* Loose-Aggressive / Red */
}
```

---

## 6. Coding Rules

1. **Never Hardcode Hex Values in CSS**: Always reference `var(--primary)`, `var(--bg-primary)`, etc.
2. **No Inline Styles**: Use CSS classes or CSS modules. No `style="..."` or `element.style.x = ...`.
3. **Accessible Components**: All interactive elements must have visible focus states and proper ARIA attributes.
4. **Dark/Light Mode**: Use CSS variables exclusively so theming is a seamless `:root` swap without touching component markup.
5. **Consistent Spacing**: Use the spacing scale (`--space-*`) for all margins and paddings.
6. **Theme-Aware Verification**: Every component must look polished in both light and dark modes. Test contrast and borders across both themes before marking complete.


