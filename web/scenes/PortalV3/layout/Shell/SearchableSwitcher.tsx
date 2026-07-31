"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import {
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SwitcherItem = { id: string; name: string };

export const switcherTriggerClassName =
  "h-9 min-w-0 cursor-pointer px-3 font-world text-13 leading-none font-medium";

const createActionClassName =
  "h-10 w-full justify-start gap-2 rounded-8 px-3 font-world text-13 font-medium text-portal-text hover:bg-grey-50 hover:text-portal-text";

type CreateAction = {
  label: string;
  href?: string;
  onSelect?: () => void;
};

type SearchableSwitcherProps<T extends SwitcherItem> = {
  items: readonly T[];
  selectedId?: string;
  renderTrigger: (open: boolean) => ReactElement;
  renderLeading?: (item: T) => ReactNode;
  getItemHref: (item: T) => string;
  searchLabel: string;
  listLabel: string;
  emptyLabel: string;
  emptyLeading?: ReactNode;
  showEmptyState?: boolean;
  noResultsLabel: string;
  createAction?: CreateAction;
  side?: ComponentProps<typeof PopoverContent>["side"];
  testIdPrefix: string;
};

export const SearchableSwitcher = <T extends SwitcherItem>(
  props: SearchableSwitcherProps<T>,
) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollHint, setShowScrollHint] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredItems = useMemo(
    () =>
      normalizedQuery
        ? props.items.filter((item) =>
            item.name.toLocaleLowerCase().includes(normalizedQuery),
          )
        : props.items,
    [normalizedQuery, props.items],
  );

  const setPopoverOpen = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearchQuery("");
  }, []);

  const updateScrollHint = useCallback(
    (list: HTMLUListElement | null = listRef.current) => {
      setShowScrollHint(
        Boolean(
          list && list.scrollTop + list.clientHeight < list.scrollHeight - 1,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      setShowScrollHint(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => updateScrollHint());
    const list = listRef.current;
    const observer =
      list && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateScrollHint(list))
        : null;
    if (list) observer?.observe(list);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [filteredItems.length, open, updateScrollHint]);

  const isEmpty = props.showEmptyState ?? props.items.length === 0;
  const hasNoResults = props.items.length > 0 && filteredItems.length === 0;
  const createActionContent = (
    <>
      <Icon name="dropdown-plus" className={`${opticalIconClassName} size-4`} />
      <span className="min-w-0 flex-1 truncate text-left">
        {props.createAction?.label}
      </span>
    </>
  );

  return (
    <Popover open={open} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>{props.renderTrigger(open)}</PopoverTrigger>

      <PopoverContent
        side={props.side ?? "bottom"}
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-[360px] max-w-[calc(100vw-24px)] gap-0 overflow-hidden rounded-[10px] border border-portal-border bg-white p-0 font-world shadow-[0_18px_11px_0_rgba(24,24,24,0.02),0_8px_8px_0_rgba(24,24,24,0.03),0_2px_4px_0_rgba(24,24,24,0.03)]"
      >
        <div className="relative flex h-14 items-center border-b border-portal-border px-4">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-portal-subtle"
          />
          <Input
            autoFocus
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={`${props.searchLabel}...`}
            aria-label={props.searchLabel}
            className="h-full rounded-none border-0 bg-transparent pr-0 pl-7 font-world text-13 text-portal-text shadow-none placeholder:text-portal-subtle focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <ul
          ref={listRef}
          aria-label={props.listLabel}
          data-testid={`${props.testIdPrefix}-switcher-list`}
          onScroll={(event) => updateScrollHint(event.currentTarget)}
          className="no-scrollbar max-h-[min(420px,50vh)] overflow-y-auto overscroll-contain p-1.5"
        >
          {isEmpty ? (
            <li className="flex h-16 items-center gap-2 px-3 text-portal-muted">
              {props.emptyLeading}
              <span className="min-w-0 flex-1 truncate">
                {props.emptyLabel}
              </span>
            </li>
          ) : null}

          {hasNoResults ? (
            <li className="flex h-16 items-center justify-center px-3 text-13 text-portal-muted">
              {props.noResultsLabel}
            </li>
          ) : null}

          {filteredItems.map((item) => {
            const isSelected = item.id === props.selectedId;

            return (
              <li key={item.id}>
                <Link
                  href={props.getItemHref(item)}
                  aria-current={isSelected ? "page" : undefined}
                  onClick={() => setPopoverOpen(false)}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-2 rounded-8 px-3 font-world text-13 font-medium text-portal-text outline-none hover:bg-grey-50 focus-visible:bg-grey-50",
                    isSelected && "bg-grey-50",
                  )}
                >
                  {props.renderLeading?.(item)}
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {isSelected ? (
                    <Icon
                      name="dropdown-check"
                      className={`${opticalIconClassName} size-4`}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        {props.createAction ? (
          <div
            data-testid={`${props.testIdPrefix}-switcher-footer`}
            className={cn(
              "relative z-10 border-t border-portal-border bg-white p-1.5",
              showScrollHint &&
                "shadow-[0_-12px_18px_-10px_rgba(24,24,24,0.16)]",
            )}
          >
            {props.createAction.href ? (
              <Button asChild variant="ghost" className={createActionClassName}>
                <Link
                  href={props.createAction.href}
                  onClick={() => setPopoverOpen(false)}
                >
                  {createActionContent}
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPopoverOpen(false);
                  props.createAction?.onSelect?.();
                }}
                className={createActionClassName}
              >
                {createActionContent}
              </Button>
            )}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};
