import { Fragment } from "react";
import cn from "classnames";
import Image from "next/image";
import { Icon } from "common/Icon";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { useToggle } from "common/hooks";
import useAuth from "hooks/useAuth";

export function LoggedUserDisplay(props: { className?: string }) {
  const modal = useToggle(false);
  const { user } = useAuth();

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
          "grid grid-cols-auto/1fr gap-x-3 gap-y-1 cursor-default",
          { "cursor-pointer": user?.id },
          props.className
        )}
        onClick={() => modal.toggleOn()}
      >
        <div
          className={cn("p-3 rounded-full overflow-hidden row-span-2", {
            "flex justify-center items-center bg-edecfc": !image,
          })}
        >
          {image && (
            <Image
              src={image}
              alt="avatar"
              layout="fixed"
              objectFit="cover"
              width={44}
              height={44}
            />
          )}

          {!image && <Icon name="user" className="w-5 h-5 text-primary" />}
        </div>

        <span className="font-rubik text-neutral-dark text-13 leading-none self-end">
          {user?.email}
          {!user?.email && <span className="font-medium">Add your email</span>}
        </span>

        <span className="font-rubik text-neutral-secondary text-13 self-start leading-none">
          {user?.team.name}
        </span>
      </div>
    </Fragment>
  );
}
