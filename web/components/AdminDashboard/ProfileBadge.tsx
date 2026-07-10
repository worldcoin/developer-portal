import clsx from "clsx";
import { User } from "lucide-react";
import { UIModule } from "./UIModule";

export const ProfileBadge = () => {
  return (
    <UIModule
      className={clsx(
        "grid size-10 place-items-center p-0",
        "3xl:size-[3.125rem]",
        "4xl:size-[4.375rem]",
      )}
    >
      <User className={clsx("size-5", "3xl:size-6", "4xl:size-9")} />
    </UIModule>
  );
};
