/**
 * Creates a lookup map directly from game data
 *
 * @returns A map of item id to category, and the sorted list of distinct categories
 * @throws {Error} If game.items is not available
 */
export function getItemsAndCategories(): [Map<string, string>, string[]] {
  if (!game?.items) throw Error("Unable to read `game.items`.");

  const items = new Map<string, string>();
  for (const [id, { category }] of game.items.registeredObjects) {
    items.set(id, category);
  }

  if (items.size === 0) throw Error("No items found in `game.items`.");

  const categories = Array.from(new Set(items.values())).sort();

  return [items, categories];
}
