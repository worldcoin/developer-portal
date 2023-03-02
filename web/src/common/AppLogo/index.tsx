import React, { memo } from "react";
import cn from "classnames";
import Image from "next/image";
import { AppType } from "types";
import { Icon } from "src/common/Icon";
import styles from "./styles.module.css";

export const AppLogo = memo(function AppLogo(props: {
  app: Pick<AppType, "name" | "verified_app_logo" | "is_verified">;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-primary/10 to-a39dff/10 flex",
        { "w-full h-full": !props.className },
        styles.mask,
        props.className
      )}
    >
      {!props.app.verified_app_logo && (
        <span
          className={cn(
            "uppercase m-auto font-bold bg-gradient-to-r bg-clip-text text-transparent from-ff6848 to-primary leading-none",
            { "text-6": !props.textClassName },
            props.textClassName
          )}
        >
          {props.app.name
            .split(" ")
            .map((word) => word[0])
            .join("")}
        </span>
      )}

      {props.app.verified_app_logo && (
        <div className="w-full h-full">
          <Image
            src={props.app.verified_app_logo}
            layout="responsive"
            width={20}
            height={20}
            alt="app logo"
            priority
          />
        </div>
      )}
    </div>
  );
});
