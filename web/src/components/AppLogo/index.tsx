import React, { memo, useEffect, useState } from "react";
import cn from "classnames";
import Image from "next/image";
import styles from "./styles.module.css";
import { AppMetadataModel } from "src/lib/models";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();

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
  const [image, setImage] = useState<string | null>(
    props.appMetadata.logo_img_url
      ? `${publicRuntimeConfig.NEXT_PUBLIC_VERIFIED_CDN_URL}/${props.app_id}/${props.appMetadata.logo_img_url}`
      : ""
  );
  useEffect(() => {
    if (!props.appMetadata?.logo_img_url) {
      return;
    }
    setImage(
      `${publicRuntimeConfig.NEXT_PUBLIC_VERIFIED_CDN_URL}/${props.app_id}/${props.appMetadata.logo_img_url}`
    );
  }, [props.appMetadata?.logo_img_url, props?.app_id]);

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
            onError={() => setImage(null)}
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
