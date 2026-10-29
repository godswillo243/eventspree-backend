// packages/transactional/emails/config/tailwind-config.ts

export const emailTailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          300: "#a5b4fc",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        neutral: {
          0: "#ffffff",
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          400: "#9ca3af",
          600: "#4b5563",
          800: "#1f2937",
          900: "#111827",
        },
        success: { 50: "#ecfdf5", 500: "#10b981", 700: "#047857" },
        warning: { 50: "#fffbeb", 500: "#f59e0b", 700: "#b45309" },
        danger: { 50: "#fef2f2", 500: "#ef4444", 700: "#b91c1c" },
      },
      fontFamily: {
        sans: [
          "Figtree",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
};
