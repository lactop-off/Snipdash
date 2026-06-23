import { describe, it, expect } from "vitest";
import { createSpacerCard, copyableText } from "./factory";
import { searchWorkspace } from "./search";
import type { Workspace } from "./types";

describe("createSpacerCard", () => {
  it("starts empty and body-only, with a valid grid size", () => {
    const card = createSpacerCard();
    expect(card.type).toBe("spacer");
    expect(card.payload.text).toBe("");
    expect(card.label).toBeUndefined();
    // Must clear the validator's minimum card size (2x2).
    expect(card.layout.w).toBeGreaterThanOrEqual(2);
    expect(card.layout.h).toBeGreaterThanOrEqual(2);
  });

  it("generates a fresh id each time and honors layout overrides", () => {
    const a = createSpacerCard();
    const b = createSpacerCard({ w: 6, h: 3 });
    expect(a.id).not.toBe(b.id);
    expect(b.layout.w).toBe(6);
    expect(b.layout.h).toBe(3);
  });

  it("is not copyable (decorative, not a snippet)", () => {
    expect(copyableText(createSpacerCard())).toBeNull();
  });
});

describe("searchWorkspace with a spacer", () => {
  const ws: Workspace = {
    schemaVersion: 2,
    settings: { theme: "system", alwaysOnTop: false, activeBoardId: "b1", locale: "ja" },
    boards: [
      {
        id: "b1",
        name: "Board",
        order: 0,
        grid: { cols: 12, rowHeight: 40, gap: 8 },
        cards: [{ ...createSpacerCard(), id: "sp", payload: { text: "週次レビュー" } }],
      },
    ],
  };

  it("matches a filled spacer by its text and tags it as a spacer", () => {
    const hits = searchWorkspace(ws, "週次");
    const hit = hits.find((h) => h.kind === "card" && h.id === "sp");
    expect(hit).toBeTruthy();
    if (hit && hit.kind === "card") {
      expect(hit.cardType).toBe("spacer");
      expect(hit.copyable).toBe(false);
      expect(hit.title).toContain("週次レビュー");
    }
  });
});
