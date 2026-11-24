import clsx from "clsx";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { UIModule } from "./UIModule";

export const ProfileBadge = () => {
  return (
    <UIModule
      className={clsx(
        "grid size-10 place-items-center p-0",
        "3xl:size-12.5",
        "4xl:size-17.5",
      )}
    >
      <Icon
        name="profile-circle"
        className={clsx("size-5", "3xl:size-6", "4xl:size-9")}
      />
    </UIModule>
  );
};
