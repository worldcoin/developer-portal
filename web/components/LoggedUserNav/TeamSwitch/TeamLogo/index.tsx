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
          className="size-5"
          src={src}
          alt="team logo"
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <div className="flex size-5 items-center justify-center rounded bg-grey-100">
          <span className="text-14 uppercase text-grey-400">
            {props.name[0]}
          </span>
        </div>
      )}
    </div>
  );
};
