interface Window {
  sortItemsIntoTabs?: () => void;
  resetSortTabsToDefaults?: () => void;
}

/** Not part of the official Melvor typings. */
declare function fireTopNotification(message: string, type: string): void;
declare const nativeManager: { notify?: (message: string) => void } | undefined;
