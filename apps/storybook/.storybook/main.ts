import type { StorybookConfig } from '@storybook/html-vite';

// The C10 culling/perf harness stories boot 3k-23k generated elements: they exist for the Playwright
// specs (found by title, `harness-only` tag) and must not ship on the public Pages site. Storybook
// 8.6.18 has no `--exclude-tags` build flag, so the deploy build (`build-storybook:deploy`) drops
// those two story files by glob; the normal `build-storybook` — which e2e and VR consume — keeps them.
const deploy = process.env.STORYBOOK_DEPLOY === '1';

const config: StorybookConfig = {
  stories: deploy
    ? ['../src/**/!(CullingHarness|PerfHarness).stories.@(ts|js)']
    : ['../src/**/*.stories.@(ts|js)'],
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
