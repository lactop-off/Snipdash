import { useState } from "react";
import { type TableCard as TableCardType, normalizeTableRows } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { copyResolved } from "../actions";
import { Icon } from "./Icon";

/** Parse pasted spreadsheet text into a grid. Tab-separated when any tab is
 * present (Excel/Sheets default), otherwise comma-separated. Quoted CSV fields
 * are not handled in this PoC. */
function parseTabular(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  return lines.map((line) => (line.includes("\t") ? line.split("\t") : line.split(",")));
}

export function TableCard({ card, edit }: { card: TableCardType; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const headers = card.payload.headers;
  const rows = normalizeTableRows(headers, card.payload.rows);
  const [flash, setFlash] = useState<string | null>(null);

  const setPayload = (h: string[], r: string[][]) =>
    updateCard({ ...card, payload: { headers: h, rows: r } });

  // ----- use mode: click a cell to copy -----
  const onCellClick = (ri: number, ci: number, cell: string) => {
    if (!cell.trim()) return; // empty cell → nothing to copy
    // If the user is selecting text inside the cell, don't hijack it as a copy.
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    void copyResolved(cell, locale);
    const key = `${ri}-${ci}`;
    setFlash(key);
    window.setTimeout(() => setFlash((f) => (f === key ? null : f)), 400);
  };

  // ----- edit mode: cell/row/column edits -----
  const setHeader = (ci: number, val: string) => {
    const h = [...headers];
    h[ci] = val;
    setPayload(h, rows);
  };
  const setCell = (ri: number, ci: number, val: string) => {
    const r = rows.map((row) => [...row]);
    r[ri]![ci] = val;
    setPayload(headers, r);
  };
  const addColumn = () => setPayload([...headers, `列${headers.length + 1}`], rows.map((r) => [...r, ""]));
  const removeColumn = (ci: number) => {
    if (headers.length <= 1) return;
    setPayload(
      headers.filter((_, i) => i !== ci),
      rows.map((r) => r.filter((_, i) => i !== ci)),
    );
  };
  const addRow = () => setPayload(headers, [...rows, headers.map(() => "")]);
  const removeRow = (ri: number) => setPayload(headers, rows.filter((_, i) => i !== ri));

  // Paste TSV/CSV anywhere in the table → replace the whole table
  // (first row = headers, the rest = body).
  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text || !/[\t\n,]/.test(text)) return; // not tabular → keep default paste
    e.preventDefault();
    const parsed = parseTabular(text);
    if (parsed.length === 0) return;
    const newHeaders = parsed[0]!;
    setPayload(newHeaders, normalizeTableRows(newHeaders, parsed.slice(1)));
  };

  if (edit) {
    return (
      <div className="card-content table-card">
        <div className="table-scroll">
          <table className="snip-table is-edit">
            <thead>
              <tr>
                {headers.map((h, ci) => (
                  <th key={ci}>
                    <div className="th-edit">
                      <input
                        className="rgl-cancel cell-input"
                        value={h}
                        onChange={(e) => setHeader(ci, e.target.value)}
                        onPaste={onPaste}
                      />
                      <button
                        type="button"
                        className="rgl-cancel col-del"
                        title={t("table.deleteColumn")}
                        onClick={() => removeColumn(ci)}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
                <th className="add-col-cell">
                  <button type="button" className="rgl-cancel btn-ghost btn-small" title={t("table.addColumn")} onClick={addColumn}>
                    ＋
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>
                      <input
                        className="rgl-cancel cell-input"
                        value={cell}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        onPaste={onPaste}
                      />
                    </td>
                  ))}
                  <td className="row-del-cell">
                    <button type="button" className="rgl-cancel row-del" title={t("table.deleteRow")} onClick={() => removeRow(ri)}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-toolbar">
          <button type="button" className="rgl-cancel btn-ghost btn-small" onClick={addRow}>
            ＋ {t("table.addRow")}
          </button>
          <span className="muted table-hint">{t("table.pasteHint")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card-content table-card">
      <div className="table-scroll">
        <table className="snip-table">
          <thead>
            <tr>
              {headers.map((h, ci) => (
                <th key={ci} title={h || undefined}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  const empty = cell.trim().length === 0;
                  const key = `${ri}-${ci}`;
                  return (
                    <td
                      key={ci}
                      className={`cell${empty ? " is-empty" : " is-copyable"}${flash === key ? " flash" : ""}`}
                      title={empty ? undefined : t("table.clickToCopy")}
                      onClick={() => onCellClick(ri, ci, cell)}
                    >
                      <span className="cell-text">{cell}</span>
                      {!empty && (
                        <span className="cell-copy" aria-hidden>
                          <Icon name="copy" size={12} />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
