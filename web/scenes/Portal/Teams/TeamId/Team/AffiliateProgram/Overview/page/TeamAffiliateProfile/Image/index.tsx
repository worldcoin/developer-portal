"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { colorAtom } from "@/scenes/Portal/layout";
import clsx from "clsx";
import { useAtom } from "jotai";
import NextImage from "next/image";
import { CSSProperties, useState } from "react";
import { twMerge } from "tailwind-merge";

export const Image = (props: {
  className?: string;
  src: string | undefined | null;
  teamName: string;
  alt: string;
}) => {
  const [src, setSrc] = useState<typeof props.src>(props.src);
  const [color] = useAtom(colorAtom);

  return (
    <div
      style={
        {
          "--color-500": color?.[500],
          "--color-100": color?.[100],
        } as CSSProperties
      }
      className={twMerge(
        clsx(
          "flex size-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-100)] text-[var(--color-500)]",
          props.className,
        ),
      )}
    >
      {src && (
        <NextImage
          src={src}
          alt={props.alt}
          width={80}
          height={80}
          onError={() => setSrc(null)}
        />
      )}

      {!src && (
        <Typography variant={TYPOGRAPHY.H7} className="uppercase">
          {props.teamName?.[0]}
        </Typography>
      )}
    </div>
  );
};
