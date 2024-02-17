import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

export const ActionIdKioskPage = () => {
  return (
    <div className={clsx("fixed inset-0 grid w-full justify-center bg-white")}>
      <div className="grid h-[100dvh] w-[100dvw] grid-rows-auto/1fr">
        <Typography variant={TYPOGRAPHY.H6}>Kiosk</Typography>
      </div>
    </div>
  );
};
