import type { Locale, PomodoroConfig, Theme } from "@snipdash/sdk";
import {
  DEFAULT_POMODORO,
  DEFAULT_REMIND_BEFORE,
  REMIND_BEFORE_PRESETS,
  registerGlobalHotkey,
  setAlwaysOnTop,
} from "@snipdash/sdk";
import { useStore } from "../store";
import { remindLabel, translator } from "../i18n";

const POMO_FIELDS: { key: keyof PomodoroConfig; label: string; max: number }[] = [
  { key: "workMin", label: "settings.pomodoro.work", max: 120 },
  { key: "breakMin", label: "settings.pomodoro.break", max: 60 },
  { key: "longBreakMin", label: "settings.pomodoro.longBreak", max: 60 },
  { key: "longBreakEvery", label: "settings.pomodoro.every", max: 12 },
];

// Each entry's `keys` is a token list: "+"/"/" render as separators, the rest as <kbd>.
const SHORTCUTS: { label: string; keys: string[] }[] = [
  { label: "shortcuts.prevNextTab", keys: ["Ctrl", "+", "PageUp", "/", "PageDown"] },
  { label: "shortcuts.nthTab", keys: ["Ctrl", "+", "1〜9"] },
  { label: "shortcuts.toggleEdit", keys: ["Ctrl", "+", "E"] },
  { label: "shortcuts.newTab", keys: ["Ctrl", "+", "T"] },
  { label: "shortcuts.deleteTab", keys: ["Ctrl", "+", "W"] },
  { label: "shortcuts.settings", keys: ["Ctrl", "+", ","] },
  { label: "shortcuts.rename", keys: ["F2"] },
  { label: "shortcuts.close", keys: ["Esc"] },
];

export function SettingsMenu({ onClose }: { onClose: () => void }) {
  const settings = useStore((s) => s.workspace?.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const tauri = useStore((s) => s.tauri);
  if (!settings) return null;
  const t = translator(settings.locale);

  const setTop = (alwaysOnTop: boolean) => {
    updateSettings({ alwaysOnTop });
    if (tauri) setAlwaysOnTop(alwaysOnTop).catch(() => {});
  };

  const setHotkey = (globalHotkey: string) => {
    const value = globalHotkey.trim() || undefined;
    updateSettings({ globalHotkey: value });
    // Re-register on the backend (desktop only); empty disables it.
    if (tauri) registerGlobalHotkey(value ?? "").catch(() => {});
  };

  const pomo = settings.pomodoro ?? DEFAULT_POMODORO;
  const setPomo = (key: keyof PomodoroConfig, raw: string) => {
    const n = Math.max(1, Math.floor(Number(raw) || 0));
    updateSettings({ pomodoro: { ...pomo, [key]: n } });
  };

  return (
    <div className="settings-menu rgl-cancel">
      <div className="settings-row">
        <span>{t("settings.theme")}</span>
        <select value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as Theme })}>
          <option value="light">{t("settings.theme.light")}</option>
          <option value="dark">{t("settings.theme.dark")}</option>
          <option value="system">{t("settings.theme.system")}</option>
        </select>
      </div>
      <div className="settings-row">
        <span>{t("settings.language")}</span>
        <select value={settings.locale} onChange={(e) => updateSettings({ locale: e.target.value as Locale })}>
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>
      </div>
      <label className="settings-row">
        <span>{t("settings.alwaysOnTop")}</span>
        <input type="checkbox" checked={settings.alwaysOnTop} onChange={(e) => setTop(e.target.checked)} />
      </label>
      <div className="settings-row">
        <span>{t("settings.defaultRemindBefore")}</span>
        <select
          value={settings.defaultRemindBefore ?? DEFAULT_REMIND_BEFORE}
          onChange={(e) => updateSettings({ defaultRemindBefore: Number(e.target.value) })}
        >
          {REMIND_BEFORE_PRESETS.map((m) => (
            <option key={m} value={m}>
              {remindLabel(m, t)}
            </option>
          ))}
        </select>
      </div>
      <label className="settings-row">
        <span>{t("settings.globalHotkey")}</span>
        <input
          type="text"
          className="settings-hotkey"
          value={settings.globalHotkey ?? ""}
          placeholder="CmdOrCtrl+Shift+Space"
          onChange={(e) => setHotkey(e.target.value)}
        />
      </label>
      <div className="settings-divider" />
      <div className="shortcuts-title">{t("settings.pomodoro")}</div>
      {POMO_FIELDS.map((f) => (
        <label className="settings-row" key={f.key}>
          <span>{t(f.label)}</span>
          <input
            type="number"
            className="settings-num"
            min={1}
            max={f.max}
            value={pomo[f.key]}
            onChange={(e) => setPomo(f.key, e.target.value)}
          />
        </label>
      ))}
      <div className="settings-divider" />
      <div className="shortcuts-help">
        <div className="shortcuts-title">{t("shortcuts.title")}</div>
        {SHORTCUTS.map((sc) => (
          <div className="shortcut-row" key={sc.label}>
            <span className="shortcut-action">{t(sc.label)}</span>
            <span className="shortcut-keys">
              {sc.keys.map((k, i) =>
                k === "+" || k === "/" ? (
                  <span key={i} className="shortcut-sep">
                    {k}
                  </span>
                ) : (
                  <kbd key={i}>{k}</kbd>
                ),
              )}
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="btn-ghost btn-small" onClick={onClose}>
        {t("common.close")}
      </button>
    </div>
  );
}
