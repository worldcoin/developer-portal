"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { createAppDialogOpenAtom } from "./state";

export const useCreateAppDialog = () => {
  const isOpen = useAtomValue(createAppDialogOpenAtom);
  const setIsOpen = useSetAtom(createAppDialogOpenAtom);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  return { isOpen, open, close };
};
