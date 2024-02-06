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

      borderWidth: {
        1: "1px",
      },

      borderRadius: {
        8: "0.5rem",
        12: "0.75rem",
        20: "1.25em",
      },

      boxShadow: {
        button: "0px 1px 2px 0px #191C200F",
        lg: "0px 4px 6px -2px rgba(25, 28, 32, 0.03), 0px 12px 16px -4px rgba(25, 28, 32, 0.08)",
        qrCode: "0px 16px 20px -8px #E6E9EEA3",
        image: "0px 3px 2px 0px #00000010",
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
          },

          success: {
            50: "#E9F8E9",
            100: "#F5FDF6",
            300: "#66CC66",
            500: "#00B800",
            700: "#00C313",
          },

          warning: {
            50: "#FFFAE5",
            100: "#FFF9EF",
            200: "#FFE999",
            300: "#FFE999",
            500: "#FFB200",
            700: "#FFB11B",
          },
        },
      },

      gridTemplateColumns: gridTemplates,
      gridTemplateRows: gridTemplates,

      fontFamily: {
        gta: ["GTAmerica", ...defaultTheme.fontFamily.sans],
        rubik: ["var(--font-rubik)", ...defaultTheme.fontFamily.sans],
      },

      fontSize: {
        0: "0",
        6: "calc(6 * 1rem / 16)",
        11: "calc(11 * 1rem / 16)",
        12: "calc(12 * 1rem / 16)",
        13: "calc(13 * 1rem / 16)",
        14: "calc(14 * 1rem / 16)",
        16: "calc(16 * 1rem / 16)",
        18: "calc(18 * 1rem / 16)",
        20: "calc(20 * 1rem / 16)",
        24: "calc(24 * 1rem / 16)",
        26: "calc(26 * 1rem / 16)",
        30: "calc(30 * 1rem / 16)",
        32: "calc(32 * 1rem / 16)",
      },

      spacing: {
        136: "34rem",
      },
    },
  },
  plugins: [],
};

export default config;
