// System notifications for when a timer finishes. They are written to read on a
// watch as well as on a phone: Android mirrors a site's notifications to a paired
// Fitbit (or any wearable) as plain text — the title, then the body — on a screen
// a few words wide that has no glyph for most emoji. So the title names what
// finished in two or three words, the body says what happens next in one short
// sentence, and neither carries emoji.

export interface TimerNotice {
  title: string;
  body: string;
  /** One per timer page, so a new notice replaces the last instead of stacking. */
  tag: string;
}

/** Fired on `document` whenever this page changes the notification permission. */
export const PERMISSION_EVENT = "timer-notification-permission";

export function notificationsSupported(): boolean {
  return "Notification" in window;
}

/**
 * Asks for permission the first time a timer starts. A browser only shows the
 * prompt from a user gesture, so call it straight from a click handler.
 */
export function enableNotifications(): void {
  if (!notificationsSupported() || Notification.permission !== "default") return;
  void Notification.requestPermission().then(() => {
    document.dispatchEvent(new Event(PERMISSION_EVENT));
  });
}

export async function notify({ title, body, tag }: TimerNotice): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== "granted") return;

  // `renotify` and `vibrate` are real options that lib.dom no longer lists:
  // without `renotify` a notice that replaces one with the same tag arrives
  // silently, and a silent notice is never forwarded to the watch.
  const options: NotificationOptions & { renotify: boolean; vibrate: number[] } = {
    body,
    tag,
    renotify: true,
    vibrate: [300, 150, 300],
    icon: "/icons/icon-192.png",
    data: { url: location.pathname + location.search },
  };

  // Android Chrome — the path to a Fitbit — throws on `new Notification()` and
  // only shows notifications through the service worker. The worker exists only
  // in a build, so fall back to the constructor in dev and desktop browsers.
  const registration = await navigator.serviceWorker?.getRegistration();
  if (registration) {
    await registration.showNotification(title, options);
    return;
  }
  try {
    new Notification(title, options);
  } catch {
    // No worker and no constructor: nothing more this browser can do.
  }
}
