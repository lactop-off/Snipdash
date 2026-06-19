import { describe, it, expect } from "vitest";
import { resolveTemplate } from "./template";

// A fixed instant for deterministic assertions: 2026-06-19 09:05:07 local.
const NOW = new Date(2026, 5, 19, 9, 5, 7);

describe("resolveTemplate", () => {
  it("expands TODAY with the default format", () => {
    const { text, unknownVars } = resolveTemplate("d: {{TODAY}}", { now: NOW });
    expect(text).toBe("d: 2026-06-19");
    expect(unknownVars).toEqual([]);
  });

  it("supports custom date formats including ones with colons", () => {
    expect(resolveTemplate("{{TODAY:YYYY/MM/DD}}", { now: NOW }).text).toBe("2026/06/19");
    expect(resolveTemplate("{{NOW:HH:mm:ss}}", { now: NOW }).text).toBe("09:05:07");
    expect(resolveTemplate("{{TODAY:YYYY年M月D日}}", { now: NOW }).text).toBe("2026年6月19日");
  });

  it("expands NOW, TIME and numeric parts", () => {
    expect(resolveTemplate("{{NOW}}", { now: NOW }).text).toBe("2026-06-19 09:05");
    expect(resolveTemplate("{{TIME}}", { now: NOW }).text).toBe("09:05");
    expect(resolveTemplate("{{YEAR}}-{{MONTH}}-{{DAY}}", { now: NOW }).text).toBe("2026-6-19");
  });

  it("is case-insensitive on the variable name", () => {
    expect(resolveTemplate("{{today}}", { now: NOW }).text).toBe("2026-06-19");
  });

  it("uses one instant for repeated time tokens", () => {
    const { text } = resolveTemplate("{{NOW}} / {{NOW}}", { now: NOW });
    const [a, b] = text.split(" / ");
    expect(a).toBe(b);
  });

  it("gives a single id to repeated identical UUID tokens", () => {
    const { text } = resolveTemplate("{{UUID}} {{UUID}}", { uuid: makeCounter() });
    const [a, b] = text.split(" ");
    expect(a).toBe(b);
    expect(a).toBe("id-1");
  });

  it("generates a uuid for UUID tokens", () => {
    const { text } = resolveTemplate("{{UUID}}", {});
    expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("leaves unknown variables untouched and reports them", () => {
    const { text, unknownVars } = resolveTemplate("hi {{FOO}} {{BAR}}", { now: NOW });
    expect(text).toBe("hi {{FOO}} {{BAR}}");
    expect(unknownVars.sort()).toEqual(["BAR", "FOO"]);
  });

  it("treats \\{{ as a literal opener and does not expand", () => {
    const { text, unknownVars } = resolveTemplate("\\{{TODAY}}", { now: NOW });
    expect(text).toBe("{{TODAY}}");
    expect(unknownVars).toEqual([]);
  });

  it("handles surrounding text and multiple variables", () => {
    const { text } = resolveTemplate("受付: {{TODAY}} 締切: {{YEAR}}年", { now: NOW });
    expect(text).toBe("受付: 2026-06-19 締切: 2026年");
  });

  it("returns input unchanged when there are no tokens", () => {
    const { text, unknownVars } = resolveTemplate("plain text", {});
    expect(text).toBe("plain text");
    expect(unknownVars).toEqual([]);
  });
});

function makeCounter(): () => string {
  let n = 0;
  return () => `id-${++n}`;
}
