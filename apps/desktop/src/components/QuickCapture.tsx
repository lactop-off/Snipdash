import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { translator } from "../i18n";
import { toast } from "../toast";
import { Icon } from "./Icon";

/** Minimal single-line capture: Enter appends a todo to the Inbox board and
 * keeps the modal open for rapid entry; Esc / backdrop closes. */
export function QuickCapture({ open, onClose }: { open: boolean; onClose: () => void }) {
  const captureToInbox = useStore((s) => s.captureToInbox);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    captureToInbox(text);
    toast.success(t("capture.added"));
    setValue("");
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="palette-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette capture" role="dialog" aria-modal="true" aria-label={t("cmd.quickCapture")}>
        <div className="palette-search">
          <Icon name="inbox" size={16} />
          <input
            ref={inputRef}
            className="palette-input"
            value={value}
            placeholder={t("capture.placeholder")}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className="palette-footer">
          <span>
            <Icon name="corner-down-left" size={11} /> {t("palette.hint.run")}
          </span>
          <span>Esc {t("common.close")}</span>
        </div>
      </div>
    </div>
  );
}
