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
  theme: {
    borderWidth: {
      DEFAULT: "1px",
      none: "0",
    },

    colors: {
      neutral: {
        DEFAULT: "#858494",
        dark: "#191c20",
        muted: "#f0edf9",
      },
      primary: {
        DEFAULT: "#4940e0",
      },
      success: {
        DEFAULT: "#00c313",
      },
      warning: {
        DEFAULT: "#ff5a76", // FIXME: This color is actually danger
      },
      ...mirrorHexColors([
        "#000000",
        "#191c20",
        "#3c4040",
        "#626467",
        "#777e90",
        "#a39dff",
        "#d1d3d4",
        "#dbe3e8",
        "#edbd14",
        "#edecfc",
        "#f0edf9",
        "#f1f5f8",
        "#f2f2f7",
        "#f9f9f9",
        "#fafafa",
        "#fbfbfb",
        "#fcfbfe",
        "#ff6848",
        "#ffc700", // FIXME: this color is actually warning
        "#fff0ed",
        "#ffffff",
      ]),
      current: "currentColor",
      transparent: "transparent",
    },

    extend: {
      boxShadow: {
        box: "0px 2px 8px rgba(0, 0, 0, 0.04), 0px 10px 32px rgba(37, 57, 129, 0.04);",
      },

      fontFamily: {
        sora: ["Sora", "sans-serif"],
        rubik: ["Rubik", "sans-serif"],
        ibm: ["IBM Plex Mono", "monospace"],
      },

      fontSize: {
        0: "0",
        6: "calc(6 * 1rem / 16)",
        11: "calc(11 * 1rem / 16)",
        12: "calc(12 * 1rem / 16)",
        13: "calc(13 * 1rem / 16)",
        14: "calc(14 * 1rem / 16)",
        16: "calc(16 * 1rem / 16)",
        20: "calc(20 * 1rem / 16)",
        26: "calc(26 * 1rem / 16)",
        30: "calc(30 * 1rem / 16)",
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
      },
    },
  },
  plugins: [],
};
