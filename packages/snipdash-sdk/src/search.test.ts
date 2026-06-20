import { describe, expect, it } from "vitest";
import type { Workspace } from "./types";
import { fuzzyScore, searchWorkspace } from "./search";

describe("fuzzyScore", () => {
  it("scores substring > subsequence, rejects non-match, empty = 0", () => {
    expect(fuzzyScore("Hello World", "world")).not.toBeNull();
    expect(fuzzyScore("Hello World", "hlo")).not.toBeNull(); // subsequence
    expect(fuzzyScore("Hello", "xyz")).toBeNull();
    expect(fuzzyScore("anything", "")).toBe(0);
    expect(fuzzyScore("abc", "abc")!).toBeGreaterThan(fuzzyScore("a-b-c", "abc")!);
  });
});

const grid = { cols: 12, rowHeight: 40, gap: 8 };

function ws(): Workspace {
  return {
    schemaVersion: 2,
    settings: { theme: "system", alwaysOnTop: false, activeBoardId: "b1", locale: "ja" },
    boards: [
      {
        id: "b1",
        name: "営業",
        order: 0,
        grid,
        cards: [
          {
            id: "c1",
            type: "text",
            layout: { x: 0, y: 0, w: 4, h: 4 },
            label: "署名",
            payload: { body: "お世話になっております", copyFormat: "plain" },
          },
          {
            id: "c2",
            type: "rich",
            layout: { x: 0, y: 0, w: 4, h: 4 },
            label: "コード",
            payload: { mode: "code", language: "bash", source: "git switch -c feat" },
          },
        ],
      },
      { id: "b2", name: "開発", order: 1, grid, cards: [] },
    ],
  };
}

describe("searchWorkspace", () => {
  it("matches cards by label and body, boards by name, with copyable flag", () => {
    const w = ws();
    expect(searchWorkspace(w, "署名").some((h) => h.kind === "card" && h.id === "c1")).toBe(true);
    expect(searchWorkspace(w, "git switch").find((h) => h.kind === "card")?.id).toBe("c2"); // body hit
    expect(searchWorkspace(w, "開発").some((h) => h.kind === "board" && h.id === "b2")).toBe(true);
    const c1 = searchWorkspace(w, "署名").find((h) => h.id === "c1");
    expect(c1 && c1.kind === "card" && c1.copyable).toBe(true);
    expect(searchWorkspace(w, "").length).toBeGreaterThanOrEqual(2); // empty = everything
  });
});
