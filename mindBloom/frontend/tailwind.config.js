/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neonPink: "#ff2e88",
        neonCyan: "#22f2ff",
        neonPurple: "#a855ff",
      },
      boxShadow: {
        neon: "0 0 25px rgba(34,242,255,0.6)",
      },
    },
  },
  plugins: [],
};
