/** The fallback icon rendered for nodes with no matching icon type. */
export const DEFAULT_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect rx="8" ry="8" width="100" height="100" fill="#888"/></svg>';

/** Icon registry: a map of icon type → SVG source string. */
export type IconMap = Record<string, string>;

/** Create the default icon registry. Icon packs extend/override this map. */
export function createIcons(): IconMap {
  return { default: DEFAULT_ICON };
}
createIcons.$inject = [] as string[];
