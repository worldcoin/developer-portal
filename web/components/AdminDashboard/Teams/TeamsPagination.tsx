"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import { getTeamsVisibleRange, type TeamsLimit } from "./pagination";

type TeamsPaginationProps = {
  currentPage: number;
  limit: TeamsLimit;
  teamsAmount: number;
  totalPages: number;
};

type PaginationSlot =
  | {
      type: "page";
      page: number;
    }
  | {
      type: "ellipsis";
      id: "start-ellipsis" | "end-ellipsis";
    }
  | {
      type: "empty";
      id: string;
    };

const PAGINATION_SLOT_COUNT = 7;

const fillEmptySlots = (slots: PaginationSlot[]) => {
  return [
    ...slots,
    ...Array.from(
      { length: Math.max(PAGINATION_SLOT_COUNT - slots.length, 0) },
      (_, index) => ({
        type: "empty" as const,
        id: `empty-${index}`,
      }),
    ),
  ];
};

const getPaginationSlots = (
  currentPage: number,
  totalPages: number,
): PaginationSlot[] => {
  if (totalPages <= PAGINATION_SLOT_COUNT) {
    return fillEmptySlots(
      Array.from({ length: totalPages }, (_, index) => ({
        type: "page",
        page: index + 1,
      })),
    );
  }

  if (currentPage <= 4) {
    return [
      { type: "page", page: 1 },
      { type: "page", page: 2 },
      { type: "page", page: 3 },
      { type: "page", page: 4 },
      { type: "page", page: 5 },
      { type: "ellipsis", id: "end-ellipsis" },
      { type: "page", page: totalPages },
    ];
  }

  if (currentPage >= totalPages - 3) {
    return [
      { type: "page", page: 1 },
      { type: "ellipsis", id: "start-ellipsis" },
      { type: "page", page: totalPages - 4 },
      { type: "page", page: totalPages - 3 },
      { type: "page", page: totalPages - 2 },
      { type: "page", page: totalPages - 1 },
      { type: "page", page: totalPages },
    ];
  }

  return [
    { type: "page", page: 1 },
    { type: "ellipsis", id: "start-ellipsis" },
    { type: "page", page: currentPage - 1 },
    { type: "page", page: currentPage },
    { type: "page", page: currentPage + 1 },
    { type: "ellipsis", id: "end-ellipsis" },
    { type: "page", page: totalPages },
  ];
};

export const TeamsPagination = ({
  currentPage,
  limit,
  teamsAmount,
  totalPages,
}: TeamsPaginationProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [displayedPage, setDisplayedPage] = useState(currentPage);
  const [pageInputValue, setPageInputValue] = useState(String(currentPage));
  const paginationSlots = getPaginationSlots(displayedPage, totalPages);
  const range = getTeamsVisibleRange({
    page: displayedPage,
    limit,
    totalItems: teamsAmount,
  });

  useEffect(() => {
    setDisplayedPage(currentPage);
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  const updatePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const params = new URLSearchParams(searchParams.toString());

    setDisplayedPage(nextPage);
    setPageInputValue(String(nextPage));

    if (nextPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handlePageJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const page = Number(pageInputValue);

    if (!Number.isInteger(page)) {
      setPageInputValue(String(displayedPage));
      return;
    }

    updatePage(page);
  };

  const isFirstPage = displayedPage <= 1;
  const isLastPage = displayedPage >= totalPages;

  return (
    <nav
      aria-label="Teams table pagination"
      className="inline-grid grid-cols-[5.5rem_repeat(2,2.25rem)] items-center gap-2 justify-self-start text-12 text-grey-500 sm:grid-cols-[auto_5.5rem_repeat(2,2.25rem)] lg:grid-cols-[7rem_6rem_repeat(9,2.25rem)] lg:justify-end"
    >
      <div className="col-span-full text-left whitespace-nowrap sm:col-auto lg:text-right">
        {range.from}-{range.to} of {teamsAmount}
      </div>

      <form className="relative" onSubmit={handlePageJump}>
        <label className="sr-only" htmlFor="teams-page-jump">
          Go to page
        </label>
        <input
          className="h-9 w-full rounded-12 border border-grey-200 bg-grey-0 py-0 pr-9 pl-3 text-left font-medium text-grey-700 transition-colors outline-none placeholder:text-grey-400 focus-visible:ring-2 focus-visible:ring-blue-500"
          id="teams-page-jump"
          inputMode="numeric"
          max={totalPages}
          min={1}
          onBlur={() => {
            if (pageInputValue.trim() === "") {
              setPageInputValue(String(displayedPage));
            }
          }}
          onChange={(event) => setPageInputValue(event.target.value)}
          type="number"
          value={pageInputValue}
        />
        <button
          aria-label="Go to page"
          className="absolute top-1/2 right-1 grid size-7 -translate-y-1/2 place-items-center rounded-8 bg-grey-100 text-grey-500 transition-colors outline-none hover:bg-grey-200 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-500"
          type="submit"
        >
          <ChevronRight className="size-4" />
        </button>
      </form>

      <PaginationButton
        ariaLabel="Previous page"
        disabled={isFirstPage}
        onClick={() => updatePage(displayedPage - 1)}
      >
        <ChevronLeft className="size-4" />
      </PaginationButton>

      {paginationSlots.map((slot) => {
        if (slot.type === "empty") {
          return (
            <span
              aria-hidden="true"
              className="hidden size-9 lg:block"
              key={slot.id}
            />
          );
        }

        if (slot.type === "ellipsis") {
          return (
            <span
              aria-hidden="true"
              className="hidden size-9 place-items-center text-grey-400 lg:grid"
              key={slot.id}
            >
              ...
            </span>
          );
        }

        return (
          <PaginationButton
            ariaCurrent={slot.page === displayedPage ? "page" : undefined}
            ariaLabel={`Page ${slot.page}`}
            isActive={slot.page === displayedPage}
            isHiddenOnMobile
            key={slot.page}
            onClick={() => updatePage(slot.page)}
          >
            {slot.page}
          </PaginationButton>
        );
      })}

      <PaginationButton
        ariaLabel="Next page"
        disabled={isLastPage}
        onClick={() => updatePage(displayedPage + 1)}
      >
        <ChevronRight className="size-4" />
      </PaginationButton>
    </nav>
  );
};

type PaginationButtonProps = {
  ariaCurrent?: "page";
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  isActive?: boolean;
  isHiddenOnMobile?: boolean;
  onClick: () => void;
};

const PaginationButton = ({
  ariaCurrent,
  ariaLabel,
  children,
  disabled = false,
  isActive = false,
  isHiddenOnMobile = false,
  onClick,
}: PaginationButtonProps) => {
  return (
    <button
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      className={clsx(
        isHiddenOnMobile ? "hidden lg:grid" : "grid",
        "size-9 place-items-center rounded-12 border font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40",
        isActive
          ? "border-grey-300 bg-grey-100 text-grey-900 shadow-button ring-1 ring-grey-300 ring-inset hover:bg-grey-100 hover:text-grey-900"
          : "border-grey-200 bg-grey-0 text-grey-500 hover:bg-grey-100 hover:text-grey-900",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
};
