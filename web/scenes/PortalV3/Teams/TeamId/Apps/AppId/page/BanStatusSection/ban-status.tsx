"use client";

import { Button } from "@/components/Button";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { useAtom } from "jotai";
import { banMessageDialogOpenedAtom } from "@/scenes/common/Teams/TeamId/Apps/common/BanMessageDialog/atoms";

export const BanStatus = () => {
  const [, setIsOpened] = useAtom(banMessageDialogOpenedAtom);

  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-system-error-200 bg-system-error-50 px-5 py-3 text-system-error-600">
      <AlertIcon className="shrink-0 text-system-error-600" />
      <span className="min-w-0 flex-1 font-world text-13 leading-[1.3]">
        Your app was banned, users cannot access it anymore
      </span>

      <Button
        type="button"
        onClick={() => setIsOpened(true)}
        className="shrink-0 font-world text-13 font-medium text-system-error-600 transition-colors hover:text-system-error-700"
      >
        More Information
      </Button>
    </div>
  );
};
