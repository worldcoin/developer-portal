import { additionalColors, type ColorName } from "@/lib/additional-colors";

export const calculateColorFromString = (str: string | undefined | null) => {
  if (!str) return null;

  const colorNames = Object.keys(additionalColors) as ColorName[];
  const colorIndex = str.charCodeAt(0) % colorNames.length;

  return additionalColors[colorNames[colorIndex]];
};
