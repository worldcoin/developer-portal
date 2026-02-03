import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const gridTemplates = {
  "1fr/auto": "1fr auto",
  "auto/1fr": "auto 1fr",
  "auto/1fr/auto": "auto 1fr auto",
};

const config: Config = {
  content: ["./components/**/*.{ts,tsx}", "./scenes/**/*.{ts,tsx}"],

  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },

      borderRadius: {
        8: "0.5rem",
        12: "0.75rem",
        16: "1rem",
        20: "1.25em",
        32: "2em",
      },

      boxShadow: {
        button: "0px 1px 2px 0px #191C200F",
        lg: "0px 4px 6px -2px rgba(25, 28, 32, 0.03), 0px 12px 16px -4px rgba(25, 28, 32, 0.08)",
        qrCode: "0px 16px 20px -8px #E6E9EEA3",
        image: "0px 10px 15px 0px #00000010",
        tab: "0px 1px 2px 0px #191C200F, 0px 1px 3px 0px #191C201A",
      },

      colors: {
        blue: {
          50: "#F9F9FE",
          100: "#F0F0FD",
          150: "#DCD9FD",
          500: "#4940E0",
        },

        grey: {
          0: "#FFFFFF",
          25: "#FBFBFC",
          50: "#F9FAFB",
          70: "#F5F5F7",
          100: "#F3F4F5",
          200: "#EBECEF",
          300: "#D6D9DD",
          400: "#9BA3AE",
          500: "#657080",
          700: "#3C424B",
          900: "#191C20",
        },

        additional: {
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
        },

        system: {
          error: {
            50: "#FFF5F3",
            100: "#FFF2F0",
            200: "#FFE5E2",
            300: "#FFCBC5",
            400: "#FF897C",
            500: "#FF4732",
            600: "#DB2824",
            700: "#FF5A76",
            800: "#930F22",
            900: "#7A0922",
          },

          success: {
            50: "#E9F8E9",
            100: "#F5FDF6",
            300: "#66CC66",
            400: "#29CC29",
            500: "#00B800",
            600: "#008000",
            700: "#00C313",
            800: "#004D00",
            900: "#003700",
          },

          warning: {
            50: "#FFFAE5",
            100: "#FFF9EF",
            200: "#FFE999",
            300: "#FFDA66",
            500: "#FFB200",
            600: "#DB9200",
            700: "#FFB11B",
            800: "#935900",
          },
        },
      },

      gridTemplateColumns: gridTemplates,
      gridTemplateRows: gridTemplates,

      fontFamily: {
        gta: ["GT America", ...defaultTheme.fontFamily.sans],
        rubik: ["var(--font-rubik)", ...defaultTheme.fontFamily.sans],
        twk: ["TWK Lausanne", ...defaultTheme.fontFamily.sans],
        ibm: ["var(--font-mono)", "monospace"],
      },

      fontSize: {
        0: "0",
        6: "calc(6 * 1rem / 16)",
        11: "calc(11 * 1rem / 16)",
        12: "calc(12 * 1rem / 16)",
        13: "calc(13 * 1rem / 16)",
        14: "calc(14 * 1rem / 16)",
        15: "calc(15 * 1rem / 16)",
        16: "calc(16 * 1rem / 16)",
        18: "calc(18 * 1rem / 16)",
        20: "calc(20 * 1rem / 16)",
        24: "calc(24 * 1rem / 16)",
        26: "calc(26 * 1rem / 16)",
        30: "calc(30 * 1rem / 16)",
        32: "calc(32 * 1rem / 16)",
      },

      spacing: {
        5.5: "1.375rem",
        15: "3.75rem",
        22: "5.5rem", // 88px
        30: "7.5rem",
        136: "34rem",
      },

      keyframes: {
        DropdownOverlayEnter: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "DropdownContentEnter@desktop": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "DropdownContentEnter@device": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      animation: {
        DropdownOverlayEnter: "DropdownOverlayEnter 0.3s ease",
        "DropdownContentEnter@desktop":
          "DropdownContentEnter@desktop 0.3s ease",
        "DropdownContentEnter@device": "DropdownContentEnter@device 0.3s ease",
      },
    },
  },
  plugins: [],
};

export default config;
