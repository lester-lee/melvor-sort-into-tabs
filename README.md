# Sort Items Into Tabs

A Melvor Idle mod that adds a button to the bank which moves every item into the tab you've assigned to its category.

Based on [Sort Into Tabs](https://mod.io/g/melvoridle/m/sort-into-tabs#description).

## Settings

Open the mod's settings to choose a tab for each item category.

- Enter a tab number (1 and up), or 0 to leave that category alone.
- A tab number higher than the number of tabs you own is ignored.
- Sorting uses the game's own move-to-tab logic, so it behaves like selecting items and moving them by hand.

## Console

These functions are available from the browser console (F12):

- `sortItemsIntoTabs()` runs the sort.
- `resetSortTabsToDefaults()` resets the settings.
- `getItemsAndCategories()` returns the item and category maps.
