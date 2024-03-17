"use client";

import Image from "next/image";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const TeamLogo = (props: {
  className?: string;
  src: string | undefined | null;
  name: string;
}) => {
  const [src, setSrc] = useState<typeof props.src>(props.src);

  return (
    <div>
      {src && (
        <Image
          className={twMerge("size-5", props.className)}
          src={src}
          alt="team logo"
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <div
          className={twMerge(
            "flex size-5 items-center justify-center rounded bg-grey-100 text-sm",
            props.className,
          )}
        >
          <span className="uppercase text-grey-400">{props.name[0]}</span>
        </div>
      )}
    </div>
  );
};
