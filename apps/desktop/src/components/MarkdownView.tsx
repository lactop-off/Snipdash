import { useEffect, useMemo, useRef } from "react";
import type { RichCard } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { copyResolved, openLauncher } from "../actions";
import { renderMarkdown, listItemKey } from "./markdown";
import { TemplateEditor } from "./TemplateEditor";

export function MarkdownView({ card, source, edit }: { card: RichCard; source: string; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const bodyRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => renderMarkdown(source), [source]);

  // Persisted set of collapsed toggle-list items (index-path keys).
  const collapsed = card.payload.mode === "markdown" ? card.payload.collapsed ?? [] : [];
  const collapsedKey = collapsed.join("|");

  const setSource = (next: string) =>
    updateCard({ ...card, payload: { mode: "markdown", source: next, collapsed } });
  const setCollapsed = (next: string[]) =>
    updateCard({ ...card, payload: { mode: "markdown", source, collapsed: next } });

  // After each render, turn list items that contain a nested list into
  // collapsible toggles, and apply the persisted collapsed state.
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const collapsedSet = new Set(collapsed);
    root.querySelectorAll("li").forEach((li) => {
      const hasChildList = Array.from(li.children).some(
        (c) => c.tagName === "UL" || c.tagName === "OL",
      );
      if (!hasChildList) return;
      li.classList.add("md-has-children");
      if (!li.querySelector(":scope > .md-toggle")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "md-toggle rgl-cancel";
        btn.setAttribute("aria-label", "toggle");
        li.insertBefore(btn, li.firstChild);
      }
      li.classList.toggle("md-collapsed", collapsedSet.has(listItemKey(li, root)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, collapsedKey]);

  // Delegate clicks inside the rendered body: copy buttons, collapse toggles,
  // and links (routed through the backend opener instead of webview navigation).
  const onBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const copyBtn = target.closest(".md-copy-btn");
    if (copyBtn) {
      e.preventDefault();
      void copyResolved(copyBtn.getAttribute("data-copy") ?? "", locale);
      return;
    }
    const toggle = target.closest(".md-toggle");
    if (toggle) {
      e.preventDefault();
      const li = toggle.parentElement;
      const root = bodyRef.current;
      if (!li || !root) return;
      const nowCollapsed = li.classList.toggle("md-collapsed");
      const key = listItemKey(li, root);
      const set = new Set(collapsed);
      if (nowCollapsed) set.add(key);
      else set.delete(key);
      setCollapsed([...set]);
      return;
    }
    const anchor = target.closest("a");
    if (anchor) {
      e.preventDefault();
      const href = anchor.getAttribute("href");
      if (href) {
        // URLs open in the browser/mail client; anything else is treated as a
        // local path and opened by the OS (folder → file manager, file → its
        // default app, executable → launch).
        const kind = /^(https?:|mailto:)/i.test(href) ? "url" : "file";
        void openLauncher(kind, href, locale);
      }
    }
  };

  if (edit) {
    return (
      <div className="card-content markdown-card">
        <TemplateEditor value={source} onChange={setSource} markdown placeholder="# Markdown…" />
      </div>
    );
  }

  const empty = source.trim().length === 0;
  return (
    <div className="card-content markdown-card">
      <div
        ref={bodyRef}
        className="markdown-body"
        onClick={onBodyClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="card-toolbar">
        <button
          type="button"
          className="rgl-cancel btn-primary"
          disabled={empty}
          onClick={() => copyResolved(source, locale)}
        >
          {t("card.copy")}
        </button>
      </div>
    </div>
  );
}
