/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        lightGreen: "#bcdcac",
        mediumGreen: "#8ccc84",
        hardGreen: "#37935c",
      },
    },
  },
  plugins: [],
};
