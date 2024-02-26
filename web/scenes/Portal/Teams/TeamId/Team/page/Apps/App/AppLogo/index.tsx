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

  const handleLoad = (e: any) => {
    setIsLoading(false);
  };

  return (
    <div>
      {src && props.verification_status === "verified" && (
        <div className={clsx("relative size-16 ")}>
          <Image
            className={clsx("size-16 rounded-2xl shadow-image", {
              "absolute opacity-0": isLoading,
            })}
            src={src}
            width={500}
            height={500}
            alt="team logo"
            onLoad={handleLoad}
            onError={() => setSrc(null)}
          />
          <Skeleton
            className={clsx("absolute size-16 rounded-2xl shadow-image", {
              hidden: !isLoading,
            })}
          />
        </div>
      )}

      {!src && (
        <div>
          <Placeholder
            name={props.name}
            className="size-16 rounded-2xl shadow-image"
          />
        </div>
      )}
    </div>
  );
};
