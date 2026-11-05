import type { Logger } from "./log";
import type { Notify } from "./notify";

/** `MOVE_MODE`; the game's const enum doesn't exist at runtime. */
const MOVE_MODE = 1 as BankSelectionMode;

/** Number of bank tabs available. */
export function getTabCount(): number {
  return game.bank.tabCount;
}

/** Plans moves, grouped by 0-based target tab. */
function planMoves(
  bank: Bank,
  getTargetTab: (itemId: string, maxTabs: number) => number,
  maxTabs: number,
) {
  const movesByTargetTab = new Map<number, BankItem[]>();
  let total = 0;

  for (const bankItem of bank.items.values()) {
    total++;
    const targetTab = getTargetTab(bankItem.item.id, maxTabs);
    if (!targetTab || targetTab - 1 === bankItem.tab) continue;

    const toTab = targetTab - 1;
    if (!movesByTargetTab.has(toTab)) movesByTargetTab.set(toTab, []);
    movesByTargetTab.get(toTab)!.push(bankItem);
  }

  return { movesByTargetTab, total };
}

/**
 * Moves items using the game's own selection system, which properly updates the
 * UI.
 */
function applyMoves(
  bank: Bank,
  movesByTargetTab: Map<number, BankItem[]>,
  { debug, warn }: Logger,
) {
  let moved = 0;
  let skipped = 0;

  for (const [targetTab, moves] of movesByTargetTab) {
    try {
      debug(`Processing ${moves.length} items for tab ${targetTab + 1}`);

      bank.setItemSelectionMode(MOVE_MODE);
      bank.selectedItems.clear();

      for (const bankItem of moves) bank.toggleItemForMoving(bankItem);

      bank.moveSelectedItemsToTab(targetTab);
      moved += moves.length;
      debug(
        `✓ Moved ${moves.length} items to tab ${targetTab + 1} via selection system`,
      );

      bank.disableItemSelectionMode();
    } catch (batchError) {
      warn(
        `Batch move error for tab ${targetTab + 1}:`,
        batchError instanceof Error ? batchError.message : batchError,
      );
      skipped += moves.length;
    }
  }

  return { moved, skipped };
}

function refreshBankUI(bank: Bank, maxTabs: number, { debug, warn }: Logger) {
  debug("Forcing UI refresh...");

  try {
    bank.renderQueue.bankSearch = true;
    bank.renderQueue.bankValue = true;
    bank.renderQueue.space = true;
    bank.renderQueue.bankFilter = true;
    debug("Render queue flags set");

    bank.render();
    debug("Called bank.render()");

    for (let tabIdx = 0; tabIdx < maxTabs; tabIdx++) {
      bank.reassignBankItemPositions(tabIdx, 0);
    }
    debug("Called reassignBankItemPositions() for all tabs");

    // Update search array to force UI rebuild
    bank.updateSearchArray();

    game.render();
  } catch (renderError) {
    warn(
      "Render error:",
      renderError instanceof Error ? renderError.message : renderError,
    );
  }
}

export function createSorter({
  getTargetTab,
  notify,
  logger,
}: {
  getTargetTab: (itemId: string, maxTabs: number) => number;
  notify: Notify;
  logger: Logger;
}) {
  const { debug, info, error } = logger;

  return function sortItemsIntoTabs() {
    try {
      debug("========== STARTING SORT ==========");

      const bank = game.bank;
      const maxTabs = getTabCount();
      debug("Max tabs available:", maxTabs);

      const { movesByTargetTab, total } = planMoves(
        bank,
        getTargetTab,
        maxTabs,
      );
      debug(`Total items to process: ${total}`);

      if (total === 0) {
        notify("No items found in bank to sort.", "info");
        return;
      }

      if (movesByTargetTab.size === 0) {
        notify("All items already in correct tabs!", "info");
        return;
      }

      debug(
        "Moving to tabs:",
        [...movesByTargetTab.keys()].map((t) => t + 1),
      );

      const { moved, skipped } = applyMoves(bank, movesByTargetTab, logger);
      info(`Sort complete! Moved ${moved} items, skipped ${skipped}`);

      if (moved > 0) {
        refreshBankUI(bank, maxTabs, logger);
        notify(`✓ Sorted ${moved} items!`, "success");
      } else {
        notify("No items needed moving.", "info");
      }

      debug("========== SORT COMPLETE ==========");
    } catch (err) {
      error("Fatal error:", err);
      if (err instanceof Error) error("Stack:", err.stack);
      notify("Error sorting bank. Check console (F12) for details.", "error");
    }
  };
}
