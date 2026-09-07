import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "#faf8f5",
          100: "#f0ebe3",
          200: "#e2d6c5",
          300: "#d0bca0",
          400: "#bf9f7c",
          500: "#b38b63",
          600: "#a67a57",
          700: "#8a6349",
          800: "#715140",
          900: "#5c4336",
          950: "#30221b",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        agriculture: {
          soil: "#8B4513",
          soilLight: "#A0522D",
          soilDark: "#654321",
          wheat: "#F5DEB3",
          wheatDark: "#DEB887",
          corn: "#FFD700",
          cornDark: "#DAA520",
          leaf: "#228B22",
          leafDark: "#006400",
          leafLight: "#90EE90",
          water: "#4682B4",
          waterLight: "#87CEEB",
          waterDark: "#2F4F7F",
          sky: "#87CEEB",
          skyDark: "#4682B4",
          sun: "#FFD700",
          sunDark: "#FFA500",
          rain: "#4169E1",
          harvest: "#D2691E",
          harvestLight: "#CD853F",
          wood: "#DEB887",
          woodDark: "#D2B48C",
          barn: "#CC3333",
          barnDark: "#8B0000",
          field: "#9ACD32",
          fieldDark: "#6B8E23",
          compost: "#3B2F2F",
          greenhouse: "#98FB98",
        },
        chart: {
          yield: "#22c55e",
          revenue: "#3b82f6",
          cost: "#ef4444",
          growth: "#a855f7",
          moisture: "#06b6d4",
          temperature: "#f97316",
        },
        status: {
          active: "#22c55e",
          inactive: "#6b7280",
          pending: "#f59e0b",
          warning: "#f97316",
          error: "#ef4444",
          info: "#3b82f6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
        display: ["Cal Sans", "Inter", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(4px)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-green": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
        },
        "water-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
        growth: {
          "0%": { transform: "scaleY(0)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(1)", transformOrigin: "bottom" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-green": "pulse-green 2s infinite",
        "water-flow": "water-flow 3s linear infinite",
        growth: "growth 0.5s ease-out",
      },
      backgroundImage: {
        "gradient-agriculture":
          "linear-gradient(135deg, #166534 0%, #15803d 25%, #22c55e 50%, #86efac 75%, #dcfce7 100%)",
        "gradient-soil":
          "linear-gradient(135deg, #654321 0%, #8B4513 50%, #A0522D 100%)",
        "gradient-harvest":
          "linear-gradient(135deg, #D2691E 0%, #CD853F 50%, #DEB887 100%)",
        "gradient-water":
          "linear-gradient(135deg, #2F4F7F 0%, #4682B4 50%, #87CEEB 100%)",
        "field-pattern":
          "repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(34,197,94,0.05) 20px, rgba(34,197,94,0.05) 40px)",
      },
      boxShadow: {
        field: "0 4px 6px -1px rgba(34,197,94,0.1), 0 2px 4px -2px rgba(34,197,94,0.1)",
        soil:
          "0 4px 6px -1px rgba(139,69,19,0.1), 0 2px 4px -2px rgba(139,69,19,0.1)",
        harvest:
          "0 4px 6px -1px rgba(210,105,30,0.1), 0 2px 4px -2px rgba(210,105,30,0.1)",
        water:
          "0 4px 6px -1px rgba(70,130,180,0.1), 0 2px 4px -2px rgba(70,130,180,0.1)",
        "inner-glow": "inset 0 1px 2px rgba(34,197,94,0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
