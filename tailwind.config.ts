import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F172A',
          accent: '#B45309',
        },
        status: {
          pending: { bg: '#FEF3C7', fg: '#92400E' },
          confirmed: { bg: '#DBEAFE', fg: '#1E40AF' },
          completed: { bg: '#DCFCE7', fg: '#166534' },
          noShow: { bg: '#FEE2E2', fg: '#991B1B' },
          cancelled: { bg: '#F3F4F6', fg: '#374151' },
          inChair: { bg: '#E0E7FF', fg: '#3730A3' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '10px',
      },
    },
  },
  plugins: [],
};

export default config;
