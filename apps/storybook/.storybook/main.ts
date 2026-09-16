import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|js)'],
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  // Relative base so the static build works under the GitHub Pages project
  // subpath (https://davcs86.github.io/d3-polytree/) as well as at the root.
  async viteFinal(viteConfig) {
    return { ...viteConfig, base: './' };
  }
};

export default config;
