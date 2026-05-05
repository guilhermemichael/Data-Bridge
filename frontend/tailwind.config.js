/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bridge: {
          bg: "#050816",
          panel: "#0b1020",
          surface: "#111827",
          border: "#1e293b",
          primary: "#2563eb",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
