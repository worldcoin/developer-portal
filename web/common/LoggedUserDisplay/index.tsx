import { Fragment, memo } from "react";
import cn from "classnames";
import Image from "next/image";
import { useValues } from "kea";
import { authLogic } from "logics/authLogic";
import { Icon } from "common/Icon";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { useToggle } from "common/hooks";

export function LoggedUserDisplay(props: { className?: string }) {
  const modal = useToggle(false);
  const { user } = useValues(authLogic);

  // FIXME remove when real user image is available
  const image = "";

  return (
    <Fragment>
      <ProfileSettingsModal
        isOpen={Boolean(user?.id) && modal.isOn}
        close={modal.toggleOff}
      />

      <div
        role="button"
        tabIndex={0}
        className={cn(
          "grid grid-cols-auto/1fr grid-rows-2 gap-x-3 cursor-default",
          { "cursor-pointer": user?.id },
          props.className
        )}
        onClick={() => modal.toggleOn()}
      >
        <div
          className={cn("h-10 w-10 rounded-full overflow-hidden row-span-2", {
            "flex justify-center items-center border border-f1f5f8": !image,
          })}
        >
          {image && (
            <Image
              src={image}
              alt="avatar"
              layout="fixed"
              objectFit="cover"
              width={40}
              height={40}
            />
          )}

          {!image && <Icon name="user" className="w-6 h-6 text-primary" />}
        </div>

        <span className="font-medium text-neutral-dark text-14 leading-none">
          {user?.name || "No name"}
        </span>
        <span className="text-13 text-neutral leading-none">
          {user?.email || "No @email"}
        </span>
      </div>
    </Fragment>
  );
}
