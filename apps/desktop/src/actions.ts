import {
  type LauncherKind,
  type Locale,
  copyText,
  openTarget,
  resolveTemplate,
} from "@snipdash/sdk";
import { toast } from "./toast";
import { translator } from "./i18n";

/**
 * Copy a card body, expanding template variables at copy time (FR-19).
 * Falls back to the Web Clipboard API when running outside Tauri.
 */
export async function copyResolved(raw: string, locale: Locale): Promise<void> {
  const t = translator(locale);
  const { text, unknownVars } = resolveTemplate(raw);
  try {
    await copyText(text);
  } catch {
    // Demo / browser fallback.
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error("clipboard unavailable");
      return;
    }
  }
  toast.success(t("card.copied"));
  if (unknownVars.length > 0) {
    toast.info(t("toast.unknownVars") + unknownVars.map((v) => `{{${v}}}`).join(", "));
  }
}

/** Open a launcher target via the backend, with a browser fallback for URLs. */
export async function openLauncher(kind: LauncherKind, target: string, locale: Locale): Promise<void> {
  const t = translator(locale);
  try {
    await openTarget(kind, target);
    toast.success(t("card.opened"));
  } catch (e: unknown) {
    if (kind === "url") {
      // Demo / browser fallback.
      window.open(target, "_blank", "noopener");
      return;
    }
    const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
    toast.error(msg);
  }
}
