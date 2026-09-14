/**
 * @d3-polytree/icons-amazon — an AWS icon pack for the d3-polytree engine, and
 * the reference for the **icon-pack convention**.
 *
 * An icon pack ships a didi module whose `icons` factory spreads the engine's
 * base icons and then its own — so composing the module into any component
 * extends the available node icons without replacing the defaults:
 *
 * ```ts
 * import { awsIconsModule } from '@d3-polytree/icons-amazon';
 * const editor = new Editor({ container, modules: [awsIconsModule] });
 * ```
 *
 * The bundled set is a representative subset generated from `src/svg/` at build
 * time (see `scripts/generate-icons.mjs`); the full AWS catalogue lives in
 * `catalog/` and can be promoted into `src/svg/` and regenerated with no code
 * change.
 */
import { createIcons } from '@d3-polytree/core';
import { awsIcons } from './icons.generated';

export { awsIcons };

/**
 * didi module contributing the AWS icons. Composed after the core modules, its
 * `icons` definition wins and resolves to `{ ...base defaults, ...awsIcons }`.
 */
export const awsIconsModule = {
  icons: ['factory', (): Record<string, string> => ({ ...createIcons(), ...awsIcons })]
};

export default awsIconsModule;
