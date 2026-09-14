import { describe, it, expect, beforeEach } from 'vitest';
import { Diagram, iconLoaderModule, type IconLoader } from '@d3-polytree/core';
import { awsIcons, awsIconsModule } from './index';

describe('@d3-polytree/icons-amazon', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('bundles a representative subset of AWS icons', () => {
    expect(Object.keys(awsIcons).length).toBeGreaterThanOrEqual(8);
    expect(awsIcons['Storage_AmazonS3']).toContain('<svg');
    expect(awsIcons['Compute_AmazonEC2']).toContain('<svg');
  });

  it('the icons factory extends the engine defaults rather than replacing them', () => {
    const factory = awsIconsModule.icons[1] as () => Record<string, string>;
    const icons = factory();
    expect(icons.default).toBeDefined(); // base default preserved
    expect(icons['AI_AmazonPolly']).toBeDefined(); // AWS icon added
  });

  it('registers its icons in the engine when composed as a module', () => {
    const diagram = new Diagram({
      container: document.body,
      modules: [iconLoaderModule, awsIconsModule]
    });
    const iconLoader = diagram.get<IconLoader>('iconLoader');
    expect(iconLoader.hasIcon('Storage_AmazonS3')).toBe(true);
    expect(iconLoader.hasIcon('Messaging_AmazonSES')).toBe(true);
    expect(iconLoader.hasIcon('default')).toBe(true);
    // an unknown icon still falls back to the default symbol
    expect(iconLoader.symbolHref('nope')).toBe('#default_icon_def');
  });
});
