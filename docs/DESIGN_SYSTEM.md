# RESUMIND AI — Design System & Visual Specification

> **Tooling Note**: The external *UI/UX Pro Max* skill and *21st.dev MCP* were detected as unavailable in the host environment. Per requirements, this comprehensive design system was architected directly based on premium design engineering principles (Linear, Vercel, Apple dark mode).

---

## 1. Brand Identity & Personality

- **Brand**: RESUMIND AI
- **Tagline**: *"Find the right talent. Faster. Smarter."*
- **Personality**: Intelligent, Professional, Futuristic, Trustworthy, Minimalist, Premium.
- **Mood**: High-contrast, dark cinematic aesthetic. Precision-engineered for modern tech recruiters, engineering hiring managers, and HR leaders.

---

## 2. Color Palette (Semantic Tokens)

| Token Name | Value | Usage |
|---|---|---|
| `--bg-main` | `#090909` | Deepest canvas background |
| `--bg-secondary` | `#141414` | Navigation bars, secondary headers, sidebars |
| `--bg-card` | `#1B1B1B` | Content cards, modals, table rows |
| `--bg-card-hover` | `#232323` | Interactive card hover state |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Standard hairline borders (1px) |
| `--border-hover` | `rgba(255, 255, 255, 0.16)` | Active / focused borders |
| `--text-primary` | `#FFFFFF` | Primary headlines, candidate names, high-emphasis text |
| `--text-secondary` | `#A1A1AA` | Body copy, meta descriptions, timestamps |
| `--text-muted` | `#71717A` | Placeholder text, subtle indicators, helper text |
| `--accent-red` | `#E53945` | Primary brand accent, key action triggers, logo glyphs |
| `--accent-red-glow`| `rgba(229, 57, 69, 0.25)` | Glow effects, active tabs, subtle focal rings |
| `--success-green` | `#35C98B` | High match scores (>80%), shortlist pills, verified tags |
| `--warning-amber` | `#E5A83B` | Moderate matches (50–79%), review status |
| `--danger-red` | `#EF4444` | Rejected status, missing critical requirements |

---

## 3. Typography & Hierarchy

- **Font Family**: Inter, Geist, system-ui, sans-serif
- **Code/Metrics**: JetBrains Mono, Fira Code, monospace for numerical scores, IDs, and match percentages
- **Type Scale**:
  - `Hero Display`: 48px – 64px (`font-extrabold`, letter-spacing: `-0.03em`)
  - `H1 / Page Titles`: 30px – 36px (`font-bold`, letter-spacing: `-0.02em`)
  - `H2 / Section Headers`: 22px – 24px (`font-semibold`, letter-spacing: `-0.01em`)
  - `H3 / Card Titles`: 16px – 18px (`font-semibold`)
  - `Body Regular`: 14px – 15px (`font-normal`, line-height: 1.6)
  - `Body Small / Meta`: 12px – 13px (`font-medium`, text-secondary)
  - `Score Badges`: 20px – 32px (`font-black`, monospace tabular numbers)

---

## 4. Spacing, Grid & Layout

- **Base Unit**: 4px / 8px grid system
- **Card Padding**: 20px / 24px (`p-5` or `p-6`)
- **Corner Radius**:
  - Cards & Modals: `rounded-2xl` (16px) or `rounded-xl` (12px)
  - Buttons & Inputs: `rounded-lg` (8px)
  - Badges & Pills: `rounded-full` (9999px)
- **Borders**: Crisp 1px solid hairline borders with subtle opacity to prevent harsh grid lines.

---

## 5. Motion & Interaction Principles

1. **Restraint over excess**: Avoid gratuitous bouncy loops or floating blobs. All animations must communicate state transitions or spatial hierarchy.
2. **Page & Tab Transitions**: 200ms–250ms ease-out transitions (`opacity` + subtle 4px `translateY`).
3. **Animated Counters**: Smooth score counter easing when screening completes.
4. **Interactive Hover**:
   - Subtle 1px border brighten from `border-white/8` to `border-white/20`.
   - Subtle card lift (`-translate-y-0.5`).
5. **Screening Processing Pipeline**: Multi-stage progress indicator with pulsating pulse nodes corresponding to real extraction and calculation steps.

---

## 6. Component Architecture

- **Navbar & Sidebar**: Collapsible, responsive, with brand emblem and status indicators.
- **Upload Zone**: Multi-file drag & drop supporting `.pdf` and `.docx`, real-time file size & mime validation, thumbnail chip with remove button.
- **Candidate Ranking Table/Grid**: High-density view toggle, score badges, skill matching tags (green for matched, red-dashed for missing), candidate comparison drawer.
- **Candidate Profile Drawer/Modal**: Tabbed drill-down into resume text, extracted career timeline, education, skill breakdown, and AI explainable reasoning.
- **Explainable AI Score Card**: Transparent 4-pillar breakdown (Skills 50%, Experience 30%, Education 10%, Projects 10%) with human-in-the-loop recruiter override.
