/**
 * Creates a lookup map directly from game data
 *
 * @returns {{ [id: string]: { [category: string]: string } }}
 * @throws {Error} If game.items is not available
 */
export function getItemsAndCategories() {
  if (!game?.items) throw Error("Unable to read `game.items`.");

  const items = new Map();
  Object.values(game.items).forEach((data) => {
    if (!data.registeredObjects) return;
    const entries = data.registeredObjects.entries();
    for (const [id, { category }] of entries) {
      items.set(id, category);
    }
  });

  if (items.size === 0) throw Error("No items found in `game.items`.");

  const categories = Array.from(new Set(items.values())).sort();

  return [items, categories];
}
