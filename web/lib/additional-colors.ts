export type Color = Readonly<Record<number, string>>;

export const additionalColors = {
  blue: {
    100: "#E4F2FE",
    500: "#4292F4",
    600: "#005CFF",
  },
  azure: {
    100: "#E8F2FF",
    500: "#4572FE",
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
  lightOrange: {
    100: "#FFF7F0",
    500: "#FFA048",
  },
  pink: {
    100: "#FFF1F7",
    500: "#FF5096",
  },
} as const satisfies Record<string, Color>;

export type ColorName = keyof typeof additionalColors;
