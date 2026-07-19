---
name: Enterprise Core
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#42474f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#727780'
  outline-variant: '#c2c7d1'
  surface-tint: '#2d6197'
  primary: '#00355f'
  on-primary: '#ffffff'
  primary-container: '#0f4c81'
  on-primary-container: '#8ebdf9'
  inverse-primary: '#a0c9ff'
  secondary: '#545f72'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f7'
  on-secondary-container: '#586377'
  tertiary: '#003460'
  on-tertiary: '#ffffff'
  tertiary-container: '#004b87'
  on-tertiary-container: '#8abcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a0c9ff'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#07497d'
  secondary-fixed: '#d8e3fa'
  secondary-fixed-dim: '#bcc7dd'
  on-secondary-fixed: '#111c2c'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d3e4ff'
  tertiary-fixed-dim: '#a2c9ff'
  on-tertiary-fixed: '#001c38'
  on-tertiary-fixed-variant: '#004881'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  data-table:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 1rem
  margin-edge: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style

The design system is engineered for high-utility, enterprise-grade operations. It prioritizes clarity, efficiency, and reliability, specifically designed for users managing complex logistics and master data workflows. 

The aesthetic is **Corporate / Modern**, characterized by:
- **Functional Density:** Optimizing screen real estate for data-heavy inquiry lists and item catalogs.
- **Systemic Trust:** A structured visual language that emphasizes precision through rigid alignment and clear hierarchy.
- **Operational Efficiency:** Reducing cognitive load by using standardized patterns for common actions like filtering, searching, and bulk editing.
- **Clarity of Status:** Utilizing distinct semantic color treatments for "Inquiry Status" and "Approval Workflows" to ensure critical information is never missed.

## Colors

The palette uses a professional blue foundation to evoke stability and authority. 

- **Primary Blue:** Used for branding, primary actions, and active navigation states.
- **Secondary Slate:** Applied to secondary UI elements, iconography, and text to maintain a neutral, grounded feel.
- **Neutrals:** A range of cool grays (from #F7FAFC to #1A202C) defines the surface hierarchy. Pure white is reserved for high-priority cards and input backgrounds.
- **Semantic Feedback:** Success, Error, and Warning colors are highly saturated to stand out against the corporate blue/gray backdrop, ensuring that validation states and system alerts are immediately recognizable.

## Typography

This design system utilizes a dual-font strategy. **Hanken Grotesk** is used for page headers and section titles to provide a modern, sharp edge to the brand. **Inter** is the workhorse for all data-driven content, chosen for its exceptional legibility at small sizes and high-density environments.

Data tables use a specialized `data-table` style (13px) to maximize row visibility without sacrificing readability. Labels use a semi-bold weight with slight tracking to clearly distinguish between metadata titles and actual data values.

## Layout & Spacing

A **fluid grid** model is employed, optimized for widescreen monitors common in office environments. 

- **Grid System:** A 12-column layout with 16px (1rem) gutters. 
- **Density:** The system uses a "Compact" spacing rhythm. Standard vertical spacing between form elements is 16px, while row heights in data tables are constrained to 40px to maximize information density.
- **Breakpoints:** 
  - *Desktop (1200px+):* Full sidebar navigation, 12-column content.
  - *Tablet (768px - 1199px):* Collapsed sidebar (icons only), 8-column content.
  - *Mobile (<767px):* Stacked forms, hidden sidebars, single-column utility.

## Elevation & Depth

To maintain a clean, professional look, the system avoids heavy shadows. Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** #F7FAFC (Light Gray).
- **Level 1 (Cards/Tables):** White background with a 1px border (#E2E8F0).
- **Level 2 (Modals/Popovers):** White background with a soft, diffused ambient shadow (0px 4px 12px rgba(0, 0, 0, 0.05)) to distinguish overlay content from the underlying data.
- **Interaction:** Hover states on table rows use a subtle background tint (#EDF2F7) rather than elevation changes.

## Shapes

The design system adopts a **Soft** shape language. 

- **Standard Radius:** 0.25rem (4px) for input fields, buttons, and small containers. This provides a precise, engineered feel.
- **Large Radius:** 0.5rem (8px) for primary content cards and modals.
- **Exceptions:** Status chips for "Inquiry Status" (e.g., Pending, Completed) use a full pill shape to differentiate them from actionable buttons.

## Components

### Buttons
- **Primary:** Solid #0F4C81 with white text. High contrast for final submissions.
- **Secondary:** Ghost style with #0F4C81 border and text. Used for "Cancel" or "Add Item".
- **Tertiary:** Text-only for low-priority actions within data rows.

### Data Inputs
- **Form Fields:** Labels are always positioned above the input. Borders use a 1px solid #CBD5E0, turning primary blue on focus. 
- **Validation:** Error states must include both a red border (#C53030) and an icon-led helper text for accessibility.

### Data Tables
- **Header:** Light gray background (#EDF2F7) with uppercase, bold 12px text.
- **Cells:** Vertical borders are removed; only horizontal dividers are used to enhance scanning speed.
- **Action Column:** Always pinned to the right side of the screen.

### Chips & Status Indicators
- **Inquiry Status:** Use background tints with dark text (e.g., "New" = Light Blue bg / Navy text; "Rejected" = Light Red bg / Dark Red text). 

### Navigation
- **Sidebar:** Vertical navigation on the left with a dark theme (#1A202C) to contrast against the light content area. Active states are indicated by a 4px primary blue left-border.