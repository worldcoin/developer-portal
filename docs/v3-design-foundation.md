# Developer Portal v3 — Design Foundation

> Visual language for the v3 shell. Pairs with `docs/v3-ia-spec.md` (structure) and
> `docs/superpowers/plans/` (build). Direction: **Vercel's structural restraint, World's
> identity.** World blue `#4940E0` is reserved for focus rings and primary CTAs; the
> sidebar active state is a **neutral grey fill** (Vercel-style, no color — per user).
> Everything else is neutral grey + hairlines.

## Semantic tokens

CSS variables live in `styles/globals.css` (`:root` = light, `.dark` = dark) and are
exposed as Tailwind colors in `tailwind.config.ts`. Use the Tailwind names below — never
hardcode hex in v3 components. Light values derive from the existing World palette; dark
values are net-new (the palette was light-only).

| Tailwind class root | CSS var | Light | Dark | Use |
|---|---|---|---|---|
| `background` | `--v3-background` | `#FFFFFF` | `#0B0E11` | content surface |
| `foreground` | `--v3-foreground` | `#191C20` | `#F5F6F7` | primary text |
| `muted-foreground` | `--v3-muted-foreground` | `#657080` | `#9BA3AE` | secondary text, **default nav item** |
| `faint-foreground` | `--v3-faint-foreground` | `#9BA3AE` | `#5A6573` | **disabled** text/icon |
| `card` | `--v3-card` | `#FFFFFF` | `#16191C` | cards on the surface |
| `sidebar` | `--v3-sidebar` | `#FBFBFC` | `#0E1113` | sidebar bg (a hair off `background`) |
| `border` | `--v3-border` | `#EBECEF` | `#23272B` | hairline borders + dividers |
| `muted` | `--v3-muted` | `#F3F4F5` | `#1A1E22` | hover surface |
| `accent` | `--v3-accent` | `#4940E0` | `#6C63FF` | World blue — active/focus/CTA |
| `accent-foreground` | `--v3-accent-foreground` | `#FFFFFF` | `#FFFFFF` | text on accent |
| `accent-muted` | `--v3-accent-muted` | `#F0F0FD` | `rgba(108,99,255,.14)` | subtle accent fill (not nav active) |
| `ring` | `--v3-ring` | `#4940E0` | `#6C63FF` | focus ring |

Examples: `bg-background text-foreground`, `border-border`, `text-muted-foreground`,
`bg-accent text-accent-foreground`, `ring-ring`.

## Type & density

- **Fonts:** `font-gta` (GT America) is the UI workhorse — the Geist-like role. `font-twk`
  (TWK Lausanne) for page/section headings. `font-world` for fine print/data labels.
- **Shell scale:** nav + switcher labels `text-14` medium (500); group labels `text-11`
  uppercase `tracking-wide` `text-muted-foreground`; content header title `text-14`–`text-16`.
- **Density (Vercel-like):** sidebar `w-64`; nav rows ~32px (`px-2.5 py-1.5`), `gap-2.5`
  icon→label, `gap-1` between rows; radius `rounded-8`; content header `h-14` `border-b border-border`.

## Component treatments

**Sidebar** — `bg-sidebar`, `border-r border-border`, full height, three regions stacked:
team switcher (header) · nav groups (scroll, `no-scrollbar`) · user popup (pinned bottom).
Hairline `border-t border-border` between the app group, the team group, and the user area.

**Team switcher (sidebar header)** — team avatar (deterministic color) + name (`text-14`
medium, `truncate`) + plan badge (`text-11`, `bg-muted text-muted-foreground`, `rounded-8`) +
up/down chevron. **Clicking the name → apps grid**; **clicking the chevron → switch-team
dropdown** (Radix `DropdownMenu`). Row hover: `bg-muted`.

**App switcher (content header)** — Radix dropdown trigger: current app name + chevron;
lists real apps + a "Create app" item. **No "All Apps" entry.** Lives in the content header,
not the sidebar.

**Nav item — states (disable-not-hide is load-bearing):**
- default: `text-muted-foreground`, icon inherits.
- hover: `bg-muted text-foreground`.
- active: `bg-muted text-foreground` — a persistent neutral grey fill (the hover fill, made permanent) + foreground text. No accent color, no left bar. This is Vercel's treatment.
- disabled: `text-faint-foreground cursor-not-allowed`, no hover, `aria-disabled`; a small
  lock icon + tooltip ("Requires Owner/Admin"). Stays visible and inert — never hidden.
- focus-visible: `ring-2 ring-ring ring-offset-2 ring-offset-sidebar`.

**User popup (bottom)** — avatar + name + chevron; Radix `DropdownMenu` opening upward:
Profile · My Teams · Help · Docs · Theme toggle · Log out, then a divider and the **Platform
Status** row: a status dot + label ("All systems normal"). Dot color from real upstream
status; "status unavailable" on fetch failure (never default green).

**Content area** — `bg-background text-foreground`; top `h-14` header (`border-b border-border`)
holding the app switcher; page content below.

## Quality floor

Responsive to mobile (sidebar collapses to a drawer; content-header app switcher stays
reachable), visible keyboard focus (`ring-ring`), `prefers-reduced-motion` respected,
Radix for all interactive a11y.

## Brand expression

Per direction, the sidebar follows Vercel's **neutral** active state (grey fill, no color) —
no blue nav highlight. World's identity comes through elsewhere: brand blue on primary CTAs
and focus rings, the World fonts, and the World logo/marks. Color is reserved for *action*,
not *navigation* — the shell stays disciplined and neutral.
