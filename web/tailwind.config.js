const defaultTheme = require("tailwindcss/defaultTheme");

const mirrorHexColors = (colors) =>
  Object.fromEntries(
    colors.map((color, index) => {
      if (!/#[a-f0-9]{6}/.test(color)) {
        throw new Error(
          'All colors should be lowercase hexadecimal strings 7 characters long with "#" sign at the beginning'
        );
      }

      if (colors.indexOf(color) !== index) {
        throw new Error("Colors should be unique");
      }

      if (colors[index - 1] > color) {
        throw new Error("Colors should be sorted alphabetically");
      }

      return [color.substring(1), color];
    })
  );

module.exports = {
  content: ["./**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    borderWidth: {
      DEFAULT: "1px",
      none: "0",
      2: "2px",
    },

    colors: {
      gray: {
        50: "#F9FAFB",
        100: "#F3F4F5",
        200: "#EBECEF",
        400: "#9BA3AE",
        500: "#657080",
        700: "#3C424B",
        900: "#191C20",
      },

      blue: {
        primary: "#4940E0",
        secondary: "#EDECFC",
        500: "#4940E0",
      },

      neutral: {
        DEFAULT: "#858494", // FIXME: This color may be #191c20
        primary: "#191c20", // gray-900
        secondary: "#9ba3ae", // gray-400

        dark: "#191c20", // gray-900
        medium: "#626467",

        muted: "#f0edf9",
      },
      //ANCHOR: accent colors are used for displaying different statuses
      //TODO: cleanup unused colors
      accents: {
        success: {
          DEFAULT: "#00c313",
          700: "#00c313",
          300: "#d6f6d9",
        },

        info: {
          700: "#506dff",
        },
      },
      primary: {
        DEFAULT: "#4940e0", // blue-primary
        light: "#edecfc", // blue-secondary
      },
      success: {
        DEFAULT: "#00B800",
        light: "#e5f9e7",
      },
      danger: {
        DEFAULT: "#ff5a76",
        light: "#fff0ed",
      },
      warning: {
        DEFAULT: "#ffc700",
        light: "#FFF9E5",
      },
      white: "#ffffff",
      black: "#010101",
      ...mirrorHexColors([
        "#000000",
        "#010101",
        "#191c20", //gray-900
        "#28303f",
        "#3c4040",
        "#487b8f",
        "#626467",
        "#657080", // gray-500
        "#777e90",
        "#a39dff",
        "#afafaf",
        "#d1d3d4",
        "#d6d9dd",
        "#dbe3e8",
        "#ebecef", // gray-200
        "#edbd14",
        "#edecfc", //FIXME: duplicate for primary-light
        "#f0edf9",
        "#f1f5f8",
        "#f2f2f7",
        "#f2f4f7",
        "#f3f4f5", // gray-100
        "#f4f4f4",
        "#f9f9f9",
        "#f9fafb", // gray-50
        "#fafafa",
        "#fbfbfb",
        "#fbfbfc",
        "#fcfbfe",
        "#ff6848",
        "#ffb11b",
        "#fff0ed",
        "#fff9e5",
        "#ffffff",
      ]),
      current: "currentColor",
      transparent: "transparent",
    },

    extend: {
      borderRadius: {
        10: "10px",
      },
      boxShadow: {
        box: "0px 2px 8px rgba(0, 0, 0, 0.04), 0px 10px 32px rgba(37, 57, 129, 0.04)",
        input: "0px 10px 30px rgba(25, 28, 32, 0.1)",
        button: "0px 10px 20px rgba(25, 28, 32, 0.2)",
        icon: "0px 10px 30px rgba(73, 64, 224, 0.5)",
        card: "0px 10px 30px rgba(25, 28, 32, 0.1)",
        lg: "0px 12px 16px -4px rgba(25, 28, 32, 0.08), 0px 4px 6px -2px rgba(25, 28, 32, 0.03)",
        "card-new": "0px 16px 32px -12px rgba(25, 28, 32, 0.10)",
      },

      fontFamily: {
        sans: ["var(--font-rubik)", ...defaultTheme.fontFamily.sans],
        rubik: ["var(--font-rubik)", ...defaultTheme.fontFamily.sans],
        sora: ["var(--font-sora)", ...defaultTheme.fontFamily.sans],
        ibm: ["var(--font-mono)", "monospace"],
      },

      fontSize: {
        0: "0",
        6: "calc(6 * 1rem / 16)",
        11: "calc(11 * 1rem / 16)",
        12: "calc(12 * 1rem / 16)",
        13: "calc(13 * 1rem / 16)",
        14: "calc(14 * 1rem / 16)",
        16: "calc(16 * 1rem / 16)",
        18: "calc(16 * 1rem / 16)",
        20: "calc(20 * 1rem / 16)",
        24: "calc(24 * 1rem / 16)",
        26: "calc(26 * 1rem / 16)",
        30: "calc(30 * 1rem / 16)",
        32: "calc(32 * 1rem / 16)",
      },

      lineHeight: {
        "1px": "1px",
      },
      gridTemplateColumns: {
        "1fr/auto": "1fr auto",
        "auto/1fr": "auto 1fr",
        "auto/1fr/auto": "auto 1fr auto",
      },

      gridTemplateRows: {
        "auto/1fr/auto": "auto 1fr auto",
      },

      spacing: {
        4.5: "calc(4.5 * 1rem / 4)",
      },

      transitionProperty: {
        "visibility/opacity": "visibility, opacity",
      },

      zIndex: {
        dropdown: "50",
        header: "100",
        modal: "1000",
      },
    },
  },
  plugins: [],
};
