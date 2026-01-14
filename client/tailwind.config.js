/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#ffffff',
          secondary: '#f9fafb',
          tertiary: '#f3f4f6',
        },
        accent: {
          light: '#e0e7ff',
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          muted: '#9ca3af',
        },
        border: {
          light: '#f3f4f6',
          DEFAULT: '#e5e7eb',
          dark: '#d1d5db',
        },
        status: {
          online: '#10b981',
          offline: '#9ca3af',
          error: '#ef4444',
          warning: '#f59e0b',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.03)',
        md: '0 4px 6px rgba(0, 0, 0, 0.04)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
