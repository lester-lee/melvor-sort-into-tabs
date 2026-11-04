/** Number of bank tabs available. */
export function getTabCount() {
  return game.bank.tabCount || game.bank.itemsByTab?.length || 12;
}

/** Snapshot of all bank items, so later moves don't disturb iteration. */
function collectBankItems(bank, debug) {
  const items = [];

  if (bank.items instanceof Map) {
    debug("bank.items is a Map with", bank.items.size, "entries");
    bank.items.forEach((bankItem, itemKey) => {
      items.push({
        bankItem,
        item: bankItem.item,
        currentTab: bankItem.tab,
        itemId: bankItem.item?.id || itemKey,
      });
    });
  } else if (Array.isArray(bank.itemsByTab)) {
    debug("Using itemsByTab");
    bank.itemsByTab.forEach((tabItems, tabIndex) => {
      if (!Array.isArray(tabItems)) return;
      for (const bankItem of tabItems) {
        const item = bankItem.item || bankItem;
        items.push({ bankItem, item, currentTab: tabIndex, itemId: item.id });
      }
    });
  }

  return items;
}

function debugDumpBank(bank, items, debug) {
  const methodsOf = (obj) =>
    Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).filter(
      (n) => typeof obj[n] === "function",
    );

  const bankMethods = methodsOf(bank);
  debug("ALL Bank methods:", bankMethods.join(", "));
  debug("Move-related methods:", bankMethods.filter((m) => /move|tab|item/i.test(m)).join(", "));

  const sample = items[0]?.bankItem;
  if (sample) {
    debug("Sample bankItem structure:", Object.keys(sample));
    if (sample.item) debug("Sample item.item structure:", Object.keys(sample.item));
    debug("BankItem methods:", methodsOf(sample).join(", "));
  }
}

/** Plans moves, grouped by 0-based target tab. */
function planMoves(items, getTargetTab, maxTabs) {
  const movesByTargetTab = new Map();
  let skipped = 0;

  for (const { bankItem, item, currentTab, itemId } of items) {
    if (!itemId) {
      skipped++;
      continue;
    }

    const targetTab = getTargetTab(itemId, maxTabs);
    if (targetTab && targetTab - 1 !== currentTab) {
      const toTab = targetTab - 1;
      if (!movesByTargetTab.has(toTab)) movesByTargetTab.set(toTab, []);
      movesByTargetTab
        .get(toTab)
        .push({
          bankItem,
          item,
          itemId,
          fromTab: currentTab,
          toTab,
          itemName: item?.name || itemId,
        });
    }
  }

  return { movesByTargetTab, skipped };
}

/** Moves items using the game's own selection system, which properly updates the UI. */
function applyMoves(bank, movesByTargetTab, { debug, warn }) {
  let moved = 0;
  let skipped = 0;

  for (const [targetTab, moves] of movesByTargetTab) {
    try {
      debug(`Processing ${moves.length} items for tab ${targetTab + 1}`);

      if (typeof bank.setItemSelectionMode === "function") {
        bank.setItemSelectionMode(1); // 1 = move mode
      }
      bank.selectedItems?.clear();

      for (const move of moves) {
        if (typeof bank.toggleItemForMoving === "function") {
          try {
            bank.toggleItemForMoving(move.bankItem);
          } catch {
            try {
              bank.toggleItemForMoving(move.item);
            } catch {
              debug(`Could not select ${move.itemName}`);
            }
          }
        } else if (typeof bank.toggleItemSelected === "function") {
          bank.toggleItemSelected(move.bankItem);
        }
      }

      if (typeof bank.moveSelectedItemsToTab === "function") {
        bank.moveSelectedItemsToTab(targetTab);
        moved += moves.length;
        debug(`✓ Moved ${moves.length} items to tab ${targetTab + 1} via selection system`);
      } else {
        debug("moveSelectedItemsToTab not available, using fallback");
        for (const move of moves) {
          try {
            const oldTabArray = bank.itemsByTab[move.fromTab];
            if (oldTabArray) {
              const idx = oldTabArray.indexOf(move.bankItem);
              if (idx > -1) oldTabArray.splice(idx, 1);
            }
            if (!bank.itemsByTab[targetTab]) {
              bank.itemsByTab[targetTab] = [];
            }
            bank.itemsByTab[targetTab].push(move.bankItem);
            move.bankItem.tab = targetTab;
            moved++;
          } catch {
            skipped++;
          }
        }
      }

      if (typeof bank.disableItemSelectionMode === "function") {
        bank.disableItemSelectionMode();
      }
    } catch (batchError) {
      warn(`Batch move error for tab ${targetTab + 1}:`, batchError.message);
      skipped += moves.length;
    }
  }

  return { moved, skipped };
}

