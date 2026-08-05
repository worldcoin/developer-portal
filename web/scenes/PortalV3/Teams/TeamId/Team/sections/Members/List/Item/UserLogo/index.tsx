"use client";

import Image from "next/image";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const UserLogo = (props: {
  src: string | undefined | null;
  name: string;
  className?: string;
}) => {
  const [src, setSrc] = useState<typeof props.src>(props.src);

  return (
    <div>
      {src && (
        <Image
          className={twMerge("size-12 rounded-full", props.className)}
          src={src}
          alt="team logo"
          width={48}
          height={48}
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <div
          className={twMerge(
            "flex size-12 items-center justify-center rounded-full bg-grey-100",
            props.className,
          )}
        >
          <span className="font-gta text-12 text-grey-400 uppercase">
            {props.name[0]}
          </span>
        </div>
      )}
    </div>
  );
};
