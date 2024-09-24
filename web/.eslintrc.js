const path = require("path");

module.exports = {
  plugins: ["tailwindcss"],
  extends: ["next", "plugin:tailwindcss/recommended"],
  settings: {
    tailwindcss: {
      config: path.join(__dirname, "./tailwind.config.ts"),
    },
  },
};
