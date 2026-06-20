import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_POMODORO,
  collectDueItems,
  createRichCard,
  createSpacerCard,
  createTextCard,
  dueCount,
} from "@snipdash/sdk";
import { useStore } from "../store";
import { usePomodoro } from "../pomodoro";
import { translator } from "../i18n";
import { BoardTabs } from "./BoardTabs";
import { GridCanvas } from "./GridCanvas";
import { TodayPanel } from "./TodayPanel";
import { CommandPalette, type PaletteCommand } from "./CommandPalette";
import { QuickCapture } from "./QuickCapture";
import { PomodoroWidget } from "./PomodoroWidget";
import { SettingsMenu } from "./SettingsMenu";
import { Icon } from "./Icon";

export function AppShell() {
  const mode = useStore((s) => s.mode);
  const toggleMode = useStore((s) => s.toggleMode);
  const setMode = useStore((s) => s.setMode);
  const addCard = useStore((s) => s.addCard);
  const tauri = useStore((s) => s.tauri);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const edit = mode === "edit";

  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  // Global-hotkey quick capture (desktop only): the Rust side shows/focuses the
  // window and emits "quick-capture"; here we open the capture modal.
  useEffect(() => {
    if (!tauri) return;
    let un: (() => void) | undefined;
    import("@tauri-apps/api/event")
      .then(({ listen }) =>
        listen("quick-capture", () => setCaptureOpen(true)).then((u) => {
          un = u;
        }),
      )
      .catch(() => {});
    return () => un?.();
  }, [tauri]);

  const workspace = useStore((s) => s.workspace);
  const dueN = useMemo(
    () => (workspace ? dueCount(collectDueItems(workspace, Date.now())) : 0),
    [workspace],
  );

  // Keep the (ephemeral) Pomodoro timer's durations in sync with saved settings.
  const pomoCfg = workspace?.settings.pomodoro;
  useEffect(() => {
    usePomodoro.getState().setConfig(pomoCfg ?? DEFAULT_POMODORO);
  }, [pomoCfg]);

  // Commands surfaced in the Ctrl+K palette (app actions the palette can't reach itself).
  const commands = useMemo<PaletteCommand[]>(() => {
    const addAndEdit = (factory: () => Parameters<typeof addCard>[0]) => {
      setMode("edit");
      addCard(factory());
    };
    return [
      { id: "toggle-edit", title: t("cmd.toggleEdit"), icon: "pencil", keywords: "edit mode 編集 使用", run: toggleMode },
      { id: "open-today", title: t("cmd.openToday"), icon: "calendar-check", keywords: "today 今日 task due 期限", run: () => setTodayOpen(true) },
      { id: "quick-capture", title: t("cmd.quickCapture"), icon: "inbox", keywords: "capture inbox キャプチャ メモ タスク 追加", run: () => setCaptureOpen(true) },
      { id: "open-settings", title: t("cmd.openSettings"), icon: "settings", keywords: "settings 設定 theme", run: () => setSettingsOpen(true) },
      { id: "add-text", title: t("cmd.addText"), icon: "file-text", keywords: "add card text テキスト 追加", run: () => addAndEdit(createTextCard) },
      { id: "add-markdown", title: t("cmd.addMarkdown"), icon: "file-text", keywords: "markdown md 追加", run: () => addAndEdit(() => createRichCard("markdown")) },
      { id: "add-code", title: t("cmd.addCode"), icon: "code", keywords: "code コード 追加", run: () => addAndEdit(() => createRichCard("code")) },
      { id: "add-todo", title: t("cmd.addTodo"), icon: "list-todo", keywords: "todo task タスク 追加", run: () => addAndEdit(() => createRichCard("todo")) },
    ];
  }, [t, toggleMode, setMode, addCard]);

  const add = (factory: () => Parameters<typeof addCard>[0]) => {
    addCard(factory());
    setMenuOpen(false);
  };

  // Keyboard shortcuts (read live state via getState so the listener is stable):
  //  - Esc                                   : close open menus / popovers
  //  - Ctrl/Cmd + PageUp / PageDown          : previous / next tab (wraps around)
  //  - Ctrl/Cmd + 1..9 (main row or numpad)  : jump to the Nth tab from the left
  //  - Ctrl/Cmd + E                          : toggle edit / use mode
  //  - Ctrl/Cmd + T                          : add a new tab
  //  - Ctrl/Cmd + W                          : delete the current tab (confirm)
  //  - Ctrl/Cmd + ,                          : toggle the settings menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Esc closes whatever popover is open (no modifier required).
      if (e.key === "Escape") {
        setMenuOpen(false);
        setSettingsOpen(false);
        setTodayOpen(false);
        setPaletteOpen(false);
        setCaptureOpen(false);
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      const s = useStore.getState();
      const boards = [...(s.workspace?.boards ?? [])].sort((a, b) => a.order - b.order);
      const activeId = s.workspace?.settings.activeBoardId;
      const idx = boards.findIndex((b) => b.id === activeId);

      if (e.key === "PageDown" && boards.length) {
        e.preventDefault();
        s.setActiveBoard(boards[(idx + 1 + boards.length) % boards.length]!.id);
        return;
      }
      if (e.key === "PageUp" && boards.length) {
        e.preventDefault();
        s.setActiveBoard(boards[(idx - 1 + boards.length) % boards.length]!.id);
        return;
      }
      // Match both the number row (Digit1..9) and the numpad (Numpad1..9),
      // regardless of NumLock — using `code` reflects the physical key.
      const m = e.code.match(/^(?:Digit|Numpad)([1-9])$/);
      if (m) {
        const target = boards[Number(m[1]) - 1];
        if (target) {
          e.preventDefault();
          s.setActiveBoard(target.id);
        }
        return;
      }

      switch (e.code) {
        case "KeyK":
          e.preventDefault();
          setPaletteOpen((o) => !o);
          return;
        case "KeyE":
          e.preventDefault();
          s.toggleMode();
          return;
        case "KeyT":
          e.preventDefault();
          s.addBoard();
          return;
        case "KeyW": {
          e.preventDefault();
          if (!activeId) return;
          const loc = s.workspace?.settings.locale ?? "ja";
          if (window.confirm(translator(loc)("board.deleteConfirm"))) s.deleteBoard(activeId);
          return;
        }
        case "Comma":
          e.preventDefault();
          setSettingsOpen((o) => !o);
          return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-shell">
      <header className="toolbar">
        <div className="brand">Snipdash</div>
        <BoardTabs edit={edit} />
        <div className="toolbar-spacer" />

        {edit && (
          <div className="popover-anchor">
            <button type="button" className="btn-ghost btn-icon" onClick={() => setMenuOpen((o) => !o)}>
              <Icon name="plus" size={16} /> {t("card.add")}
            </button>
            {menuOpen && (
              <ul className="menu" onMouseLeave={() => setMenuOpen(false)}>
                <li>
                  <button type="button" onClick={() => add(() => createTextCard())}>{t("card.addText")}</button>
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
                <li>
                  <button type="button" onClick={() => add(() => createSpacerCard())}>{t("card.addSpacer")}</button>
                </li>
              </ul>
            )}
          </div>
        )}

        <PomodoroWidget />

        <button
          type="button"
          className={`btn-ghost today-toggle${dueN > 0 ? " has-due" : ""}${todayOpen ? " on" : ""}`}
          onClick={() => setTodayOpen((o) => !o)}
          title={t("today.open")}
          aria-label={t("today.open")}
          aria-expanded={todayOpen}
        >
          <Icon name="calendar-check" size={18} />
          {dueN > 0 && <span className="today-badge">{dueN}</span>}
        </button>

        <button
          type="button"
          className={`btn-mode${edit ? " on" : ""}`}
          onClick={toggleMode}
          title={edit ? t("mode.toggleToUse") : t("mode.toggleToEdit")}
          aria-label={edit ? t("mode.toggleToUse") : t("mode.toggleToEdit")}
          aria-pressed={edit}
        >
          <Icon name="pencil" size={17} />
        </button>

        <div className="popover-anchor">
          <button type="button" className="btn-ghost" onClick={() => setSettingsOpen((o) => !o)} title={t("settings.title")} aria-label={t("settings.title")}>
            <Icon name="settings" size={18} />
          </button>
          {settingsOpen && <SettingsMenu onClose={() => setSettingsOpen(false)} />}
        </div>
      </header>

      <div className="app-body">
        <GridCanvas edit={edit} />
        <TodayPanel open={todayOpen} onClose={() => setTodayOpen(false)} />
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}
