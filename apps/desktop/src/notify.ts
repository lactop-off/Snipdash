/**
 * Reminder delivery.
 *
 * A fired reminder is surfaced two ways so it's noticed whether or not the
 * window is focused: an OS-native notification (system notification center, via
 * `tauri-plugin-notification`) and an in-app toast. Snipdash has no background
 * process, so this only runs while the app is open — see `reminders.ts`.
 *
 * Outside Tauri (browser demo), or before the OS grants notification
 * permission, the OS path is silently skipped and the toast still fires. We call
 * the plugin's IPC commands directly through `invoke` to avoid pulling in the
 * `@tauri-apps/plugin-notification` JS package.
 */
import { invoke } from "@tauri-apps/api/core";
import { toast } from "./toast";

/** True once the OS notification plugin has granted permission. */
let osNotifyReady = false;

/** Request OS notification permission once at startup. Safe to call in demo
 * mode (no Tauri) — it just leaves OS notifications disabled. */
export async function initNotifications(): Promise<void> {
  try {
    let granted = await invoke<boolean>("plugin:notification|is_permission_granted");
    if (!granted) {
      const res = await invoke<string>("plugin:notification|request_permission");
      granted = res === "granted";
    }
    osNotifyReady = granted;
  } catch {
    // No Tauri runtime / plugin not registered (browser demo). Toast-only.
    osNotifyReady = false;
  }
}

/** Deliver a message via an OS notification (when available) plus a toast. */
export async function notify(title: string, body = ""): Promise<void> {
  toast.info(body ? `${title}：${body}` : title);
  if (!osNotifyReady) return;
  try {
    await invoke("plugin:notification|notify", { options: { title, body } });
  } catch {
    // Permission revoked or plugin unavailable mid-session: fall back to toast.
    osNotifyReady = false;
  }
}

/** Deliver a reminder (OS notification + toast). */
export async function notifyReminder(title: string, body: string): Promise<void> {
  await notify(title, body);
}
