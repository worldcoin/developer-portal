"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  CREATE_TEAM_DIALOG_QUERY_PARAM,
  getCreateTeamDialogStateUrl,
} from "./dialogRouting";

export const useCreateTeamDialog = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get(CREATE_TEAM_DIALOG_QUERY_PARAM) === "true";

  const setIsOpen = useCallback(
    (nextIsOpen: boolean) => {
      router.replace(
        getCreateTeamDialogStateUrl(pathname, searchParams, nextIsOpen),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  return { isOpen, open, close };
};
