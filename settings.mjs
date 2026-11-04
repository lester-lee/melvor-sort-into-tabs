/** @param {string} category */
function getCategorySettingName(category) {
  return `category-${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

/** Registers the category-to-tab settings UI. */
export async function registerSettings({ ctx, categories, items, notify, logger }) {
  const { getDefaultTab } = await ctx.loadModule("defaults.mjs");
  const $section = ctx.settings.section("Category Settings");

  function resetToDefaults() {
    try {
      categories.forEach((c) => $section.set(getCategorySettingName(c), getDefaultTab(c)));
      logger.info("All category settings reset to defaults!");
      notify("All sorting rules reset to defaults!", "success");
    } catch (err) {
      logger.error("Error resetting to defaults:", err);
      notify("Error resetting settings. Check console for details.", "error");
    }
  }
  // Make reset function available globally for manual triggering
  window.resetSortTabsToDefaults = resetToDefaults;

  // Add a read-only text field to show the tab warning and detected tabs
  $section.add({
    type: "label",
    name: "info-warning",
    label: "⚠️ Important",
    hint: "If you buy a new bank tab during a session, please CLOSE and RE-OPEN the game to see the new tab count. Tab count is detected when the game loads.",
  });

  $section.add({
    type: "button",
    name: "reset-to-defaults",
    display: "Reset to Defaults",
    color: "warning",
    onClick: resetToDefaults,
  });

  for (const category of categories) {
    const defaultTab = getDefaultTab(category);
    $section.add({
      type: "number",
      name: getCategorySettingName(category),
      label: category,
      default: defaultTab,
      min: 0,
      max: 100,
    });
  }

  /** Returns the 1-based target tab for an item per user settings, or 0 to leave it alone. */
  function getTargetTab(itemId, maxTabs) {
    if (!items.has(itemId)) return 0;

    const category = items.get(itemId);
    const targetTab = $section.get(getCategorySettingName(category));
    return targetTab > 0 && targetTab <= maxTabs ? targetTab : 0;
  }

  return { getTargetTab };
}
