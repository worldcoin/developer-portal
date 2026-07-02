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

  lightOrange: {
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

const configColors: ResolvableTo<RecursiveKeyValuePair<ColorName, Color>> =
  twConfig.theme?.extend?.colors! as RecursiveKeyValuePair<ColorName, Color>;

export const colors = configColors?.additional as AdditionalColors;
