/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        lightGreen: "#d5ebe3",
        mediumGreen: "#8cd8be",
        hardGreen: "#25d595",
      },
    },
  },
  plugins: [],
};
