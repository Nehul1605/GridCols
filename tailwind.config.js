/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Design tokens - spacing scale
      spacing: {
        'grid-row': '35px',
        'grid-header': '40px',
        'grid-cell-px': '12px',
      },
      // Design tokens - colors
      colors: {
        grid: {
          border: 'var(--grid-border-color, #e5e7eb)',
          'row-even': 'var(--grid-row-even, #ffffff)',
          'row-odd': 'var(--grid-row-odd, #f9fafb)',
          'row-hover': 'var(--grid-row-hover, #eff6ff)',
          'row-selected': 'var(--grid-row-selected, #dbeafe)',
          'header-bg': 'var(--grid-header-bg, #f3f4f6)',
          'cell-focus': 'var(--grid-cell-focus, #3b82f6)',
        },
      },
      // Animation for smooth transitions
      transitionProperty: {
        grid: 'background-color, border-color, box-shadow',
      },
      // Z-index scale
      zIndex: {
        'grid-header': '10',
        'grid-editor': '20',
        'grid-overlay': '30',
      },
    },
  },
  plugins: [],
};
