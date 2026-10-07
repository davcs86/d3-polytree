import type { Meta, StoryObj } from '@storybook/html';
import { mountFixtureHarness, type HarnessArgs } from './perf/harness';

/**
 * C10 culling harness (small generated fixture). Fixture-only: tagged `harness-only` so the VR
 * and a11y sweeps skip it (`loadStories()`), and a dedicated spec finds it by title (SB-03). Arms are
 * selected per load with `&args=culling:!false;viewer:editor`.
 */
const meta: Meta<HarnessArgs> = {
  title: 'Tests/Culling Harness',
  tags: ['!autodocs', 'harness-only'],
  argTypes: {
    culling: { control: 'boolean' },
    viewer: { control: 'select', options: ['interactive', 'editor'] }
  },
  args: { culling: true, viewer: 'interactive' }
};
export default meta;

export const Harness: StoryObj<HarnessArgs> = {
  render: (args) => mountFixtureHarness('culling', args)
};
