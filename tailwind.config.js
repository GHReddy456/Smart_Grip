/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        card: "#FFFFFF",
        primary: "#2563EB",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        text: "#111827",
        secondaryText: "#6B7280",
        darkBackground: "#0F172A",
        darkCard: "#1E293B",
        darkPrimary: "#60A5FA",
        darkText: "#F8FAFC",
        darkSecondaryText: "#94A3B8"
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem"
      },
      fontFamily: {
        display: ["Manrope"],
        body: ["Atkinson Hyperlegible Next"]
      }
    }
  }
};