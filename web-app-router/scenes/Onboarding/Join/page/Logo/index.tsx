"use client";

import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

export const Logo = (props: {
  className?: string;
  src: string | undefined | null;
}) => {
  const [image, setImage] = useState<string | null | undefined>(props.src);

  return (
    <div
      className={twMerge(
        clsx("w-20 h-20 rounded-2xl overflow-hidden", props.className),
      )}
    >
      {image && (
        // FIXME: update src
        <Image
          src={image}
          alt="Team logo"
          onError={() => setImage(null)}
          className="w-full h-full object-contain"
          width={80}
          height={80}
        />
      )}

      {!image && <WorldcoinBlueprintIcon className="w-full h-full" />}
    </div>
  );
};
