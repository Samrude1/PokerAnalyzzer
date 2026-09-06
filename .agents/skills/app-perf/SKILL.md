---
name: app-perf
description: >-
  Audits, benchmarks, and optimizes application performance, bundle size, Core Web Vitals, and resource loading.
  Use this skill whenever the user requests performance optimization, bundle analysis,
  Lighthouse audits, caching strategy, or runs /perf or /optimize-perf.
---

# App Performance & Core Web Vitals Optimization Skill

This skill guides the agent in systematically profiling, diagnosing, and optimizing fullstack application performance. It enforces industry-standard Core Web Vitals thresholds, prevents JavaScript bundle bloat, eliminates render-blocking assets, and configures modern caching architectures.

---

## Core Web Vitals Targets

| Metric | Target | Description |
| :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | `< 2.5s` | Measures perceived loading speed of main visual content |
| **INP** (Interaction to Next Paint) | `< 200ms` | Measures UI responsiveness to user taps and clicks |
| **CLS** (Cumulative Layout Shift) | `< 0.1` | Measures visual stability and layout jumping |
| **TTFB** (Time to First Byte) | `< 800ms` | Measures server response and network latency |

---

## Workflow Steps

### Step 1: Bundle Size Audit
Analyze JavaScript bundle footprint to detect oversized dependencies:

1. **Next.js**:
   - Install bundle analyzer: `npm install -D @next/bundle-analyzer`
   - Wrap `next.config.js`:
     ```javascript
     const withBundleAnalyzer = require('@next/bundle-analyzer')({
       enabled: process.env.ANALYZE === 'true',
     });
     module.exports = withBundleAnalyzer({ /* config */ });
     ```
   - Run analysis: `ANALYZE=true npm run build`
2. **Vite**:
   - Install visualizer: `npm install -D rollup-plugin-visualizer`
   - Inspect output in `stats.html`
3. **Audit Actions**:
   - Replace bloated libraries (e.g. replace `moment.js` with `date-fns` or native `Intl`).
   - Replace massive icon libraries with tree-shaken imports (e.g. `lucide-react`).

---

### Step 2: Code Splitting & Dynamic Imports
1. Dynamically load heavy components below the fold:
   ```tsx
   import dynamic from 'next/dynamic';

   const AnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'), {
     loading: () => <SkeletonChart />,
     ssr: false,
   });
   ```
2. Lazy-load non-critical third-party scripts (`next/script` with `strategy="lazyOnload"`).

---

### Step 3: Image & Asset Optimization
1. **Format & Sizing**:
   - Serve modern formats (WebP, AVIF).
   - Use framework image components (`next/image`) with explicit `width`, `height`, and `sizes` attributes to prevent CLS.
   - Set `priority` only on the above-the-fold hero image (improves LCP).
2. **Font Optimization**:
   - Use `next/font` or self-host fonts with `font-display: swap` to prevent FOIT (Flash of Invisible Text).

---

### Step 4: Data Fetching & Caching Strategy
1. **Stale-While-Revalidate**:
   - Use TanStack Query or SWR for client fetching to deliver instant cached UI.
2. **HTTP Cache Headers**:
   - Static assets: `Cache-Control: public, max-age=31536000, immutable`.
   - Dynamic API routes: `Cache-Control: s-maxage=60, stale-while-revalidate=300`.
3. **Database Query Optimization**:
   - Audit N+1 queries. Ensure relational queries use batch fetching (`include` / `join`).
   - Verify all filtered and sorted columns have database indexes (per `app-db`).

---

### Step 5: Verification & Lighthouse Audit
1. Run automated Lighthouse check in production build:
   ```bash
   npm run build && npm run start
   ```
2. Run Lighthouse audit via Chrome DevTools or Lighthouse CLI.
3. Update `.agents/blueprint/CODE_REVIEW.md` Performance scorecard.
4. Deliver performance report:
```markdown
## ⚡ Performance Audit & Optimization Complete

- **LCP**: [e.g. 1.8s - 🟩 Good]
- **INP**: [e.g. 85ms - 🟩 Good]
- **CLS**: [e.g. 0.02 - 🟩 Good]
- **Bundle Optimization**: [e.g. Reduced initial JS by 34% via dynamic imports]
- **Image & Font Optimization**: [WebP converted, font-display: swap enforced]
```

---

## Error Handling & Fallbacks

If optimization causes regressions:
1. **Dynamic Import Hydration Mismatch**: If dynamic imports without SSR cause flickering, provide a visually identical placeholder skeleton.
2. **Aggressive Cache Invalidation**: If users see stale data, configure explicit on-demand cache revalidation tags (`revalidateTag` / `revalidatePath`).
3. **Memory Leaks in Profiling**: If CPU profiling shows runaway loops, inspect event listeners and `useEffect` dependency arrays.
4. **Escalate**: If performance is throttled by external API latency, propose server-side caching (Redis / Upstash) to the developer.
