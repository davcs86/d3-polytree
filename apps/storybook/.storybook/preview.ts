import type { Preview } from '@storybook/html';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } }
  },
  // C13 theming toggle. `auto` follows the OS `prefers-color-scheme` and is a
  // strict no-op (no attribute, no wrapper, no backgrounds backdrop) so the
  // existing light VR baselines are unaffected; `light`/`dark` stamp
  // `data-pfd-theme` on <html> (the token selectors are `:root[data-pfd-theme]`).
  globalTypes: {
    theme: {
      description: 'PFDN colour theme',
      defaultValue: 'auto',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'auto', title: 'Auto (OS)' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme as string;
      const root = document.documentElement;
      if (theme === 'light' || theme === 'dark') {
        root.setAttribute('data-pfd-theme', theme);
      } else {
        root.removeAttribute('data-pfd-theme');
      }
      return story();
    }
  ]
};

export default preview;
