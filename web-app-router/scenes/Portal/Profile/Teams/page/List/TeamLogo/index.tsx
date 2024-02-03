"use client";

import { useState } from "react";
import Image from "next/image";

export const TeamLogo = (props: {
  src: string | undefined | null;
  name: string;
}) => {
  const [src, setSrc] = useState<typeof props.src>(props.src);

  return (
    <div>
      {src && (
        <Image
          className="w-12 h-12"
          src={src}
          alt="team logo"
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <div className="w-12 h-12 bg-grey-100 flex justify-center items-center rounded-lg">
          <span className="text-grey-400 text-14 uppercase">
            {props.name[0]}
          </span>
        </div>
      )}
    </div>
  );
};
