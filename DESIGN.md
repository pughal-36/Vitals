# Vitals design system

Vitals uses the blue-and-white Earth hero reference as its visual source. The interface is light-theme-only: the navy hero and navigation carry the opening impression, while paper-colored surfaces keep audits calm and legible.

## Tokens

| Token | Hex | Role |
| --- | --- | --- |
| Deep navy | `#303A5E` | Hero, navigation, primary actions |
| Paper white | `#FFFFFF` | Torn-paper field and content surfaces |
| Soft paper | `#F7F6F1` | Page background |
| Ink | `#242B42` | Primary text on paper |
| Olive | `#59683D` | Earth land and secondary data accent |
| Sun yellow | `#E8D86A` | Pin and restrained highlight |
| Blue-violet | `#7479A9` | Supporting globe and score category |

Navy and white are paired for the hero and buttons; ink and paper are paired for reading surfaces. Use the darker olive/ochre data shades for text and the lighter palette colors for non-text decoration. Never encode a score using color alone: show the score value and its category label.

## Type

- **Hero headline:** Bodoni Moda ExtraBold (800), loaded with `next/font/google`; a high-contrast display serif echoes the reference. The headline is fluidly sized with `clamp()`.
- **Everything else:** native system stack (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `sans-serif`). No mono display or body face.

## Layout

The landing hero is a full-width navy field. The wordmark and four navigation destinations sit in a compact top row; the oversized centered two-line headline sits above a low-poly Earth globe that is intentionally cropped by the lower edge. A simulated torn-paper edge separates the globe from the scan entry area. The scan form and saved readout remain in the paper content flow.

```text
+--------------------------------------------------+
| VITALS              Audit Readout Assistant About|
|                                                  |
|          Audit your site's                       |
|             Web Vitals                            |
|             (globe)                              |
|       [       Run a scan       ]                  |
| ~~~~~~~~~~~~~ torn paper edge ~~~~~~~~~~~~~~~~~~ |
|  Audit a URL                                      |
|  [ URL input                         ] [ Scan ]   |
+--------------------------------------------------+
```

At 360–430 px, the hero is stacked and type scales down without clipping. At wider widths, the same centered headline/globe composition expands rather than becoming a conventional split-screen SaaS hero. Content and controls are left-aligned except the reference-led hero headline and CTA, which are centered.

## Principles

- Preserve the reference's distinctive serif-over-globe composition; keep the rest of the interface quieter.
- Build the paper edge from CSS, not an uncredited image or texture asset.
- Keep scan behavior and API/data boundaries unchanged.
- Respect reduced-motion preference, readable contrast, keyboard focus, and 44 px touch targets.
