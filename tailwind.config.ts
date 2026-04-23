import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        strobl: {
          50: "#f3f8ff",
          100: "#dfeeff",
          200: "#bddcff",
          300: "#88c4ff",
          400: "#4ca5ff",
          500: "#1688f0",
          600: "#056ecf",
          700: "#0858a3",
          800: "#0e4b86",
          900: "#123f6f"
        },
        ink: {
          50: "#f6f8fb",
          100: "#e9eef6",
          200: "#d5ddeb",
          300: "#aab7cc",
          400: "#70809a",
          500: "#495977",
          600: "#33425b",
          700: "#213049",
          800: "#172136",
          900: "#0b1220"
        },
        sand: {
          50: "#fffdfa",
          100: "#f9f4eb",
          200: "#f2e7d5"
        }
      },
      boxShadow: {
        soft: "0 20px 45px -28px rgba(8, 88, 163, 0.25)",
        lift: "0 24px 50px -20px rgba(15, 30, 64, 0.18)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      keyframes: {
        "fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(18px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        shimmer: {
          "0%": {
            backgroundPosition: "-500px 0"
          },
          "100%": {
            backgroundPosition: "500px 0"
          }
        }
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 1.8s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
