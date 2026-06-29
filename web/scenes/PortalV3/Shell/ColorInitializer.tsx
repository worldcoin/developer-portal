"use client";

import { colorAtom } from "@/scenes/Portal/layout/color-atom";
import { Color } from "@/scenes/Portal/Profile/types";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

export const ColorInitializer = (props: { color: Color | null }) => {
  const setColor = useSetAtom(colorAtom);
  useEffect(() => {
    setColor(props.color);
  }, [props.color, setColor]);
  return null;
};
