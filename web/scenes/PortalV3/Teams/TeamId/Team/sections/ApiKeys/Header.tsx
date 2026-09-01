"use client";

import { PlusIcon } from "@/components/Icons/PlusIcon";

type ApiKeysHeaderProps = {
  canCreate: boolean;
  disabled?: boolean;
  onCreate?: () => void;
};

export const ApiKeysHeader = (props: ApiKeysHeaderProps) => (
  <header className="flex h-8 items-center justify-between gap-4">
    <h1 className="font-world text-19 leading-[1.2] font-[500] tracking-[-0.01em] text-portal-ink">
      API Keys
    </h1>

    {props.canCreate ? (
      <button
        type="button"
        onClick={props.onCreate}
        disabled={props.disabled}
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-8 bg-portal-ink px-3 font-world text-13 leading-none font-medium text-white transition-colors hover:bg-portal-ink-hover focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-500"
      >
        <PlusIcon className="size-4" />
        New key
      </button>
    ) : null}
  </header>
);
