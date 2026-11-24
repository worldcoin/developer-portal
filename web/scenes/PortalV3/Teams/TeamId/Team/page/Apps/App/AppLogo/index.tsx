import { StatusVariant } from "@/components/AppStatus";
import { Placeholder } from "@/components/PlaceholderImage";
import { getCDNImageUrl } from "@/lib/utils";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";

export const AppLogo = (props: {
  src: string | undefined | null;
  appId: string;
  name: string;
  verification_status: StatusVariant;
}) => {
  const [src, setSrc] = useState<typeof props.src>(
    props.verification_status === "verified" && props.src
      ? getCDNImageUrl(props.appId, props.src)
      : null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  return (
    <div>
      {src && props.verification_status === "verified" && (
        <div className="relative size-16">
          <Image
            className={clsx("size-16 rounded-2xl shadow-image", {
              "opacity-0": isLoading,
            })}
            src={src}
            width={64}
            height={64}
            alt="app logo"
            onLoad={() => setIsLoading(false)}
            onError={() => setSrc(null)}
          />
          {isLoading && (
            <Skeleton
              containerClassName="absolute inset-0 leading-none"
              className="size-full rounded-2xl shadow-image"
              inline
            />
          )}
        </div>
      )}

      {!src && (
        <div>
          <Placeholder
            name={props.name}
            seed={props.appId}
            className="size-16 rounded-2xl shadow-image"
          />
        </div>
      )}
    </div>
  );
};
