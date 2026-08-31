"use client";

import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import Image from "next/image";
import { useState } from "react";

export const TeamLogo = (props: {
  className?: string;
  src: string | undefined | null;
  name: string;
}) => {
  const [src, setSrc] = useState<typeof props.src>(props.src);
  const color = calculateColorFromString(props.name);

  return (
    <div className={props.className}>
      {src && (
        <Image
          className="size-8 rounded-full object-cover"
          src={src}
          alt="team logo"
          width={32}
          height={32}
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <div
          className="flex size-8 items-center justify-center rounded-full bg-grey-100"
          style={
            color
              ? { backgroundColor: color["100"], color: color["500"] }
              : undefined
          }
        >
          <span className="font-world text-13 font-[350] uppercase">
            {props.name.trim().charAt(0) || "?"}
          </span>
        </div>
      )}
    </div>
  );
};
