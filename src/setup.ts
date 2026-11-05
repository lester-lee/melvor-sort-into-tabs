import { getItemsAndCategories } from "./items";
import { debug, error, info, warn } from "./log";
import notify from "./notify";
import { registerSettings } from "./settings";
import { createSorter, getTabCount } from "./sort";

export async function setup(ctx: Modding.ModContext) {
  info("Mod initializing...");

  try {
    const [items, categories] = getItemsAndCategories();
    const { getTargetTab } = registerSettings({ ctx, categories, items });
    const sortItemsIntoTabs = createSorter({ getTargetTab });

    // Add the "Smart Tab Sort" button to the bank interface
    ctx.onInterfaceReady(() => {
      try {
        debug("Adding UI button...");
        info(
          `Detected ${getTabCount()} bank tabs. If you buy a new tab, please restart the game to see it in settings.`,
        );

        // Function to add button (may be called multiple times as UI loads)
        function addSortButton(): boolean {
          if (document.getElementById("sort-into-tabs-button")) {
            return true;
          }

          // Try to find the bank controls area to add the button
          const container = document.querySelector("bank-options-menu button")?.parentElement;
          if (!container) return false;

          const sortButton = document.createElement("button");
          sortButton.id = "sort-into-tabs-button";
          sortButton.className = "btn btn-primary m-2";
          sortButton.textContent = "Smart Tab Sort";
          sortButton.onclick = sortItemsIntoTabs;
          sortButton.style.cssText = "font-size: 14px; padding: 8px 16px;";

          container.insertBefore(sortButton, container.firstChild);
          return true;
        }

        // Try to add button immediately
        if (addSortButton()) {
          debug("Button added successfully");
        } else {
          debug("Bank container not ready, will retry...");

          // Retry after a delay
          setTimeout(() => {
            if (addSortButton()) {
              debug("Button added successfully (delayed)");
            } else {
              warn("Could not find bank container after retry");
              warn("Button can be manually triggered via console: sortItemsIntoTabs()");
            }
          }, 2000);
        }

        // Make function available globally for manual triggering
        window.sortItemsIntoTabs = sortItemsIntoTabs;
        debug("Function available globally: window.sortItemsIntoTabs()");
      } catch (err) {
        error("Error adding button:", err);
      }
    });

    info("Setup complete.");
  } catch (e) {
    error("Error.", e);
    // The game UI isn't available yet during setup, so notify once it is.
    ctx.onInterfaceReady(() => notify("error", e instanceof Error ? e.message : String(e)));
  }
}
