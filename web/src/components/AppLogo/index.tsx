import React, { memo } from "react";
import cn from "classnames";
import Image from "next/image";
import styles from "./styles.module.css";
import { AppMetadataModel } from "src/lib/models";

export const AppLogo = memo(function AppLogo(props: {
  appMetadata: Pick<
    AppMetadataModel,
    "name" | "logo_img_url" | "verification_status"
  >;
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
      {!props.appMetadata.logo_img_url && (
        <span
          className={cn(
            "uppercase m-auto font-bold bg-gradient-to-r bg-clip-text text-transparent from-ff6848 to-primary leading-none",
            { "text-6": !props.textClassName },
            props.textClassName
          )}
        >
          {props.appMetadata.name
            .split(" ")
            .map((word) => word[0])
            .join("")}
        </span>
      )}

      {props.appMetadata.logo_img_url && (
        <div className="w-full h-full">
          <Image
            src={props.appMetadata.logo_img_url}
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
