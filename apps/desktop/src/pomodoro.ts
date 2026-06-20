/**
 * Pomodoro timer — an ephemeral zustand store (its running state is never
 * persisted to `workspace.json`; only the durations in `Settings.pomodoro`
 * are). The widget drives `tick()` once per second while `running`.
 */
import { create } from "zustand";
import { DEFAULT_POMODORO, type PomodoroConfig } from "@snipdash/sdk";
import { notify } from "./notify";
import { translator } from "./i18n";
import { useStore } from "./store";

export type Phase = "work" | "break" | "longBreak";

interface PomoState {
  phase: Phase;
  remaining: number; // seconds
  running: boolean;
  completed: number; // completed work intervals
  config: PomodoroConfig;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  setConfig: (config: PomodoroConfig) => void;
}

const secondsOf = (phase: Phase, c: PomodoroConfig) =>
  (phase === "work" ? c.workMin : phase === "break" ? c.breakMin : c.longBreakMin) * 60;

/** Phase that follows `phase` given the completed work count. */
function nextPhase(phase: Phase, completed: number, c: PomodoroConfig): Phase {
  if (phase !== "work") return "work";
  return completed % c.longBreakEvery === 0 ? "longBreak" : "break";
}

function notifyPhaseEnd(ended: Phase) {
  const locale = useStore.getState().workspace?.settings.locale ?? "ja";
  const t = translator(locale);
  void notify(t("pomo.title"), t(ended === "work" ? "pomo.notify.workEnd" : "pomo.notify.breakEnd"));
}

export const usePomodoro = create<PomoState>((set, get) => ({
  phase: "work",
  remaining: DEFAULT_POMODORO.workMin * 60,
  running: false,
  completed: 0,
  config: DEFAULT_POMODORO,

  start: () => set({ running: true }),
  pause: () => set({ running: false }),
  reset: () => set((s) => ({ remaining: secondsOf(s.phase, s.config), running: false })),

  skip: () =>
    set((s) => {
      const completed = s.phase === "work" ? s.completed + 1 : s.completed;
      const phase = nextPhase(s.phase, completed, s.config);
      return { phase, completed, remaining: secondsOf(phase, s.config) };
    }),

  tick: () => {
    const s = get();
    if (!s.running) return;
    if (s.remaining > 1) {
      set({ remaining: s.remaining - 1 });
      return;
    }
    // Reached zero: advance to the next phase and auto-continue, then notify.
    const ended = s.phase;
    const completed = ended === "work" ? s.completed + 1 : s.completed;
    const phase = nextPhase(ended, completed, s.config);
    set({ phase, completed, remaining: secondsOf(phase, s.config), running: true });
    notifyPhaseEnd(ended);
  },

  setConfig: (config) =>
    set((s) =>
      // Apply new durations to the current phase only while stopped; a running
      // timer keeps counting and picks up new durations on the next phase.
      s.running ? { config } : { config, remaining: secondsOf(s.phase, config) },
    ),
}));

// Expose the store in dev so tests can drive the timer without waiting minutes.
const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
if (dev) {
  (window as unknown as { __pomo?: typeof usePomodoro }).__pomo = usePomodoro;
}
