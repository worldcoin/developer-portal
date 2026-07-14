"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

type ListPaginationProps = {
  ariaLabel: string;
  currentPage: number;
  limit: number;
  pageInputId: string;
  totalItems: number;
  totalPages: number;
};

export const getPaginationSlots = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "end", totalPages] as const;
  if (currentPage >= totalPages - 3)
    return [
      1,
      "start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  return [
    1,
    "start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end",
    totalPages,
  ] as const;
};

export const ListPagination = ({
  ariaLabel,
  currentPage,
  limit,
  pageInputId,
  totalItems,
  totalPages,
}: ListPaginationProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayedPage, setDisplayedPage] = useState(currentPage);
  const [pageInputValue, setPageInputValue] = useState(String(currentPage));
  const from = totalItems === 0 ? 0 : (displayedPage - 1) * limit + 1;
  const to = totalItems === 0 ? 0 : Math.min(displayedPage * limit, totalItems);

  useEffect(() => {
    setDisplayedPage(currentPage);
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  const updatePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const params = new URLSearchParams(searchParams.toString());
    setDisplayedPage(nextPage);
    setPageInputValue(String(nextPage));
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const page = Number(pageInputValue);
    if (Number.isInteger(page)) updatePage(page);
    else setPageInputValue(String(displayedPage));
  };

  return (
    <nav
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-2 justify-self-start text-12 text-grey-500 sm:justify-self-auto lg:justify-self-end"
    >
      <div className="text-left whitespace-nowrap lg:text-right">
        {from}-{to} of {totalItems}
      </div>
      <form className="relative" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor={pageInputId}>
          Go to page
        </label>
        <input
          className="h-9 w-full rounded-12 border border-grey-200 bg-grey-0 py-0 pr-9 pl-3 text-left font-medium text-grey-700 transition-colors outline-none placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500"
          id={pageInputId}
          inputMode="numeric"
          max={totalPages}
          min={1}
          onBlur={() => {
            if (!pageInputValue.trim())
              setPageInputValue(String(displayedPage));
          }}
          onChange={(event) => setPageInputValue(event.target.value)}
          type="number"
          value={pageInputValue}
        />
        <PageButton
          ariaLabel="Go to page"
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2 bg-grey-100 text-grey-500 hover:bg-grey-200 hover:text-grey-900"
          type="submit"
        >
          <ChevronRight className="size-4" />
        </PageButton>
      </form>
      <PageButton
        ariaLabel="Previous page"
        disabled={displayedPage <= 1}
        onClick={() => updatePage(displayedPage - 1)}
      >
        <ChevronLeft className="size-4" />
      </PageButton>
      {getPaginationSlots(displayedPage, totalPages).map((slot) =>
        typeof slot === "string" ? (
          <span
            aria-hidden="true"
            className="hidden size-9 place-items-center text-grey-400 lg:grid"
            key={slot}
          >
            ...
          </span>
        ) : (
          <PageButton
            ariaCurrent={slot === displayedPage ? "page" : undefined}
            ariaLabel={`Page ${slot}`}
            isActive={slot === displayedPage}
            isHiddenOnMobile
            key={slot}
            onClick={() => updatePage(slot)}
          >
            {slot}
          </PageButton>
        ),
      )}
      <PageButton
        ariaLabel="Next page"
        disabled={displayedPage >= totalPages}
        onClick={() => updatePage(displayedPage + 1)}
      >
        <ChevronRight className="size-4" />
      </PageButton>
    </nav>
  );
};

type PageButtonProps = {
  ariaCurrent?: "page";
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  isActive?: boolean;
  isHiddenOnMobile?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};
const PageButton = ({
  ariaCurrent,
  ariaLabel,
  children,
  className,
  disabled,
  isActive,
  isHiddenOnMobile,
  onClick,
  type = "button",
}: PageButtonProps) => (
  <button
    aria-current={ariaCurrent}
    aria-label={ariaLabel}
    className={clsx(
      isHiddenOnMobile ? "hidden lg:grid" : "grid",
      "place-items-center rounded-12 border font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40",
      className ??
        "size-9 border-grey-200 bg-grey-0 text-grey-500 hover:bg-grey-100 hover:text-grey-900",
      isActive &&
        "border-grey-300 bg-grey-100 text-grey-900 shadow-button ring-1 ring-grey-300 ring-inset hover:bg-grey-100 hover:text-grey-900",
    )}
    disabled={disabled}
    onClick={onClick}
    type={type}
  >
    {children}
  </button>
);
