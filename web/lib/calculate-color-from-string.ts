import twConfig from "@/tailwind.config";
import { RecursiveKeyValuePair, ResolvableTo } from "tailwindcss/types/config";

type AdditionalColors = {
  blue: {
    100: string;
    500: string;
  };

  purple: {
    100: string;
    500: string;
  };

  green: {
    100: string;
    500: string;
  };

  sea: {
    100: string;
    500: string;
  };

  yellow: {
    100: string;
    500: string;
  };

  orange: {
    100: string;
    500: string;
  };

  pink: {
    100: string;
    500: string;
  };
};

export type ColorName = keyof AdditionalColors;
export type Color = Record<number, string>;

export const calculateColorFromString = (str: string | undefined | null) => {
  if (!str) return null;

  const configColors: ResolvableTo<RecursiveKeyValuePair<ColorName, Color>> =
    twConfig.theme?.extend?.colors! as RecursiveKeyValuePair<ColorName, Color>;

  const colors = configColors?.additional as AdditionalColors;
  const colorIndex = str.charCodeAt(0) % Object.keys(colors).length;
  const colorName = Object.keys(colors)[colorIndex] as ColorName;
  return colors[colorName];
};

