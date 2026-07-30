"use client";

import Image from "next/image";
import { useState } from "react";

export const TeamLogo = (props: {
  className?: string;
  src: string | undefined | null;
  name: string;
}) => {
  const [src, setSrc] = useState<typeof props.src>(props.src);

  return (
    <div className={props.className}>
      {src && (
        <Image
          className="size-7 rounded-full object-cover"
          src={src}
          alt="team logo"
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <div className="flex size-7 items-center justify-center rounded-full bg-grey-100">
          <span className="font-world text-12 font-medium text-grey-500 uppercase">
            {props.name[0]}
          </span>
        </div>
      )}
    </div>
  );
};
