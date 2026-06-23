import { useEffect } from "react";
import { useStore } from "./store";
import { applyTheme } from "./theme";
import { initNotifications } from "./notify";
import { startReminderScheduler } from "./reminders";
import { AppShell } from "./components/AppShell";
import { ToastView } from "./components/ToastView";

export default function App() {
  const init = useStore((s) => s.init);
  const loaded = useStore((s) => s.loaded);
  const theme = useStore((s) => s.workspace?.settings.theme);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (theme) applyTheme(theme);
  }, [theme]);

  // Reminder delivery: ask for OS notification permission once the workspace is
  // loaded, then run the periodic due-date sweep for its lifetime.
  useEffect(() => {
    if (!loaded) return;
    void initNotifications();
    return startReminderScheduler();
  }, [loaded]);

  return (
    <>
      {loaded ? <AppShell /> : <div className="loading">Loading…</div>}
      <ToastView />
    </>
  );
}
