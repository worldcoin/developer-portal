"use client";

import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import Skeleton from "react-loading-skeleton";

export const MembersLoadingState = () => (
  <div className="w-full px-4 pt-5 pb-28 sm:px-6" aria-busy="true">
    <div className="w-full max-w-[800px] min-w-0">
      <header className="relative h-8">
        <h1 className="absolute top-1/2 left-0 -translate-y-1/2 font-world text-19 leading-[1.2] font-[500] tracking-[-0.01em] text-portal-ink">
          Members
        </h1>

        <InkButton
          type="button"
          disabled
          className="absolute top-0 right-0 h-8 rounded-full px-6 text-13 leading-[1.2] font-[550] tracking-[-0.01em]"
        >
          Invite member
        </InkButton>
      </header>

      <div
        className="mt-4 flex h-[26px] gap-5 border-b border-portal-border"
        role="tablist"
        aria-label="Members view"
      >
        <button
          type="button"
          role="tab"
          aria-selected="true"
          disabled
          className="relative h-[26px] border-b border-portal-ink pb-[7px] font-world text-15 leading-[1.2] font-[450] text-portal-ink"
        >
          Team members
        </button>
        <button
          type="button"
          role="tab"
          aria-selected="false"
          disabled
          className="relative h-[26px] border-b border-transparent pb-[7px] font-world text-15 leading-[1.2] font-[450] text-[#7d7d7d]"
        >
          Pending invitations
        </button>
      </div>

      <label className="mt-4 flex h-10 w-full items-center gap-2 overflow-hidden rounded-[10px] border border-portal-border bg-white px-3">
        <MagnifierIcon className="size-4 shrink-0 text-[#808080]" />
        <input
          type="search"
          aria-label="Search by name or email"
          placeholder="Search by name or email"
          disabled
          className="h-full min-w-0 flex-1 appearance-none bg-transparent p-0 font-world text-13 leading-[1.3] font-[350] text-portal-ink outline-hidden placeholder:text-[#808080]"
        />
      </label>

      <div className="mt-6 grid min-w-0 gap-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[71px] w-full min-w-0 items-center justify-between gap-4 rounded-[10px] border border-portal-border p-4"
          >
            <div className="flex min-w-0 items-center gap-4">
              <Skeleton className="size-8 leading-normal" circle inline />
              <div className="flex min-w-0 flex-col gap-0.5">
                <Skeleton width={180} inline />
                <Skeleton width={60} inline />
              </div>
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center">
              <MoreVerticalIcon className="text-grey-400" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading members
      </span>
    </div>
  </div>
);
