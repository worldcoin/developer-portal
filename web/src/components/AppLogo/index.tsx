import React, { memo, useState } from "react";
import cn from "classnames";
import Image from "next/image";
import styles from "./styles.module.css";
import { AppMetadataModel } from "src/lib/models";

{
  /* This component is currently not used */
}
export const AppLogo = memo(function AppLogo(props: {
  appMetadata: Pick<
    AppMetadataModel,
    "name" | "logo_img_url" | "verification_status"
  >;
  app_id: string;
  className?: string;
  textClassName?: string;
}) {
  const image = props.appMetadata.logo_img_url
    ? `${process.env.NEXT_PUBLIC_VERIFIED_CDN_URL}/verified/${props.app_id}/${props.appMetadata.logo_img_url}`
    : "";

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-primary/10 to-a39dff/10 flex",
        { "w-full h-full": !props.className },
        styles.mask,
        props.className
      )}
    >
      {!image && (
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
      {image && (
        <div className="w-full h-full">
          <Image
            src={image}
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
