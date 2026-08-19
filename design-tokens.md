# Design Token System

This document outlines the visual identity, typography, spacing, and design constraints of the CareFin application to ensure a calm, readable, and professional user interface.

---

## 1. Color Palette

All UI components must exclusively use these colors. Do not scatter arbitrary HEX or RGB codes in component stylesheets.

| CSS Variable | Hex Value | UI Role | Description |
| :--- | :--- | :--- | :--- |
| `--color-bg` | `#F7F8F7` | Canvas | Calm, light background canvas. |
| `--color-surface` | `#FFFFFF` | Card / Panel | Pure white for page elements and surfaces. |
| `--color-text-primary` | `#263238` | Headings & Body | Slate-grey/almost-black for high contrast readability. |
| `--color-text-secondary` | `#647078` | Subtext & Labels | Mid-tone grey for secondary text. |
| `--color-accent-primary` | `#356B7A` | Buttons & Branding | Muted teal for key actions, navigation, and active states. |
| `--color-accent-secondary` | `#6E9B84` | Success / Informational| Muted sage green for success notifications or network status. |
| `--color-border` | `#E3E7E5` | Dividers & Borders | Light grey for subtle separations. |
| `--color-error` | `#D32F2F` | Alerts & Warnings | Soft crimson for error boundaries or verification warnings. |

---

## 2. Typography

CareFin uses modern, clean typography to prevent visual stress.
* **Primary Font**: **Inter** or **Outfit** (via Google Fonts).
* **Fallback**: Sans-serif.

### Type Scale

| Token | CSS Font Size | CSS Line Height | Font Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--font-h1` | `1.875rem` (30px) | `2.25rem` | 600 (Semi-bold) | Page Titles |
| `--font-h2` | `1.5rem` (24px) | `1.875rem` | 600 (Semi-bold) | Section Headers |
| `--font-h3` | `1.25rem` (20px) | `1.625rem` | 500 (Medium) | Sub-sections / Cards |
| `--font-body` | `1.0rem` (16px) | `1.5rem` | 400 (Regular) | Primary text content |
| `--font-sm` | `0.875rem` (14px) | `1.25rem` | 400 (Regular) | Captions, labels, table data |

---

## 3. Spacing System

CareFin uses a standard 8px grid.

* `--spacing-xs`: `0.25rem` (4px)
* `--spacing-sm`: `0.5rem` (8px)
* `--spacing-md`: `1.0rem` (16px)
* `--spacing-lg`: `1.5rem` (24px)
* `--spacing-xl`: `2.0rem` (32px)
* `--spacing-xxl`: `3.0rem` (48px)

---

## 4. UI Design Constraints

To maintain the "calm medical advisor" feel, we enforce these strict styling restrictions:

* **No Neon Accents**: Vibrant colors (e.g., `#00FF00`, `#FF00FF`) are forbidden.
* **No Glassmorphism**: Cards and headers must use solid background surfaces with `--color-surface` and simple `--color-border` lines (no blur filters or heavy box-shadows).
* **No Heavy Gradients**: Backgrounds are solid `--color-bg`. Subtle gradients are allowed only for brand assets (e.g. main logo) if approved.
* **No Robot Icons / AI Sparkles**: Avoid futuristic badges or glitter. Use simple text markers (e.g. "AI Interpretation") rather than graphic widgets.
* **No Unnecessary Animations**: Keep transitions fast (under `150ms`) and limit animations to basic hover opacity changes or slider details. Do not use animated background blobs or spin cycles.
* **Flat Borders**: Border radius on cards and buttons must remain clean: `--border-radius: 6px`.
