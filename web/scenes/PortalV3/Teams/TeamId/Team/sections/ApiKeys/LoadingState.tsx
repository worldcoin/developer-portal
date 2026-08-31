"use client";

import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

export const ApiKeysLoadingState = (props: { action?: ReactNode }) => (
  <div className="w-full px-4 pt-5 pb-28 sm:px-6" aria-busy="true">
    <div className="w-full max-w-[800px] min-w-0">
      <header className="flex h-8 items-center justify-between gap-4">
        <h1 className="font-world text-19 leading-[1.2] font-[500] tracking-[-0.01em] text-portal-ink">
          API Keys
        </h1>
        {props.action}
      </header>

      <section className="mt-4 flex h-[300px] items-center justify-center rounded-[10px] border border-portal-border bg-white px-6 text-center sm:px-[120px]">
        <div className="grid w-full max-w-[360px] gap-2" aria-hidden="true">
          <Skeleton width={120} height={20} />
          <Skeleton width="100%" height={16} />
        </div>
      </section>

      <span className="sr-only" role="status">
        Loading API keys
      </span>
    </div>
  </div>
);
