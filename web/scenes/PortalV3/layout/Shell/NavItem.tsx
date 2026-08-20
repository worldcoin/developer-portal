import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  useCallback,
  MouseEventHandler,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const noopSubscribe = () => () => {};

/**
 * False during SSR and the hydration render, true right after. The nav items
 * paint a static active card while this is false, so a cold load shows the
 * correct active state straight from the URL (even before — or without —
 * client JS); the measured NavActivePill takes over once hydration completes.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

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

  const hydrated = useHydrated();

  return (
    <SidebarMenuItem>
      {/* The active surface (white outlined row) is NavActivePill sliding behind the
          items; the item itself only changes text color when active. The
          bg-transparent overrides neutralize SidebarMenuButton's built-in
          data-active/hover sidebar-accent backgrounds, which would otherwise
          paint over the pill. */}
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn(
          "h-9 cursor-pointer gap-3 rounded-8 pr-4 pl-2.5 font-world text-13 leading-[1.2] font-[450] text-portal-ink transition-colors duration-200 ease-out hover:text-portal-ink data-[active=false]:hover:bg-portal-border data-[active=true]:bg-transparent data-[active=true]:text-portal-ink data-[active=true]:hover:bg-transparent",
          !hydrated &&
            "data-[active=true]:border data-[active=true]:border-portal-border data-[active=true]:bg-white data-[active=true]:hover:bg-white",
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
          {icon ? <span className="shrink-0 text-current">{icon}</span> : null}
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

type PillPlacement = { box: PillBox; animate: boolean };

type ActivePillOptions = {
  containerSelector: string;
  activeItemSelector: string;
};

/**
 * The single card surface backing the active sidebar item. Each item painting
 * its own active background can only pop in/out, so instead one absolutely
 * positioned pill slides between items with a transform transition. It
 * positions itself on the item carrying `data-active="true"` (set by
 * SidebarMenuButton), which follows the nav's optimistic active state — so the
 * slide starts on click, not when the route settles.
 *
 * The slide only plays when the ACTIVE ITEM changes (keyed by href). A
 * reposition of the same item snaps instead — post-hydration layout settles
 * on a cold load, or the nav restructuring around the item — because the
 * items themselves jump instantly, so an animated pill chasing them reads as
 * drift, not intent. This also covers first placement: the pill never slides
 * in from (0, 0), which is what lets the host remount it (via `key`) to force
 * an instant re-place when the nav's item set is rebuilt.
 *
 * The measuring effect deliberately has no dependency array: everything that
 * moves the items (active change or a permission-gated row appearing) is
 * render-driven, and one rect read per render is negligible.
 * The ResizeObserver covers non-render size changes of the active item.
 *
 * The pill finds its container through its own rendered node instead of a ref
 * passed from the parent: a parent's element ref is not attached yet when a
 * child's layout effect runs on the very first commit, and a hard refresh
 * gives exactly one commit — bailing there left the sheath permanently
 * missing once the static SSR card handed off. The pill's own node is always
 * committed before its effect runs, so `closest()` is reliable.
 */
const useActivePillPlacement = (options: ActivePillOptions) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<PillPlacement | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  const setElementRef = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  // Active state changes through data attributes on descendants, so this must
  // re-measure after every render rather than only when selector strings change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const container = elementRef.current?.closest<HTMLElement>(
      options.containerSelector,
    );
    if (!container) return;
    const activeItem = container.querySelector<HTMLElement>(
      options.activeItemSelector,
    );
    if (!activeItem) {
      activeKeyRef.current = null;
      setPlacement(null);
      return;
    }
    const measure = () => {
      const key = activeItem.getAttribute("href") ?? activeItem.textContent;
      const slide = key !== activeKeyRef.current;
      activeKeyRef.current = key;
      // Deltas of client rects stay valid while the sidebar scrolls or slides
      // in from offcanvas, since the container and item move together.
      const containerRect = container.getBoundingClientRect();
      const rect = activeItem.getBoundingClientRect();
      // A hidden mid-state (display:none while the sidebar toggles between
      // its desktop and sheet forms) measures 0×0. Adopting it would leave an
      // invisible pill that sameBox never lets recover — keep the last real
      // placement instead; the ResizeObserver re-fires once the item is
      // visible again.
      if (rect.width === 0 || rect.height === 0) return;
      const box = {
        // Absolute offsets start at the container's padding edge, while its
        // client rect starts at the border edge.
        top: rect.top - containerRect.top - container.clientTop,
        left: rect.left - containerRect.left - container.clientLeft,
        width: rect.width,
        height: rect.height,
      };
      setPlacement((prev) =>
        prev && sameBox(prev.box, box)
          ? prev
          : { box, animate: slide && prev !== null },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(activeItem);
    // The container itself resizes on sidebar collapse/expand and viewport
    // changes that don't touch the active item's own box.
    observer.observe(container);
    // World Pro swapping in after first paint can reflow labels without
    // resizing the fixed-height items, so the observers stay silent — re-measure once
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

  return { placement, setElementRef };
};

const activePillStyle = (placement: PillPlacement | null) =>
  placement
    ? {
        transform: `translate(${placement.box.left}px, ${placement.box.top}px)`,
        width: placement.box.width,
        height: placement.box.height,
      }
    : undefined;

export const NavActivePill = () => {
  const { placement, setElementRef } = useActivePillPlacement({
    containerSelector: "nav",
    activeItemSelector: '[data-sidebar="menu-button"][data-active="true"]',
  });

  // The span stays mounted even before placement (hidden): the effect above
  // needs it in the DOM to locate the nav on the first — possibly only —
  // commit after a hard refresh.
  return (
    <span
      ref={setElementRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0 rounded-8 border border-portal-border bg-white",
        !placement && "hidden",
        placement?.animate &&
          "transition-[transform,width,height] duration-200 ease-out motion-reduce:transition-none",
      )}
      style={activePillStyle(placement)}
    />
  );
};

export const SidebarSubNavigationActivePill = () => {
  const { placement, setElementRef } = useActivePillPlacement({
    containerSelector: '[data-sidebar="menu-sub"]',
    activeItemSelector: '[data-sidebar="menu-sub-button"][data-active="true"]',
  });

  return (
    <li
      ref={setElementRef}
      aria-hidden="true"
      data-sidebar="menu-sub-active-pill"
      className={cn(
        "pointer-events-none absolute top-0 left-0 rounded-md bg-white",
        !placement && "hidden",
        placement?.animate &&
          "transition-[transform,width,height] duration-200 ease-out motion-reduce:transition-none",
      )}
      style={activePillStyle(placement)}
    />
  );
};
