import { debug } from "./log";

export type NotifyType = "error" | "success" | "info";

const ID = "sortIntoTabs";
const MEDIA = "assets/media/main/bank_header.png";

/** Shows a notification through the game's own notification manager. */
export default function notify(type: NotifyType, message: string): void {
  debug(`${type.toUpperCase()}: ${message}`);

  switch (type) {
    case "error":
      return game.notifications.createErrorNotification(ID, message);
    case "success":
      return game.notifications.createSuccessNotification(ID, message, assets.getURI(MEDIA));
    case "info":
      return game.notifications.createInfoNotification(ID, message, assets.getURI(MEDIA));
  }
}
