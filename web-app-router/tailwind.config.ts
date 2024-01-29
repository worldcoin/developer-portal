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
          100: "#F0F0FD",
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
            50: "#E9F8E9",
            500: "#00B800",
          },
        },
      },

      gridTemplateColumns: gridTemplates,
      gridTemplateRows: gridTemplates,

      fontFamily: {
        gta: ["GTAmerica", ...defaultTheme.fontFamily.sans],
      },

      width: {
        inputLarge: "34rem",
      },
    },
  },
  plugins: [],
};

export default config;
