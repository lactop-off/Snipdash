import type { Locale, Theme } from "@snipdash/sdk";
import { setAlwaysOnTop } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";

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
      <button type="button" className="btn-ghost btn-small" onClick={onClose}>
        {t("common.close")}
      </button>
    </div>
  );
}
