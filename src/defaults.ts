// Default tab assignments - grouped thematically by related skills
const DEFAULT_TAB_ASSIGNMENTS: Record<string, number> = {
  // Tab 1: Miscellaneous (default tab where new items go)
  Misc: 1,
  Miscellaneous: 1,
  Item: 1,
  Equipment: 1,
  Crystal: 1,
  Cool: 1,
  Lemon: 1,
  Limes: 1,

  // Tab 2: Combat & Slayer
  Combat: 2,
  Dungeons: 2,
  Slayer: 2,
  AbyssalSlayer: 2,

  // Tab 3: Mining & Smithing
  Mining: 3,
  Smithing: 3,
  Gemstone: 3,

  // Tab 4: Woodcutting, Firemaking & Fletching
  Woodcutting: 4,
  Firemaking: 4,
  Fletching: 4,

  // Tab 5: Fishing & Cooking
  Fishing: 5,
  Cooking: 5,

  // Tab 6: Farming & Herblore
  Farming: 6,
  Herblore: 6,
  Harvesting: 6,

  // Tab 7: Magic (Runecrafting, Astrology, Summoning, Prayer)
  Runecrafting: 7,
  Astrology: 7,
  Summoning: 7,
  Prayer: 7,

  // Tab 8: Crafting & Thieving
  Crafting: 8,
  Thieving: 8,
  Enhancement: 8,

  // Tab 9: Archaeology & Cartography
  Archaeology: 9,
  Cartography: 9,

  // Tab 10: Township & Agility
  Township: 10,
  Agility: 10,

  // Tab 11: Mastery & Skills tokens
  Mastery: 11,
  Skills: 11,
  Skilling: 11,

  // Tab 12: Openable & Events
  Openable: 12,
  Events: 12,
  "Golbin Raid": 12,
  Party: 12,
  Patreon: 12,
};

export function getDefaultTab(category: string): number {
  return DEFAULT_TAB_ASSIGNMENTS[category] ?? 0;
}
