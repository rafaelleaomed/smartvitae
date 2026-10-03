---
name: SmartVitae Design System
description: Clinical, authoritative, factual medical-grade interface for resume audit and ATS optimization
colors:
  primary: "#2563eb"
  primary-dark: "#1d4ed8"
  primary-light: "#eff6ff"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-border: "#e2e8f0"
  neutral-text: "#0f172a"
  neutral-muted: "#475569"
  selection-bg: "#dbeafe"
  selection-text: "#1e3a8a"
  scrollbar-thumb: "#cbd5e1"
  scrollbar-hover: "#94a3b8"
  success: "#059669"
  success-light: "#ecfdf5"
  warning: "#d97706"
  warning-light: "#fffbeb"
  danger: "#dc2626"
  danger-light: "#fef2f2"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: SmartVitae

## Overview

SmartVitae's visual identity reflects clinical sobriety, audit rigor, and transparency. It avoids flashy, hyper-decorated SaaS trends, artificial purple gradients, and floating decorative blobs. The visual authority comes from precise information hierarchy, disciplined typography, clear status signaling, and respectful density suitable for healthcare professionals.

## Colors

- **Primary Clinical Blue (`#2563eb`, `#1d4ed8`):** Institutional reliability, clinical confidence, and primary interaction triggers.
- **Neutral Foundations (`#f8fafc`, `#ffffff`, `#0f172a`):** Crisp, high-contrast surfaces ensuring readability compliant with WCAG AA/AAA.
- **Semantic Feedback:**
  - **Verified / Factual (`#059669` / `#ecfdf5`):** Documented, verified evidence and safe matches.
  - **Attention / Fixable (`#d97706` / `#fffbeb`):** Competence gaps, requirements needing certificates.
  - **Rupture / Kill (`#dc2626` / `#fef2f2`):** Structural mismatch, fabrication risk, unprovable claims.

## Typography

- Modern, readable system typography stack with crisp rendering, proper proportional spacing, and tabular numbers for scores and metrics (`font-feature-settings: "tnum" 1, "rlig" 1, "calt" 1`).
- Clear scale hierarchy:
  - Display: H1 for primary page purpose.
  - Headline: H2/H3 for task modules and diagnostic cards.
  - Body: 14px–16px with line height of 1.5 to 1.6 for comfortable reading.
  - Caption / Meta: 12px for timestamps, hashes, regulatory compliance tags.

## Layout

- **Header:** Slim 64px sticky navigation bar with high-fidelity brand mark, direct section links, and quick-status badge.
- **Main Flow (2-Step Operation):**
  - High clarity dual-panel or stacked 2-step input (Step 1: Candidacy / Resume; Step 2: Job Target).
  - Clear visual separator and prominent action trigger.
- **Diagnostic Stress Test Grid:**
  - Structured 6-dimension metric board with clear bar indicators, weight, and plain-language explanation.
  - Prominent verdict banner (`KILL`, `FIX`, `SHIP`) with decisive guidance.
- **Mobile Responsive:**
  - Native mobile bottom navigation bar (`<nav class="md:hidden ...">`) with accessible 48px touch targets.
  - Responsive padding and full horizontal protection (`overflow-x-hidden`).

## Elevation & Depth

- Soft, tinted ambient shadows (`shadow-sm: 0 1px 2px 0 rgb(15 23 42 / 0.05)`, `shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.07)`).
- Layered surfaces using subtle 1px borders (`border-slate-200`) instead of heavy artificial drop shadows.

## Shapes

- Consistent border radius: `rounded-xl` (12px) for interactive cards and buttons, `rounded-2xl` (16px) for major module containers, `rounded-full` for status chips.

## Components

- **SmartVitae Logo:** Vector SVG badge with clinical cross and neural node geometry.
- **Status Badges:** Solid or light-tinted badges with matching foreground text (never gray text on colored backgrounds).
- **File Dropzone:** Accessible drag-and-drop area with keyboard focus rings and active state visual cues.
- **Evidence Cards:** Audit trail cards displaying source document, verification status, and timestamp.

## Do's and Don'ts

- **Do:** Use semantic colors where text and background share the same hue family (e.g. `text-emerald-800` on `bg-emerald-50`).
- **Do:** Provide clear focus rings (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`).
- **Don't:** Never use generic kickers/eyebrows when the main title is self-explanatory.
- **Don't:** Never nest cards within cards of identical styling.
- **Don't:** Never use gray text on colored badge backgrounds.
- **Don't:** Never use hard offset drop shadows (`4px 4px 0`) or decorative glass-morphism blurs.
