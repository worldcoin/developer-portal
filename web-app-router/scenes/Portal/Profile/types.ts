import twConfig from "@/tailwind.config";

export type Color = {
  100: string;
  500: string;
};

export type ColorName =
  | "blue"
  | "purple"
  | "green"
  | "sea"
  | "yellow"
  | "orange"
  | "pink";

export const colors: Record<ColorName, Color> = {
  blue: {
    100: "#E4F2FE",
    500: "#4292F4",
  },
  purple: {
    100: "#F7F1FF",
    500: "#9D50FF",
  },
  green: {
    100: "#EBFAEC",
    500: "#00C313",
  },
  sea: {
    100: "#EBFAF9",
    500: "#00C3B6",
  },
  yellow: {
    100: "#FFFBEB",
    500: "#FFC700",
  },
  orange: {
    100: "#FFF3F0",
    500: "#FF6848",
  },
  pink: {
    100: "#FFF1F7",
    500: "#FF5096",
  },
};
