import type { Config } from "tailwindcss";

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
        20: "1.25em",
      },

      boxShadow: {
        button: "0px 1px 2px 0px #191C200F",
      },

      colors: {
        grey: {
          0: "#FFFFFF",
          50: "#F9FAFB",
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
            500: "#00B800",
          },
        },
      },

      fontFamily: {
        // They are using GT America Mono, but it's not free
      },
    },
  },

  plugins: [],
};

export default config;
