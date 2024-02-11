import { useState } from "react";
import Image from "next/image";
import { StatusVariant } from "@/components/AppStatus";
import { getCDNImageUrl } from "@/lib/utils";

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

  return (
    <div>
      {src && props.verification_status === "verified" && (
        <Image
          className="w-16 h-16"
          src={src}
          alt="team logo"
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <div className="w-16 h-16 bg-grey-100 flex justify-center items-center rounded-lg">
          <span className="text-grey-400 text-14 uppercase">
            {props.name[0]}
          </span>
        </div>
      )}
    </div>
  );
};
