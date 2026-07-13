import { twMerge } from "tailwind-merge";

const ICON_PATH = "/images/portal-v3/icons";

/**
 * Optical alignment for an icon sitting beside cap-height text. Labels use
 * tight leading (`leading-none` / `leading-[1.2]`), so their glyphs sit high
 * in the line box while the descender space hangs below — a geometrically
 * centered icon therefore reads ~1px low next to the text. Put this on the
 * icon (or its wrapping slot) in any icon+label row instead of re-deriving
 * the nudge per call site.
 */
export const opticalIconClassName = "shrink-0 -translate-y-px";

/**
 * Renders a static SVG asset from `public/images/portal-v3/icons`. Decorative
 * by default (`alt=""` + `aria-hidden`), so give the surrounding control its
 * own accessible label. Pass `className` for sizing/color.
 *
 * `block` is important: an inline <img> sits on the text baseline and carries a
 * descender gap, which pushes the glyph a couple px off-center from adjacent
 * labels (e.g. the sidebar rows). Block removes that so `items-center` lines it
 * up exactly. Callers can still override the display via `className`.
 */
export const Icon = (props: { name: string; className?: string }) => (
  <img
    src={`${ICON_PATH}/${props.name}.svg`}
    alt=""
    aria-hidden="true"
    draggable={false}
    className={twMerge("block", props.className)}
  />
);
