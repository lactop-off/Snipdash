import { useMemo, useRef, useState } from "react";
import { TEMPLATE_VARIABLES } from "@snipdash/sdk";

type Ref = React.RefObject<HTMLTextAreaElement | null>;

/** Wrap the current selection (or insert a placeholder) with `before`/`after`. */
function surround(ref: Ref, value: string, onChange: (v: string) => void, before: string, after: string, placeholder = "") {
  const ta = ref.current;
  if (!ta) return;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const sel = value.slice(s, e) || placeholder;
  onChange(value.slice(0, s) + before + sel + after + value.slice(e));
  requestAnimationFrame(() => {
    ta.focus();
    ta.selectionStart = s + before.length;
    ta.selectionEnd = s + before.length + sel.length;
  });
}

/** Prefix the start of the caret's line (headings, lists, quotes). */
function prefixLine(ref: Ref, value: string, onChange: (v: string) => void, prefix: string) {
  const ta = ref.current;
  if (!ta) return;
  const s = ta.selectionStart;
  const lineStart = value.lastIndexOf("\n", s - 1) + 1;
  onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
  requestAnimationFrame(() => {
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + prefix.length;
  });
}

export function TemplateEditor({
  value,
  onChange,
  markdown = false,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  markdown?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Variable autocomplete state: the partial name typed after an open "{{".
  const [ac, setAc] = useState<{ query: string; index: number } | null>(null);

  const matches = useMemo(() => {
    if (!ac) return [];
    const q = ac.query.toLowerCase();
    return TEMPLATE_VARIABLES.filter((v) => v.token.slice(2, -2).toLowerCase().includes(q));
  }, [ac]);

  const refreshAc = (v: string, caret: number) => {
    const before = v.slice(0, caret);
    const m = before.match(/\{\{\s*([A-Za-z0-9_]*)$/);
    setAc(m ? { query: m[1] ?? "", index: 0 } : null);
  };

  const acceptVar = (token: string) => {
    const ta = ref.current;
    if (!ta) return;
    const caret = ta.selectionStart;
    const bracePos = value.lastIndexOf("{{", caret);
    if (bracePos < 0) return;
    const next = value.slice(0, bracePos) + token + value.slice(caret);
    onChange(next);
    setAc(null);
    const pos = bracePos + token.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = pos;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!ac || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAc({ ...ac, index: (ac.index + 1) % matches.length });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAc({ ...ac, index: (ac.index - 1 + matches.length) % matches.length });
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      acceptVar(matches[ac.index]!.token);
    } else if (e.key === "Escape") {
      setAc(null);
    }
  };

  const tools: { label: string; title: string; run: () => void }[] = [
    { label: "B", title: "太字", run: () => surround(ref, value, onChange, "**", "**", "太字") },
    { label: "i", title: "斜体", run: () => surround(ref, value, onChange, "*", "*", "斜体") },
    { label: "H1", title: "見出し1", run: () => prefixLine(ref, value, onChange, "# ") },
    { label: "H2", title: "見出し2", run: () => prefixLine(ref, value, onChange, "## ") },
    { label: "•", title: "箇条書き", run: () => prefixLine(ref, value, onChange, "- ") },
    { label: "❝", title: "引用", run: () => prefixLine(ref, value, onChange, "> ") },
    { label: "</>", title: "コード", run: () => surround(ref, value, onChange, "`", "`", "code") },
    { label: "🔗", title: "リンク", run: () => surround(ref, value, onChange, "[", "](https://)", "リンク名") },
    { label: "🖼", title: "画像（サイズ指定可: |幅x高さ）", run: () => surround(ref, value, onChange, "![", "|300](https://)", "代替テキスト") },
    { label: "⧉", title: "コピー要素", run: () => surround(ref, value, onChange, "[[", "]]", "コピーする文字") },
  ];

  return (
    <div className="template-editor">
      {markdown && (
        <div className="md-toolbar rgl-cancel">
          {tools.map((tl) => (
            <button key={tl.title} type="button" className="md-tool" title={tl.title} onClick={tl.run}>
              {tl.label}
            </button>
          ))}
        </div>
      )}
      <div className="template-editor-area">
        <textarea
          ref={ref}
          className="rgl-cancel text-editor"
          value={value}
          spellCheck={false}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            refreshAc(e.target.value, e.target.selectionStart);
          }}
          onKeyDown={onKeyDown}
          onClick={(e) => refreshAc(value, e.currentTarget.selectionStart)}
          onBlur={() => setTimeout(() => setAc(null), 120)}
        />
        {ac && matches.length > 0 && (
          <ul className="var-autocomplete rgl-cancel">
            {matches.map((v, i) => (
              <li key={v.token}>
                <button
                  type="button"
                  className={`var-item${i === ac.index ? " active" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    acceptVar(v.token);
                  }}
                >
                  <code>{v.token}</code>
                  <span className="muted">{v.description}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
