import { useMemo } from "react";
import cn from "classnames";
import Image from "next/image";
import { Icon } from "src/components/Icon";
import { useFetchUser } from "./hooks/user-hooks";
import Link from "next/link";

export function LoggedUserDisplay(props: { className?: string }) {
  const { user } = useFetchUser();

  // FIXME: remove when real user image is available
  const image = "";

  const loggedUserName = useMemo(
    () => user.hasura.name || user.auth0.email,
    [user.auth0.email, user.hasura.name]
  );

  if (user?.hasura.loading) {
    return null;
  }

  return (
    <Link
      href="/profile"
      className={cn(
        "grid grid-cols-auto/1fr gap-x-3 gap-y-1 cursor-default",
        { "cursor-pointer": user?.hasura?.id },
        props.className
      )}
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
        {loggedUserName}
      </span>

      <span className="font-rubik text-neutral-secondary text-13 self-start leading-none">
        {user?.hasura.team?.name}
      </span>
    </Link>
  );
}
