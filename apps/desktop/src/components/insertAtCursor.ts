import type { RefObject } from "react";

/**
 * Insert `token` at the textarea's caret (or append if no selection info),
 * returning the new value. The caller is responsible for persisting it.
 */
export function insertAtCursor(
  ref: RefObject<HTMLTextAreaElement | null>,
  current: string,
  token: string,
): string {
  const el = ref.current;
  if (!el) return current + token;
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? start;
  const next = current.slice(0, start) + token + current.slice(end);
  // Restore caret just after the inserted token on the next tick.
  requestAnimationFrame(() => {
    const pos = start + token.length;
    el.focus();
    el.setSelectionRange(pos, pos);
  });
  return next;
}
