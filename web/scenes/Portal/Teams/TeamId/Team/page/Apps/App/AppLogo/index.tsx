import { StatusVariant } from "@/components/AppStatus";
import { Placeholder } from "@/components/PlaceholderImage";
import { getCDNImageUrl } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

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
          className="size-16"
          src={src}
          width={500}
          height={500}
          alt="team logo"
          onError={() => setSrc(null)}
        />
      )}

      {!src && <Placeholder name={props.name} className="size-16" />}
    </div>
  );
};
