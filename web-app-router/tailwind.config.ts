import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const gridTemplates = {
  "1fr/auto": "1fr auto",
  "auto/1fr": "auto 1fr",
  "auto/1fr/auto": "auto 1fr auto",
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./scenes/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },

      borderRadius: {
        12: "0.75rem",
        20: "1.25em",
      },

      boxShadow: {
        button: "0px 1px 2px 0px #191C200F",
        lg: "0px 4px 6px -2px rgba(25, 28, 32, 0.03), 0px 12px 16px -4px rgba(25, 28, 32, 0.08)",
      },

      colors: {
        blue: {
          500: "#4940E0",
        },
        grey: {
          0: "#FFFFFF",
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
            200: "#FFE5E2",
            300: "#FFCBC5",
            400: "#FF897C",
            500: "#ff4732",
            600: "#DB2824",
          },

          success: {
            500: "#00B800",
          },
        },
      },

      gridTemplateColumns: gridTemplates,
      gridTemplateRows: gridTemplates,

      fontFamily: {
        gta: ["GTAmerica", ...defaultTheme.fontFamily.sans],
      },
      fontWeight: {
        500: "500",
        550: "550",
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
    },
  },
  plugins: [],
};

export default config;
