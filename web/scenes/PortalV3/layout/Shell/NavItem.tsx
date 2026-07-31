import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import Link from "next/link";
import {
  MouseEventHandler,
  ReactNode,
  RefObject,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

export const NavItem = (props: {
  href: string;
  label: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  active?: boolean;
  current?: boolean;
  dimmed?: boolean;
  className?: string;
  children?: ReactNode;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) => {
  const {
    href,
    label,
    icon,
    trailing,
    active,
    current,
    dimmed,
    className,
    children,
    onNavigate,
  } = props;

  return (
    <SidebarMenuItem>
      {/* The active surface (white card) is NavActivePill sliding behind the
          items; the item itself only changes text color when active. The
          bg-transparent overrides neutralize SidebarMenuButton's built-in
          data-active/hover sidebar-accent backgrounds, which would otherwise
          paint over the pill. */}
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn(
          "h-10 cursor-pointer rounded-[10px] px-3 font-world text-13 leading-none font-normal text-portal-muted transition-colors duration-200 ease-out hover:text-portal-text data-[active=false]:hover:bg-portal-border data-[active=true]:bg-transparent data-[active=true]:text-portal-text data-[active=true]:hover:bg-transparent",
          className,
        )}
      >
        <Link
          href={href}
          onClick={onNavigate}
          aria-current={
            current === false ? undefined : active ? "page" : undefined
          }
          className={dimmed ? "opacity-40" : undefined}
        >
          {icon ? (
            <span className={`${opticalIconClassName} text-current`}>
              {icon}
            </span>
          ) : null}
          <span>{label}</span>
          {trailing ? (
            <span className="ml-auto shrink-0 group-data-[collapsible=icon]:hidden">
              {trailing}
            </span>
          ) : null}
        </Link>
      </SidebarMenuButton>
      {children}
    </SidebarMenuItem>
  );
};

type PillBox = { top: number; left: number; width: number; height: number };

const sameBox = (a: PillBox | null, b: PillBox) =>
  a !== null &&
  a.top === b.top &&
  a.left === b.left &&
  a.width === b.width &&
  a.height === b.height;

/**
 * The single card surface backing the active sidebar item. Each item painting
 * its own active background can only pop in/out, so instead one absolutely
 * positioned pill slides between items with a transform transition. It
 * positions itself on the item carrying `data-active="true"` (set by
 * SidebarMenuButton), which follows the nav's optimistic active state — so the
 * slide starts on click, not when the route settles.
 *
 * The measuring effect deliberately has no dependency array: everything that
 * moves the items (active change, Mini App submenu expanding, Danger zone
 * appearing) is render-driven, and one rect read per render is negligible.
 * The ResizeObserver covers non-render size changes of the active item.
 */
export const NavActivePill = (props: {
  navRef: RefObject<HTMLElement | null>;
  variant?: "default" | "danger";
}) => {
  const [box, setBox] = useState<PillBox | null>(null);
  const [animated, setAnimated] = useState(false);

  useLayoutEffect(() => {
    const nav = props.navRef.current;
    if (!nav) return;
    const activeItem = nav.querySelector<HTMLElement>(
      '[data-sidebar="menu-button"][data-active="true"]',
    );
    if (!activeItem) {
      setBox(null);
      return;
    }
    const measure = () => {
      // Deltas of client rects stay valid while the sidebar scrolls or slides
      // in from offcanvas, since nav and item move together.
      const navRect = nav.getBoundingClientRect();
      const rect = activeItem.getBoundingClientRect();
      const next = {
        top: rect.top - navRect.top,
        left: rect.left - navRect.left,
        width: rect.width,
        height: rect.height,
      };
      setBox((prev) => (sameBox(prev, next) ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(activeItem);
    // The nav itself resizes on sidebar collapse/expand and viewport changes
    // that don't touch the active item's own box.
    observer.observe(nav);
    // World Pro swapping in after first paint can reflow labels without
    // resizing the h-10 items, so the observers stay silent — re-measure once
    // fonts settle to keep the initial placement honest.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  });

  // Enable transitions one paint after the first placement so the pill never
  // slides in from (0, 0) when it mounts on an already-active item.
  const placed = box !== null;
  useEffect(() => setAnimated(placed), [placed]);

  if (!box) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0 rounded-[10px] border border-portal-border bg-white shadow-portal-card",
        props.variant === "danger" &&
          "border-system-error-200 bg-system-error-50 shadow-none",
        animated &&
          "transition-[transform,width,height,background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
      )}
      style={{
        transform: `translate(${box.left}px, ${box.top}px)`,
        width: box.width,
        height: box.height,
      }}
    />
  );
};
