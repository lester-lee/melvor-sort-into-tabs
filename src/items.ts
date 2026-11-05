export type ItemCategoryMap = Map<string, string>;
export type CategoryIconMap = Map<string, string>;

/**
 * Creates a lookup map directly from game data
 *
 * @returns A tuple containing {item->category} and {category->icon}
 * @throws {Error} If game.items is not available
 */
export function getItemsAndCategories(): [ItemCategoryMap, CategoryIconMap] {
  if (!game?.items) throw Error("Unable to read `game.items`.");

  const categories: CategoryIconMap = new Map<string, string>();

  const items: ItemCategoryMap = new Map<string, string>();
  for (const [id, { category: _category, media }] of game.items.registeredObjects) {
    // category is either "", "namespace:category", or "category"
    const category = _category.split(":").pop() ?? "Misc";
    items.set(id, category);
    if (!categories.has(category)) categories.set(category, media);
  }

  // Replace skill categories with their media icons, if available
  for (const [_, skill] of game.skills.registeredObjects) {
    if (categories.has(skill.name)) categories.set(skill.name, skill.media);
  }

  if (items.size === 0) throw Error("No items found in `game.items`.");

  const sortedCategories = new Map([...categories.entries()].sort());
  return [items, sortedCategories];
}
