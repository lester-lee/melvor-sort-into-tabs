const COLORS = { error: "#dc3545", success: "#28a745", info: "#17a2b8" };

/**
 * Creates a user notification function, trying the game's notification libraries first.
 *
 * @param {(msg: string, ...args: unknown[]) => void} debug
 * @param {(msg: string, ...args: unknown[]) => void} error
 */
export function createNotify(debug, error) {
  return function notify(message, type = "info") {
    debug(`${type.toUpperCase()}: ${message}`);
    const bgColor = COLORS[type] ?? COLORS.info;

    // Method 1: Use Toastify (game's actual toast library)
    try {
      if (typeof Toastify === "function") {
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
        debug("Notification shown via Toastify");
        return;
      }
    } catch (e) {
      debug("Toastify failed:", e.message);
    }

    // Method 2: Use SweetAlert2 (Swal) - game uses this for dialogs
    try {
      if (typeof Swal !== "undefined" && Swal.fire) {
        Swal.fire({
          title: "Smart Tab Sort",
          text: message,
          icon: type === "error" ? "error" : type === "success" ? "success" : "info",
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
        });
        debug("Notification shown via Swal");
        return;
      }
    } catch (e) {
      debug("Swal failed:", e.message);
    }

    // Method 3: Use game's native fireTopNotification if available
    try {
      if (typeof fireTopNotification === "function") {
        fireTopNotification(message, type);
        return;
      }
    } catch {}

    // Method 4: Use nativeManager notification
    try {
      if (typeof nativeManager !== "undefined" && nativeManager.notify) {
        nativeManager.notify(message);
        return;
      }
    } catch {}

    // Method 5: Create our own visible notification div
    try {
      const notifDiv = document.createElement("div");
      notifDiv.textContent = message;
      notifDiv.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${bgColor};
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
      debug("Notification shown via custom div");
    } catch {
      error("All notification methods failed");
    }
  };
}
