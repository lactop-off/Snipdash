import { useEffect } from "react";
import { useStore } from "./store";
import { applyTheme } from "./theme";
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

  return (
    <>
      {loaded ? <AppShell /> : <div className="loading">Loading…</div>}
      <ToastView />
    </>
  );
}
