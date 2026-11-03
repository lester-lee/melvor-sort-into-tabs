/**
 * Creates a lookup map directly from game data
 * @returns {{[id: string]: {[category: string]: string}}}
 */
export function getItems() {
  return Object.values(game.items).reduce((acc, items) => {
    if (!items.registeredObjects) return acc;
    const entries = items.registeredObjects.entries();
    for (const [id, { category }] of entries) {
      acc[id] = { category };
    }
    return acc;
  }, {});
}

/**
 * @param {{[id: string]: {[category: string]: string}}} items
 * @returns {Set<string>} set of all categories found in items
 */
export function getCategories(items) {
  return new Set(Object.values(items).map((item) => item.category));
}
