export async function setup(ctx) {
  console.log("[Sort Into Tabs] Mod initializing...");

  // Debug mode - set to true for verbose logging
  const DEBUG = false;
  const log = (msg, ...args) =>
    DEBUG && console.log(`[Sort Into Tabs] ${msg}`, ...args);
  const logAlways = (msg, ...args) =>
    console.log(`[Sort Into Tabs] ${msg}`, ...args);

  // Helper function for user notifications - uses Toastify (game's actual notification library)
  function notify(message, type = "info") {
    log(`${type.toUpperCase()}: ${message}`);

    // Method 1: Use Toastify (game's actual toast library)
    try {
      if (typeof Toastify === "function") {
        const bgColor =
          type === "error"
            ? "#dc3545"
            : type === "success"
              ? "#28a745"
              : "#17a2b8";
        Toastify({
          text: message,
          duration: 5000,
          gravity: "bottom",
          position: "center",
          style: {
            background: bgColor,
            color: "white",
            fontWeight: "bold",
            borderRadius: "5px",
            padding: "10px 20px",
          },
        }).showToast();
        log("Notification shown via Toastify");
        return;
      }
    } catch (e) {
      log("Toastify failed:", e.message);
    }

    // Method 2: Use SweetAlert2 (Swal) - game uses this for dialogs
    try {
      if (typeof Swal !== "undefined" && Swal.fire) {
        Swal.fire({
          title: "Smart Tab Sort",
          text: message,
          icon:
            type === "error"
              ? "error"
              : type === "success"
                ? "success"
                : "info",
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
        });
        log("Notification shown via Swal");
        return;
      }
    } catch (e) {
      log("Swal failed:", e.message);
    }

    // Method 3: Use game's native fireTopNotification if available
    try {
      if (typeof fireTopNotification === "function") {
        fireTopNotification(message, type);
        return;
      }
    } catch (e) {}

    // Method 4: Use nativeManager notification
    try {
      if (typeof nativeManager !== "undefined" && nativeManager.notify) {
        nativeManager.notify(message);
        return;
      }
    } catch (e) {}

    // Method 5: Create our own visible notification div
    try {
      const notifDiv = document.createElement("div");
      notifDiv.textContent = message;
      notifDiv.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: ${type === "error" ? "#dc3545" : type === "success" ? "#28a745" : "#17a2b8"};
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 99999;
                font-size: 16px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                animation: fadeInOut 4s forwards;
            `;

      // Add animation style if not exists
      if (!document.getElementById("sort-tabs-notification-style")) {
        const style = document.createElement("style");
        style.id = "sort-tabs-notification-style";
        style.textContent = `
                    @keyframes fadeInOut {
                        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    }
                `;
        document.head.appendChild(style);
      }

      document.body.appendChild(notifDiv);
      setTimeout(() => notifDiv.remove(), 4000);
      log("Notification shown via custom div");
    } catch (e) {
      console.error("[Sort Into Tabs] All notification methods failed");
    }
  }

  // Load the scraped item data
  const { getItems, getCategories } = await ctx.loadModule("items.mjs");
  const itemCategoryData = getItems();
  const allCategories = getCategories(itemCategoryData);

  try {
    logAlways(
      `Loaded ${Object.keys(itemCategoryData).length} items with ${allCategories.size} unique categories`,
    );
  } catch (error) {
    console.error("[Sort Into Tabs] Failed to load item data:", error);
    console.error(
      "[Sort Into Tabs] The mod will not function without the item database.",
    );
    notify(
      "Failed to load item data. Mod will not function. Check console for details.",
      "error",
    );
  }

  // Convert categories to sorted array for settings generation
  const sortedCategories = Array.from(allCategories).sort();

  // Function to get the setting name for a category
  function getCategorySettingName(category) {
    return `category-${category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  }

  // Default tab assignments - grouped thematically by related skills
  // Tab 1: Miscellaneous (default tab where new items go)
  // Tab 2: Combat & Slayer
  // Tab 3: Mining & Smithing
  // Tab 4: Woodcutting, Firemaking & Fletching
  // Tab 5: Fishing & Cooking
  // Tab 6: Farming & Herblore
  // Tab 7: Magic (Runecrafting, Astrology, Summoning, Prayer)
  // Tab 8: Crafting & Thieving
  // Tab 9: Archaeology & Cartography
  // Tab 10: Township & Agility
  // Tab 11: Mastery & Skills tokens
  // Tab 12: Openable & Events
  const DEFAULT_TAB_ASSIGNMENTS = {
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

  // Function to get the default tab for a category
  function getDefaultTab(category) {
    return DEFAULT_TAB_ASSIGNMENTS[category] || 0;
  }

  // Create settings UI for category-to-tab mapping
  const categorySettings = ctx.settings.section("Category Settings");

  // Function to reset all category settings to defaults
  // Defined early so it can be referenced by the button
  function resetToDefaults() {
    try {
      for (const category of sortedCategories) {
        const settingName = getCategorySettingName(category);
        const defaultTab = getDefaultTab(category);
        categorySettings.set(settingName, defaultTab);
      }
      logAlways("All category settings reset to defaults!");
      notify("All sorting rules reset to defaults!", "success");
    } catch (error) {
      console.error("[Sort Into Tabs] Error resetting to defaults:", error);
      notify("Error resetting settings. Check console for details.", "error");
    }
  }

  // Make reset function available globally for manual triggering
  window.resetSortTabsToDefaults = resetToDefaults;

  // Add a read-only text field to show the tab warning and detected tabs
  categorySettings.add({
    type: "text",
    name: "info-warning",
    label: "⚠️ Important",
    hint: "If you buy a new bank tab during a session, please CLOSE and RE-OPEN the game to see the new tab count. Tab count is detected when the game loads.",
    default: "Read hint below ↓",
  });

  // Add Reset to Default button in settings
  categorySettings.add({
    type: "button",
    name: "reset-to-defaults",
    display: "Reset to Defaults",
    color: "warning",
    onClick: resetToDefaults,
  });

  // Add settings for each category with thematic defaults
  for (const category of sortedCategories) {
    const settingName = getCategorySettingName(category);
    const defaultTab = getDefaultTab(category);

    categorySettings.add({
      type: "number",
      name: settingName,
      label: category,
      hint: `Tab number for "${category}" items (0 = don't sort, items stay where they are). Default: ${defaultTab}`,
      default: defaultTab,
      min: 0,
      max: 100,
    });
  }

  // Function to determine which tab an item should go to based on user settings
  function getTargetTab(itemId, maxTabs) {
    try {
      const itemData = itemCategoryData[itemId];
      if (!itemData) return 0; // No data, don't sort

      // Look up the category's target tab from user settings
      if (itemData.category) {
        const settingName = getCategorySettingName(itemData.category);
        const targetTab = categorySettings.get(settingName);

        // Only return if a valid tab is configured (> 0 and <= maxTabs)
        if (targetTab && targetTab > 0 && targetTab <= maxTabs) {
          return targetTab;
        }
      }

      // No valid tab configured for this category
      return 0;
    } catch (error) {
      console.error("[Sort Into Tabs] Error in getTargetTab:", error);
      return 0;
    }
  }

  // Function to perform the sorting based on user settings
  function sortItemsIntoTabs() {
    try {
      log("========== STARTING SORT ==========");

      // Defensive check for game object
      if (typeof game === "undefined" || !game) {
        console.error("[Sort Into Tabs] Game object not available");
        notify("Game not loaded. Please try again.", "error");
        return;
      }

      if (!game.bank) {
        console.error("[Sort Into Tabs] Bank not available");
        notify("Bank not available. Please open the bank first.", "error");
        return;
      }

      // Log ALL available methods on game.bank for debugging (only in debug mode)
      if (DEBUG) {
        const bankProto = Object.getPrototypeOf(game.bank);
        const allBankMethods = Object.getOwnPropertyNames(bankProto).filter(
          (n) => typeof game.bank[n] === "function",
        );
        log("ALL Bank methods:", allBankMethods.join(", "));

        const moveMethods = allBankMethods.filter(
          (m) =>
            m.toLowerCase().includes("move") ||
            m.toLowerCase().includes("tab") ||
            m.toLowerCase().includes("item"),
        );
        log("Move-related methods:", moveMethods.join(", "));
      }

      let movedCount = 0;
      let skippedCount = 0;

      // Get the maximum number of tabs available
      const maxTabs = game.bank.tabCount || game.bank.itemsByTab?.length || 12;
      log("Max tabs available:", maxTabs);

      // Get all bank items - create a SNAPSHOT to avoid modification during iteration
      let itemsToProcess = [];

      if (game.bank.items instanceof Map) {
        log("bank.items is a Map with", game.bank.items.size, "entries");
        // Create snapshot with item reference and current tab
        game.bank.items.forEach((bankItem, itemKey) => {
          itemsToProcess.push({
            bankItem: bankItem,
            item: bankItem.item,
            currentTab: bankItem.tab,
            itemId: bankItem.item?.id || itemKey,
          });
        });
      } else if (game.bank.itemsByTab && Array.isArray(game.bank.itemsByTab)) {
        log("Using itemsByTab");
        game.bank.itemsByTab.forEach((tabItems, tabIndex) => {
          if (Array.isArray(tabItems)) {
            tabItems.forEach((bankItem) => {
              itemsToProcess.push({
                bankItem: bankItem,
                item: bankItem.item || bankItem,
                currentTab: tabIndex,
                itemId: (bankItem.item || bankItem).id,
              });
            });
          }
        });
      }

      log(`Total items to process: ${itemsToProcess.length}`);

      if (itemsToProcess.length === 0) {
        notify("No items found in bank to sort.", "info");
        return;
      }

      // Log first item structure for debugging (only in debug mode)
      if (DEBUG && itemsToProcess.length > 0) {
        const sampleItem = itemsToProcess[0];
        log("Sample bankItem structure:", Object.keys(sampleItem.bankItem));
        if (sampleItem.bankItem.item) {
          log(
            "Sample item.item structure:",
            Object.keys(sampleItem.bankItem.item),
          );
        }
        const bankItemProto = Object.getPrototypeOf(sampleItem.bankItem);
        const bankItemMethods = Object.getOwnPropertyNames(
          bankItemProto,
        ).filter((n) => typeof sampleItem.bankItem[n] === "function");
        log("BankItem methods:", bankItemMethods.join(", "));
      }

      // Build list of moves to make
      const movesToMake = [];

      for (const itemData of itemsToProcess) {
        const { bankItem, item, currentTab, itemId } = itemData;

        if (!itemId) {
          skippedCount++;
          continue;
        }

        const targetTab = getTargetTab(itemId, maxTabs);
        const targetTabIndex = targetTab - 1; // Convert 1-based to 0-based

        // Only move if target tab is valid and different from current
        if (
          targetTab > 0 &&
          targetTab <= maxTabs &&
          targetTabIndex !== currentTab
        ) {
          movesToMake.push({
            bankItem,
            item,
            itemId,
            fromTab: currentTab,
            toTab: targetTabIndex,
            itemName: item?.name || itemId,
          });
        }
      }

      log(`Items to move: ${movesToMake.length}`);

      if (movesToMake.length === 0) {
        notify("All items already in correct tabs!", "info");
        return;
      }

      // Group moves by target tab for batch processing
      const movesByTargetTab = new Map();
      for (const move of movesToMake) {
        if (!movesByTargetTab.has(move.toTab)) {
          movesByTargetTab.set(move.toTab, []);
        }
        movesByTargetTab.get(move.toTab).push(move);
      }

      log(
        "Moving to tabs:",
        [...movesByTargetTab.keys()].map((t) => t + 1),
      );

      // USE THE GAME'S OWN SELECTION SYSTEM - this properly updates UI
      // This mimics what happens when user manually selects items and moves them

      for (const [targetTab, moves] of movesByTargetTab) {
        try {
          log(`Processing ${moves.length} items for tab ${targetTab + 1}`);

          // 1. Enable selection mode for moving
          if (typeof game.bank.setItemSelectionMode === "function") {
            game.bank.setItemSelectionMode(1); // 1 = move mode
          }

          // 2. Clear any existing selection
          if (game.bank.selectedItems) {
            game.bank.selectedItems.clear();
          }

          // 3. Select items for this batch
          for (const move of moves) {
            if (typeof game.bank.toggleItemForMoving === "function") {
              try {
                game.bank.toggleItemForMoving(move.bankItem);
              } catch (e) {
                // Try with item instead
                try {
                  game.bank.toggleItemForMoving(move.item);
                } catch (e2) {
                  log(`Could not select ${move.itemName}`);
                }
              }
            } else if (typeof game.bank.toggleItemSelected === "function") {
              game.bank.toggleItemSelected(move.bankItem);
            }
          }

          // 4. Move all selected items to target tab
          if (typeof game.bank.moveSelectedItemsToTab === "function") {
            game.bank.moveSelectedItemsToTab(targetTab);
            movedCount += moves.length;
            log(
              `✓ Moved ${moves.length} items to tab ${targetTab + 1} via selection system`,
            );
          } else {
            log("moveSelectedItemsToTab not available, using fallback");
            // Fallback to direct manipulation
            for (const move of moves) {
              try {
                const oldTabArray = game.bank.itemsByTab[move.fromTab];
                if (oldTabArray) {
                  const idx = oldTabArray.indexOf(move.bankItem);
                  if (idx > -1) oldTabArray.splice(idx, 1);
                }
                if (!game.bank.itemsByTab[targetTab]) {
                  game.bank.itemsByTab[targetTab] = [];
                }
                game.bank.itemsByTab[targetTab].push(move.bankItem);
                move.bankItem.tab = targetTab;
                movedCount++;
              } catch (e) {
                skippedCount++;
              }
            }
          }

          // 5. Disable selection mode
          if (typeof game.bank.disableItemSelectionMode === "function") {
            game.bank.disableItemSelectionMode();
          }
        } catch (batchError) {
          console.warn(
            `[Sort Into Tabs] Batch move error for tab ${targetTab + 1}:`,
            batchError.message,
          );
          skippedCount += moves.length;
        }
      }

      logAlways(
        `Sort complete! Moved ${movedCount} items, skipped ${skippedCount}`,
      );

      // AGGRESSIVE UI REFRESH
      if (movedCount > 0) {
        log("Forcing UI refresh...");

        try {
          // 1. Set render queue flags SAFELY (only booleans, skip Sets/Maps)
          if (game.bank.renderQueue) {
            const rq = game.bank.renderQueue;
            Object.keys(rq).forEach((key) => {
              if (typeof rq[key] === "boolean") {
                rq[key] = true;
              }
            });
            log("Render queue boolean flags set");
          }

          // 2. Call render
          if (typeof game.bank.render === "function") {
            game.bank.render();
            log("Called bank.render()");
          }

          // 3. Try reassignBankItemPositions (requires tab index parameter)
          if (typeof game.bank.reassignBankItemPositions === "function") {
            try {
              // This method requires a tab index - call for all tabs that had items moved
              for (let tabIdx = 0; tabIdx < maxTabs; tabIdx++) {
                try {
                  game.bank.reassignBankItemPositions(tabIdx);
                } catch (tabError) {
                  // Some tabs might be empty or not exist, that's OK
                }
              }
              log("Called reassignBankItemPositions() for all tabs");
            } catch (e) {
              log("reassignBankItemPositions error:", e.message);
            }
          }

          // 4. Update search array to force UI rebuild
          if (typeof game.bank.updateSearchArray === "function") {
            game.bank.updateSearchArray();
          }

          // 5. Force tab switch to trigger refresh
          const currentTab = game.bank.selectedBankTab || 0;
          if (typeof game.bank.selectTab === "function") {
            const tempTab = currentTab === 0 ? Math.min(1, maxTabs - 1) : 0;
            game.bank.selectTab(tempTab);

            requestAnimationFrame(() => {
              game.bank.selectTab(currentTab);
              log("Tab switch done");
            });
          }

          // 6. Global game render
          if (typeof game.render === "function") {
            game.render();
          }
        } catch (renderError) {
          console.warn("[Sort Into Tabs] Render error:", renderError.message);
        }

        notify(`✓ Sorted ${movedCount} items!`, "success");
      } else {
        notify("No items needed moving.", "info");
      }

      log("========== SORT COMPLETE ==========");
    } catch (error) {
      console.error("[Sort Into Tabs] Fatal error:", error);
      console.error("[Sort Into Tabs] Stack:", error.stack);
      notify("Error sorting bank. Check console (F12) for details.", "error");
    }
  }

  // Add the "Smart Tab Sort" button to the bank interface
  ctx.onInterfaceReady(() => {
    try {
      log("Adding UI button...");

      // Log detected tab count for user information
      if (typeof game !== "undefined" && game && game.bank) {
        const tabCount =
          game.bank.tabCount || game.bank.itemsByTab?.length || 12;
        logAlways(
          `Detected ${tabCount} bank tabs. If you buy a new tab, please restart the game to see it in settings.`,
        );
      }

      // Function to add button (may be called multiple times as UI loads)
      function addSortButton() {
        // Check if button already exists
        if (document.getElementById("sort-into-tabs-button")) {
          return true;
        }

        // Create sort button (only button now)
        const sortButton = document.createElement("button");
        sortButton.id = "sort-into-tabs-button";
        sortButton.className = "btn btn-primary m-2";
        sortButton.textContent = "Smart Tab Sort";
        sortButton.onclick = sortItemsIntoTabs;
        sortButton.style.cssText = "font-size: 14px; padding: 8px 16px;";

        // Try to find the bank controls area to add the button
        const container = document.querySelector(
          "bank-options-menu button",
        )?.parentElement;
        if (!container) return false;

        container.insertBefore(sortButton, container.firstChild);

        log(`Button added to ${selector}`);
      }

      // Try to add button immediately
      if (addSortButton()) {
        log("Button added successfully");
      } else {
        log("Bank container not ready, will retry...");

        // Retry after a delay
        setTimeout(() => {
          if (addSortButton()) {
            log("Button added successfully (delayed)");
          } else {
            console.warn(
              "[Sort Into Tabs] Could not find bank container after retry",
            );
            console.warn(
              "[Sort Into Tabs] Button can be manually triggered via console: sortItemsIntoTabs()",
            );
          }
        }, 2000);
      }

      // Make function available globally for manual triggering
      window.sortItemsIntoTabs = sortItemsIntoTabs;
      log("Function available globally: window.sortItemsIntoTabs()");
    } catch (error) {
      console.error("[Sort Into Tabs] Error adding button:", error);
    }
  });

  logAlways(
    `Mod initialized! ${sortedCategories.length} categories available for customization. Configure in Mod Settings.`,
  );
}
