import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MediFlow Design System — from Stitch project 6783856950358988859
        primary: {
          DEFAULT: '#005c55',
          container: '#0f766e',
          fixed: '#9cf2e8',
          'fixed-dim': '#80d5cb',
        },
        secondary: {
          DEFAULT: '#4648d4',
          container: '#6063ee',
        },
        tertiary: {
          DEFAULT: '#7f4025',
          container: '#9c573a',
        },
        surface: {
          DEFAULT: '#f7faf8',
          dim: '#d7dbd9',
          bright: '#f7faf8',
          'container-lowest': '#ffffff',
          'container-low': '#f1f4f3',
          container: '#ebefed',
          'container-high': '#e5e9e7',
          'container-highest': '#e0e3e1',
          variant: '#e0e3e1',
          tint: '#006a63',
        },
        on: {
          primary: '#ffffff',
          secondary: '#ffffff',
          tertiary: '#ffffff',
          surface: '#181c1c',
          'surface-variant': '#3e4947',
          background: '#181c1c',
        },
        outline: {
          DEFAULT: '#6e7977',
          variant: '#bdc9c6',
        },
        mediflow: {
          error: '#ba1a1a',
          'error-container': '#ffdad6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      spacing: {
        sidebar: '240px',
        header: '64px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
        modal: '0 8px 32px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
