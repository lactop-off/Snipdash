import { create } from "zustand";
import {
  type Board,
  type Card,
  type CardLayout,
  type Settings,
  type Workspace,
  createBoard,
  loadWorkspace,
  saveWorkspace,
} from "@snipdash/sdk";
import { toast } from "./toast";
import { translator } from "./i18n";
import { sampleWorkspace } from "./sample";

export type Mode = "use" | "edit";

/** Minimal shape of a react-grid-layout item we read back on layout change. */
export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface AppState {
  workspace: Workspace | null;
  mode: Mode;
  loaded: boolean;
  /** True when the Tauri backend is available (so changes persist). */
  tauri: boolean;

  init: () => Promise<void>;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;

  setActiveBoard: (id: string) => void;
  addBoard: () => void;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  reorderBoards: (orderedIds: string[]) => void;

  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  applyLayout: (items: LayoutItem[]) => void;

  updateSettings: (partial: Partial<Settings>) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(get: () => AppState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { workspace, tauri } = get();
    if (!workspace || !tauri) return;
    const t = translator(workspace.settings.locale);
    saveWorkspace(workspace).catch((e: unknown) => {
      const msg = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
      toast.error(t("toast.saveError") + msg);
    });
  }, 400);
}

function activeBoardOf(ws: Workspace): Board | undefined {
  return ws.boards.find((b) => b.id === ws.settings.activeBoardId);
}

/** Find a non-overlapping placement at the bottom of the active board. */
function nextPlacement(board: Board): Pick<CardLayout, "x" | "y"> {
  const bottom = board.cards.reduce((max, c) => Math.max(max, c.layout.y + c.layout.h), 0);
  return { x: 0, y: bottom };
}

export const useStore = create<AppState>((set, get) => {
  // Helper: mutate the workspace immutably and schedule a save.
  const commit = (mutate: (ws: Workspace) => Workspace) => {
    const ws = get().workspace;
    if (!ws) return;
    const next = mutate(structuredClone(ws));
    set({ workspace: next });
    scheduleSave(get);
  };

  const mutateActiveBoard = (fn: (board: Board) => void) =>
    commit((ws) => {
      const board = activeBoardOf(ws);
      if (board) fn(board);
      return ws;
    });

  return {
    workspace: null,
    mode: "use",
    loaded: false,
    tauri: true,

    init: async () => {
      try {
        const ws = await loadWorkspace();
        ensureAtLeastOneBoard(ws);
        set({ workspace: ws, loaded: true, tauri: true });
      } catch {
        // Outside Tauri (browser demo): fall back to an in-memory sample.
        const ws = sampleWorkspace();
        set({ workspace: ws, loaded: true, tauri: false });
        const t = translator(ws.settings.locale);
        toast.info(t("toast.demoMode"));
      }
    },

    setMode: (mode) => set({ mode }),
    toggleMode: () => set((s) => ({ mode: s.mode === "use" ? "edit" : "use" })),

    setActiveBoard: (id) =>
      commit((ws) => {
        if (ws.boards.some((b) => b.id === id)) ws.settings.activeBoardId = id;
        return ws;
      }),

    addBoard: () =>
      commit((ws) => {
        const board = createBoard(translator(ws.settings.locale)("board.newName"), ws.boards.length);
        ws.boards.push(board);
        ws.settings.activeBoardId = board.id;
        return ws;
      }),

    renameBoard: (id, name) =>
      commit((ws) => {
        const board = ws.boards.find((b) => b.id === id);
        if (board) board.name = name;
        return ws;
      }),

    deleteBoard: (id) =>
      commit((ws) => {
        ws.boards = ws.boards.filter((b) => b.id !== id);
        ws.boards.forEach((b, i) => (b.order = i));
        if (ws.boards.length === 0) {
          const board = createBoard(translator(ws.settings.locale)("board.newName"), 0);
          ws.boards.push(board);
        }
        if (!ws.boards.some((b) => b.id === ws.settings.activeBoardId)) {
          ws.settings.activeBoardId = ws.boards[0]!.id;
        }
        return ws;
      }),

    reorderBoards: (orderedIds) =>
      commit((ws) => {
        const byId = new Map(ws.boards.map((b) => [b.id, b]));
        const reordered: Board[] = [];
        orderedIds.forEach((id, i) => {
          const b = byId.get(id);
          if (b) {
            b.order = i;
            reordered.push(b);
          }
        });
        // Keep any boards not present in orderedIds (defensive).
        ws.boards.forEach((b) => {
          if (!orderedIds.includes(b.id)) reordered.push(b);
        });
        ws.boards = reordered;
        return ws;
      }),

    addCard: (card) =>
      mutateActiveBoard((board) => {
        const place = nextPlacement(board);
        card.layout = { ...card.layout, x: place.x, y: place.y };
        board.cards.push(card);
      }),

    updateCard: (card) =>
      mutateActiveBoard((board) => {
        const idx = board.cards.findIndex((c) => c.id === card.id);
        if (idx >= 0) board.cards[idx] = card;
      }),

    removeCard: (cardId) =>
      mutateActiveBoard((board) => {
        board.cards = board.cards.filter((c) => c.id !== cardId);
      }),

    applyLayout: (items) =>
      mutateActiveBoard((board) => {
        const byId = new Map(items.map((it) => [it.i, it]));
        board.cards.forEach((c) => {
          const it = byId.get(c.id);
          if (it) c.layout = { x: it.x, y: it.y, w: it.w, h: it.h };
        });
      }),

    updateSettings: (partial) =>
      commit((ws) => {
        ws.settings = { ...ws.settings, ...partial };
        return ws;
      }),
  };
});

function ensureAtLeastOneBoard(ws: Workspace): void {
  if (ws.boards.length === 0) {
    ws.boards.push(createBoard("業務定型", 0));
  }
  if (!ws.boards.some((b) => b.id === ws.settings.activeBoardId)) {
    ws.settings.activeBoardId = ws.boards[0]!.id;
  }
}

/** Selector: the currently active board. */
export function useActiveBoard(): Board | undefined {
  return useStore((s) => (s.workspace ? activeBoardOf(s.workspace) : undefined));
}
