/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#10B981",
        primaryDark: "#059669",
        primaryLight: "#D1FAE5",
        secondary: "#3B82F6",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        textMain: "#0F172A",
        textSecondary: "#475569",
        textMuted: "#94A3B8",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
};
