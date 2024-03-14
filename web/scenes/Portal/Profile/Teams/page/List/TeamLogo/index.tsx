"use client";

import Image from "next/image";
import { useState } from "react";

export const TeamLogo = (props: {
  src: string | undefined | null;
  name: string;
}) => {
  const [src, setSrc] = useState<typeof props.src>(props.src);

  return (
    <div>
      {src && (
        <Image
          className="size-12"
          src={src}
          alt="team logo"
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <div className="flex size-12 items-center justify-center rounded-lg bg-grey-100">
          <span className="text-14 uppercase text-grey-400">
            {props.name[0]}
          </span>
        </div>
      )}
    </div>
  );
};

