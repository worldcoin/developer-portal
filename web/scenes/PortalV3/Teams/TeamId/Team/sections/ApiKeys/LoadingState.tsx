"use client";

import { MoreVerticalIcon } from "@/components/Icons/MoreVerticalIcon";
import Skeleton from "react-loading-skeleton";
import {
  ApiKeysTableHeader,
  apiKeysTableColumnsClassName,
} from "./ApiKeyTable/TableHeader";
import { ApiKeysHeader } from "./Header";

export const ApiKeysLoadingState = (props: { canCreate?: boolean }) => (
  <div className="w-full px-4 pt-5 pb-28 sm:px-6" aria-busy="true">
    <div className="w-full max-w-[800px] min-w-0">
      <ApiKeysHeader canCreate={props.canCreate ?? true} disabled />

      <div
        role="table"
        aria-label="API keys"
        className="mt-4 overflow-hidden rounded-[10px] border border-portal-border bg-white"
      >
        <ApiKeysTableHeader />

        <div role="rowgroup" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              role="row"
              key={index}
              className={`grid h-12 ${apiKeysTableColumnsClassName} items-center border-b border-portal-border last:border-b-0`}
            >
              <div role="cell" className="min-w-0 px-4">
                <Skeleton width="68%" height={16} />
              </div>
              <div role="cell" className="min-w-0 px-4">
                <Skeleton width="62%" height={16} />
              </div>
              <div role="cell" className="min-w-0 px-4">
                <Skeleton width="42%" height={16} />
              </div>
              <div role="cell" className="flex justify-end pr-4">
                <MoreVerticalIcon className="size-5 text-[#808080]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading API keys
      </span>
    </div>
  </div>
);
