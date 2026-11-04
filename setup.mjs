export async function setup(ctx) {
  info("Mod initializing...");

  const logger = await ctx.loadModule("log.mjs");
  const { debug, info, warn, error } = logger;
  const { createNotify } = await ctx.loadModule("notify.mjs");
  const notify = createNotify(debug, error);

  const { registerSettings } = await ctx.loadModule("settings.mjs");
  const sort = await ctx.loadModule("sort.mjs");
  const { getItemsAndCategories } = await ctx.loadModule("items.mjs");

  try {
    const [items, categories] = getItemsAndCategories();
    const { getTargetTab } = await registerSettings({ ctx, categories, items, notify, logger });
    const sortItemsIntoTabs = sort.createSorter({ getTargetTab, notify, logger });

    // Add the "Smart Tab Sort" button to the bank interface
    ctx.onInterfaceReady(() => {
      try {
        debug("Adding UI button...");
        info(`
      Detected ${sort.getTabCount()} bank tabs.
      If you buy a new tab, please restart the game to see it in settings.
      `);

        // Function to add button (may be called multiple times as UI loads)
        function addSortButton() {
          if (document.getElementById("sort-into-tabs-button")) {
            return true;
          }

          const sortButton = document.createElement("button");
          sortButton.id = "sort-into-tabs-button";
          sortButton.className = "btn btn-primary m-2";
          sortButton.textContent = "Smart Tab Sort";
          sortButton.onclick = sortItemsIntoTabs;
          sortButton.style.cssText = "font-size: 14px; padding: 8px 16px;";

          // Try to find the bank controls area to add the button
          const container = document.querySelector("bank-options-menu button")?.parentElement;
          if (!container) return false;

          container.insertBefore(sortButton, container.firstChild);

          debug(`Button added to ${selector}`);
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
    notify(e.message, "error");
  }
}
