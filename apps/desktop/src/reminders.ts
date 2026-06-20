/**
 * Reminder scheduler.
 *
 * There is no background OS process — this is a lightweight periodic sweep that
 * runs only while the app is open. Every {@link SWEEP_MS} it scans every todo
 * item across all boards and fires a reminder for any item whose reminder
 * instant (`due − leadTime`) has passed, that isn't done, and that hasn't
 * already been notified. Firing stamps `notifiedAt` so it won't repeat across
 * restarts; the todo editor clears `notifiedAt` whenever the due date or lead
 * time changes, which re-arms the item.
 */
import type { Locale, TodoItem } from "@snipdash/sdk";
import { reminderInstant } from "@snipdash/sdk";
import { useStore } from "./store";
import { translator } from "./i18n";
import { notifyReminder } from "./notify";

/** How often to scan for due reminders. */
const SWEEP_MS = 30_000;

function formatDue(iso: string, locale: Locale): string {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return "";
  const tag = locale === "ja" ? "ja-JP" : "en-US";
  return due.toLocaleString(tag, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reminderBody(item: TodoItem, locale: Locale): string {
  const when = item.due ? formatDue(item.due, locale) : "";
  return when ? `${item.text}（${when}）` : item.text;
}

function sweep(): void {
  const { workspace, markTodoNotified } = useStore.getState();
  if (!workspace) return;
  const now = Date.now();
  const locale = workspace.settings.locale;
  const title = translator(locale)("notify.reminderTitle");

  for (const board of workspace.boards) {
    for (const card of board.cards) {
      if (card.type !== "rich" || card.payload.mode !== "todo") continue;
      for (const item of card.payload.items) {
        if (item.done || item.notifiedAt || !item.due) continue;
        const fireAt = reminderInstant(item, workspace.settings);
        if (fireAt === null || now < fireAt) continue;
        markTodoNotified(card.id, item.id, new Date(now).toISOString());
        void notifyReminder(title, reminderBody(item, locale));
      }
    }
  }
}

/** Start the periodic sweep. Runs one immediate pass to catch anything already
 * due, then ticks every {@link SWEEP_MS}. Returns a stop function. */
export function startReminderScheduler(): () => void {
  sweep();
  const timer = setInterval(sweep, SWEEP_MS);
  return () => clearInterval(timer);
}
