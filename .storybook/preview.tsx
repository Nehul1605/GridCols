import type { Preview } from '@storybook/react';
import '../src/styles/main.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    a11y: {
      // axe-core configuration
      config: {
        rules: [
          // Ensure color contrast
          { id: 'color-contrast', enabled: true },
          // Check focus management
          { id: 'focus-order-semantics', enabled: true },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: ['light', 'dark'],
        showName: true,
      },
    },
  },
};

export default preview;
