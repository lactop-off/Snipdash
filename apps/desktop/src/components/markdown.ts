import MarkdownIt from "markdown-it";

// html:false keeps raw HTML out, so rendering via innerHTML is safe.
// linkify turns bare URLs into <a>; standard [label](url) links render too.
export const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

// Custom inline extension: [[copy]] or [[display|copy]] renders the text with a
// small copy button. The raw copy text (variables unexpanded) is stashed on the
// button; MarkdownView expands {{...}} and writes it to the clipboard on click.
md.inline.ruler.before("link", "copytag", (state, silent) => {
  const src = state.src;
  const start = state.pos;
  // require an opening "[["
  if (src.charCodeAt(start) !== 0x5b || src.charCodeAt(start + 1) !== 0x5b) return false;
  const end = src.indexOf("]]", start + 2);
  if (end < 0) return false;
  const content = src.slice(start + 2, end);
  if (content.length === 0) return false;
  if (!silent) {
    const token = state.push("copytag", "", 0);
    token.content = content;
  }
  state.pos = end + 2;
  return true;
});

md.renderer.rules.copytag = (tokens, idx) => {
  const content = tokens[idx]!.content;
  const sep = content.indexOf("|");
  const display = sep >= 0 ? content.slice(0, sep) : content;
  const copy = sep >= 0 ? content.slice(sep + 1) : content;
  const esc = md.utils.escapeHtml;
  return (
    `<span class="md-copy">` +
    `<code class="md-copy-text">${esc(display)}</code>` +
    `<button type="button" class="md-copy-btn rgl-cancel" data-copy="${esc(copy)}" title="コピー" aria-label="コピー">⧉</button>` +
    `</span>`
  );
};

// Image size extension: ![alt|WIDTH](src), ![alt|WIDTHxHEIGHT](src) or
// ![alt|xHEIGHT](src). Standard ![alt](src) still works (no size).
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]!;
  const altText = self.renderInlineAsText(token.children ?? [], options, env);
  let alt = altText;
  const sep = altText.lastIndexOf("|");
  if (sep >= 0) {
    const size = altText.slice(sep + 1).trim();
    const m = size.match(/^(\d+)?(?:x(\d+))?$/i);
    if (m && (m[1] || m[2])) {
      alt = altText.slice(0, sep);
      if (m[1]) token.attrSet("width", m[1]);
      if (m[2]) token.attrSet("height", m[2]);
    }
  }
  token.attrSet("alt", alt);
  token.attrSet("loading", "lazy");
  return self.renderToken(tokens, idx, options);
};

export function renderMarkdown(source: string): string {
  return md.render(source);
}

/**
 * Index-path key of a list item within the rendered markdown body (e.g. "0/1").
 * Used to persist which toggle-list items are collapsed.
 */
export function listItemKey(li: Element, root: Element): string {
  const parts: number[] = [];
  let node: Element | null = li;
  while (node && node !== root) {
    if (node.tagName === "LI" && node.parentElement) {
      const sibs = Array.from(node.parentElement.children).filter((c) => c.tagName === "LI");
      parts.unshift(sibs.indexOf(node));
    }
    node = node.parentElement;
  }
  return parts.join("/");
}
