import { getDefaultTab } from "./defaults";
import type { Logger } from "./log";
import type { Notify } from "./notify";

/**
 * The official typings mark every optional field as required; the game fills
 * the rest in.
 */
const config = <T extends Modding.Settings.SettingConfig>(c: Partial<T>) =>
  c as T;

function getCategorySettingName(category: string): string {
  return `category-${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

/** Registers the category-to-tab settings UI. */
export function registerSettings({
  ctx,
  categories,
  items,
  notify,
  logger,
}: {
  ctx: Modding.ModContext;
  categories: string[];
  items: Map<string, string>;
  notify: Notify;
  logger: Logger;
}) {
  const $section = ctx.settings.section("Category Settings");

  function resetToDefaults() {
    try {
      categories.forEach((c) =>
        $section.set(getCategorySettingName(c), getDefaultTab(c)),
      );
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
  $section.add(
    config<Modding.Settings.SettingConfig>({
      type: "label",
      name: "info-warning",
      label: "⚠️ Important",
      hint: "If you buy a new bank tab during a session, please CLOSE and RE-OPEN the game to see the new tab count. Tab count is detected when the game loads.",
    }),
  );

  $section.add(
    config<Modding.Settings.ButtonConfig>({
      type: "button",
      name: "reset-to-defaults",
      display: "Reset to Defaults",
      color: "warning",
      onClick: resetToDefaults,
    }),
  );

  for (const category of categories) {
    $section.add(
      config<Modding.Settings.NumberConfig>({
        type: "number",
        name: getCategorySettingName(category),
        label: category,
        default: getDefaultTab(category),
        min: 0,
        max: 100,
      }),
    );
  }

  /**
   * Returns the 1-based target tab for an item per user settings, or 0 to leave
   * it alone.
   */
  function getTargetTab(itemId: string, maxTabs: number): number {
    const category = items.get(itemId);
    if (category === undefined) return 0;

    const targetTab = $section.get(getCategorySettingName(category)) as number;
    return targetTab > 0 && targetTab <= maxTabs ? targetTab : 0;
  }

  return { getTargetTab };
}
