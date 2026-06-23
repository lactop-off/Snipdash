import { useEffect, useState } from "react";
import { usePomodoro } from "../pomodoro";
import { useStore } from "../store";
import { translator } from "../i18n";
import { Icon } from "./Icon";

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export function PomodoroWidget() {
  const phase = usePomodoro((s) => s.phase);
  const remaining = usePomodoro((s) => s.remaining);
  const running = usePomodoro((s) => s.running);
  const completed = usePomodoro((s) => s.completed);
  const start = usePomodoro((s) => s.start);
  const pause = usePomodoro((s) => s.pause);
  const reset = usePomodoro((s) => s.reset);
  const skip = usePomodoro((s) => s.skip);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const [open, setOpen] = useState(false);

  // Drive the countdown once per second while running.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => usePomodoro.getState().tick(), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const phaseLabel = t(phase === "work" ? "pomo.work" : phase === "break" ? "pomo.break" : "pomo.longBreak");
  const toggle = () => (running ? pause() : start());

  return (
    <div className="popover-anchor">
      <div className={`pomo-chip ${phase}${running ? " running" : ""}`}>
        <button type="button" className="pomo-open" onClick={() => setOpen((o) => !o)} title={phaseLabel}>
          <span className="pomo-dot" />
          <span className="pomo-time">{fmt(remaining)}</span>
        </button>
        <button
          type="button"
          className="pomo-toggle"
          aria-label={running ? t("pomo.pause") : t("pomo.start")}
          onClick={toggle}
        >
          <Icon name={running ? "pause" : "play"} size={14} />
        </button>
      </div>
      {open && (
        <div className="menu pomo-menu" onMouseLeave={() => setOpen(false)}>
          <div className="pomo-phase">
            {phase !== "work" && <Icon name="coffee" size={14} />} {phaseLabel}
          </div>
          <div className="pomo-controls">
            <button type="button" onClick={toggle}>
              <Icon name={running ? "pause" : "play"} size={15} /> {running ? t("pomo.pause") : t("pomo.start")}
            </button>
            <button type="button" onClick={reset}>
              <Icon name="rotate-ccw" size={15} /> {t("pomo.reset")}
            </button>
            <button type="button" onClick={skip}>
              <Icon name="skip-forward" size={15} /> {t("pomo.skip")}
            </button>
          </div>
          <div className="pomo-count">
            {t("pomo.completed")}: {completed}
          </div>
        </div>
      )}
    </div>
  );
}
