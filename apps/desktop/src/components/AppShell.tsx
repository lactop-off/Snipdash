import { useState } from "react";
import { createLauncherCard, createRichCard, createTextCard } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { BoardTabs } from "./BoardTabs";
import { GridCanvas } from "./GridCanvas";
import { SettingsMenu } from "./SettingsMenu";

export function AppShell() {
  const mode = useStore((s) => s.mode);
  const toggleMode = useStore((s) => s.toggleMode);
  const addCard = useStore((s) => s.addCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const edit = mode === "edit";

  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const add = (factory: () => Parameters<typeof addCard>[0]) => {
    addCard(factory());
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="brand">Snipdash</div>
        <BoardTabs edit={edit} />
        <div className="toolbar-spacer" />

        {edit && (
          <div className="popover-anchor">
            <button type="button" className="btn-ghost" onClick={() => setMenuOpen((o) => !o)}>
              ＋ {t("card.add")}
            </button>
            {menuOpen && (
              <ul className="menu" onMouseLeave={() => setMenuOpen(false)}>
                <li>
                  <button type="button" onClick={() => add(() => createTextCard())}>{t("card.addText")}</button>
                </li>
                <li>
                  <button type="button" onClick={() => add(() => createLauncherCard())}>{t("card.addLauncher")}</button>
                </li>
                <li>
                  <button type="button" onClick={() => add(() => createRichCard("markdown"))}>{t("card.addMarkdown")}</button>
                </li>
                <li>
                  <button type="button" onClick={() => add(() => createRichCard("code"))}>{t("card.addCode")}</button>
                </li>
                <li>
                  <button type="button" onClick={() => add(() => createRichCard("todo"))}>{t("card.addTodo")}</button>
                </li>
              </ul>
            )}
          </div>
        )}

        <button
          type="button"
          className={`btn-mode${edit ? " on" : ""}`}
          onClick={toggleMode}
          title={edit ? t("mode.toggleToUse") : t("mode.toggleToEdit")}
        >
          {edit ? `🔓 ${t("mode.edit")}` : `🔒 ${t("mode.use")}`}
        </button>

        <div className="popover-anchor">
          <button type="button" className="btn-ghost" onClick={() => setSettingsOpen((o) => !o)} title={t("settings.title")}>
            ⚙
          </button>
          {settingsOpen && <SettingsMenu onClose={() => setSettingsOpen(false)} />}
        </div>
      </header>

      <GridCanvas edit={edit} />
    </div>
  );
}
