---
name: app-ui
description: >-
  Builds and refactors frontend UI components, layouts, and pages according to the design system.
  Use this skill whenever the user requests a new component, UI changes, design styling,
  forms, dialogs, or runs /ui or /component.
---

# App UI & Component Engineering Skill

This skill guides the agent in building stunning, accessible, and responsive UI components for fullstack web applications. It prevents **style drift**, ensures strict adherence to `.agents/blueprint/STYLE_GUIDE.md`, and guarantees WCAG 2.1 AA accessibility out of the box.

---

## Core UI Principles

1. **Strict Design Token Adherence**:
   - Every background, text color, border, padding, and radius must use `:root` CSS custom properties defined in `.agents/blueprint/STYLE_GUIDE.md`.
   - **Zero hardcoded hex values** in CSS or inline component styles.
2. **Accessible by Default (WCAG 2.1 AA)**:
   - All interactive controls have visible focus rings (`:focus-visible`).
   - Semantic HTML elements (`<button>`, `<dialog>`, `<nav>`, `<input>`).
   - Form inputs have associated `<label>` tags with matching `for` / `id`.
   - Contrast ratio $\ge 4.5:1$ for normal text.
3. **Mobile-First Responsiveness**:
   - Layouts must be designed mobile-first and adapt seamlessly to `sm (640px)`, `md (768px)`, `lg (1024px)`, and `xl (1280px)`.
4. **Rich Micro-Interactions & Polish**:
   - Smooth hover states, active transitions (`scale(0.98)` or translateY), and loading states (spinners, skeletons, disabled styles).

---

## Component Engineering Workflow

### Step 1: Component Definition & Requirements
1. Determine component role:
   - **Primitive / UI**: Reusable base (`Button`, `Card`, `Badge`, `Modal`, `Input`, `Dropdown`).
   - **Feature Component**: Domain-specific (`UserProfileCard`, `PricingTable`, `BillingHistory`).
   - **Layout**: Structural (`Navbar`, `Sidebar`, `AppHeader`, `Footer`).
2. Identify component states:
   - `default`, `hover`, `active`, `focus-visible`, `disabled`, `loading`, `error`.

---

### Step 2: Implementation Standards

#### A. Component Structure (Example: Button / Input)
```tsx
// Reusable, typed, and clean props interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  isLoading, 
  children, 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  const variantClass = `btn-${variant}`;
  return (
    <button
      className={`${variantClass} ${isLoading ? 'is-loading' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Spinner aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
```

#### B. CSS Token Usage
```css
/* ✅ Compliant: Uses design tokens from STYLE_GUIDE.md */
.feature-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  color: var(--text-primary);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

---

### Step 3: Accessibility & Keyboard Verification
1. Verify the component can be operated using only `Tab`, `Enter`, and `Space`.
2. For modals/drawers:
   - Trap focus inside the open modal.
   - Close on `Escape` key.
   - Return focus to the trigger button upon close.
3. Ensure ARIA labels (`aria-label`, `aria-expanded`, `aria-haspopup`) are present when visual labels are absent (e.g. icon-only buttons).

---

### Step 4: Responsive Verification
1. Check that components flex or wrap gracefully without horizontal scrollbars on 375px mobile screens.
2. Verify typography scales appropriately across breakpoints.

---

### Step 5: Completion Report
```markdown
## 🎨 UI Component Built / Refactored

- **Component**: `<ComponentName />` (`src/components/...`)
- **Design Tokens**: Verified against `STYLE_GUIDE.md` (0 hardcoded colors)
- **Accessibility**: Keyboard navigable, focus ring enabled, ARIA verified
- **States Supported**: default, hover, active, loading, disabled
- **Responsive**: Tested across mobile (375px) and desktop breakpoints
```

---

## Error Handling & Fallbacks

If UI styling or component rendering fails:
1. **Hydration Mismatch**: In SSR frameworks (Next.js), verify no browser-only objects (`window`, `localStorage`, `Date.now()`) are evaluated during the initial server render pass.
2. **CSS Specificity Collision**: Avoid `!important`. Refactor class selectors or use CSS Modules / scoped CSS to prevent global leakage.
3. **Contrast Failure**: If WCAG 2.1 AA check fails, adjust background surface or text lightness tokens in `STYLE_GUIDE.md` rather than hardcoding ad-hoc hex values.
4. **Escalate**: If complex layout calculations cause reflow bugs, provide a simplified fallback layout and consult the developer.