function refreshBankUI(bank, maxTabs, { debug, warn }) {
  debug("Forcing UI refresh...");

  try {
    // Set render queue flags safely (only booleans, skip Sets/Maps)
    if (bank.renderQueue) {
      const rq = bank.renderQueue;
      for (const key of Object.keys(rq)) {
        if (typeof rq[key] === "boolean") rq[key] = true;
      }
      debug("Render queue boolean flags set");
    }

    if (typeof bank.render === "function") {
      bank.render();
      debug("Called bank.render()");
    }

    if (typeof bank.reassignBankItemPositions === "function") {
      for (let tabIdx = 0; tabIdx < maxTabs; tabIdx++) {
        try {
          bank.reassignBankItemPositions(tabIdx);
        } catch {
          // Some tabs might be empty or not exist, that's OK
        }
      }
      debug("Called reassignBankItemPositions() for all tabs");
    }

    // Update search array to force UI rebuild
    if (typeof bank.updateSearchArray === "function") {
      bank.updateSearchArray();
    }

    // Force tab switch to trigger refresh
    const currentTab = bank.selectedBankTab || 0;
    if (typeof bank.selectTab === "function") {
      const tempTab = currentTab === 0 ? Math.min(1, maxTabs - 1) : 0;
      bank.selectTab(tempTab);

      requestAnimationFrame(() => {
        bank.selectTab(currentTab);
        debug("Tab switch done");
      });
    }

    if (typeof game.render === "function") {
      game.render();
    }
  } catch (renderError) {
    warn("Render error:", renderError.message);
  }
}

/**
 * @param {object} deps
 * @param {(itemId: string, maxTabs: number) => number} deps.getTargetTab
 * @param {(msg: string, type?: string) => void} deps.notify
 * @param {typeof import("./log.mjs")} deps.logger
 */
export function createSorter({ getTargetTab, notify, logger }) {
  const { debug, info, error } = logger;

  return function sortItemsIntoTabs() {
    try {
      debug("========== STARTING SORT ==========");

      if (typeof game === "undefined" || !game) {
        error("Game object not available");
        notify("Game not loaded. Please try again.", "error");
        return;
      }

      const bank = game.bank;
      if (!bank) {
        error("Bank not available");
        notify("Bank not available. Please open the bank first.", "error");
        return;
      }

      const maxTabs = getTabCount();
      debug("Max tabs available:", maxTabs);

      const items = collectBankItems(bank, debug);
      debug(`Total items to process: ${items.length}`);

      if (items.length === 0) {
        notify("No items found in bank to sort.", "info");
        return;
      }

      debugDumpBank(bank, items, debug);

      const { movesByTargetTab, skipped: unidentified } = planMoves(items, getTargetTab, maxTabs);

      if (movesByTargetTab.size === 0) {
        notify("All items already in correct tabs!", "info");
        return;
      }

      debug(
        "Moving to tabs:",
        [...movesByTargetTab.keys()].map((t) => t + 1),
      );

      const { moved, skipped } = applyMoves(bank, movesByTargetTab, logger);
      info(`Sort complete! Moved ${moved} items, skipped ${skipped + unidentified}`);

      if (moved > 0) {
        refreshBankUI(bank, maxTabs, logger);
        notify(`✓ Sorted ${moved} items!`, "success");
      } else {
        notify("No items needed moving.", "info");
      }

      debug("========== SORT COMPLETE ==========");
    } catch (err) {
      error("Fatal error:", err);
      error("Stack:", err.stack);
      notify("Error sorting bank. Check console (F12) for details.", "error");
    }
  };
}
