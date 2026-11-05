import { getDefaultTab } from "./defaults";
import type { CategoryIconMap, ItemCategoryMap } from "./items";
import * as logger from "./log";
import notify from "./notify";

/** The official typings mark every optional field as required; the game fills the rest in. */
const config = <T extends Modding.Settings.SettingConfig>(c: Partial<T>) => c as T;

function getCategorySettingName(category: string): string {
  return `category-${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

const CELL_CLASS = "sortIntoTab-category";

/** Registers the category-to-tab settings UI. */
export function registerSettings({
  ctx,
  categories,
  items,
}: {
  ctx: Modding.ModContext;
  categories: CategoryIconMap;
  items: ItemCategoryMap;
}) {
  const $section = ctx.settings.section("Category Settings");

  function resetToDefaults() {
    try {
      for (const c of categories.keys())
        $categories.set(getCategorySettingName(c), getDefaultTab(c));
      logger.info("All category settings reset to defaults!");
      notify("success", "All sorting rules reset to defaults!");
    } catch (err) {
      logger.error("Error resetting to defaults:", err);
      notify("error", "Error resetting settings. Check console for details.");
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

  const $categories = ctx.settings.section("Category Tabs");
  ctx.loadStylesheet("styles.css");

  for (const [category, icon] of categories) {
    $categories.add(
      config<Modding.Settings.SettingConfig>({
        type: "custom",
        name: getCategorySettingName(category),
        default: getDefaultTab(category),
        render: (name, onChange) => {
          const cell = document.createElement("div");
          cell.className = `${CELL_CLASS} d-flex flex-column align-items-center`;
          cell.innerHTML = `
            <img src="${icon}" alt="${category}" title="${category}"/>
            <input
              type="text"
              id="${name}"
              class="form-control form-control-sm text-center"
              value="${getDefaultTab(category)}"
            />
          `;
          cell.querySelector("input")!.addEventListener("change", onChange);
          return cell;
        },
        get: (root) => Number(root.querySelector("input")?.value) || 0,
        set: (root, value) => (root.querySelector("input")!.value = String(value)),
      }),
    );
  }

  /** Returns the 1-based target tab for an item per user settings, or 0 to leave it alone. */
  function getTargetTab(itemId: string, maxTabs: number): number {
    const category = items.get(itemId);
    if (category === undefined) return 0;

    const targetTab = $categories.get(getCategorySettingName(category)) as number;
    return targetTab > 0 && targetTab <= maxTabs ? targetTab : 0;
  }

  return { getTargetTab };
}
