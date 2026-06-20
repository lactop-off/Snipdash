/** Shared color-tag palette and picker, used by cards and board tabs. The empty
 * string means "no color"; a "#rrggbb" value is a custom color. */
export const COLORS = ["", "red", "orange", "green", "blue", "purple"] as const;

const COLOR_VALUES: Record<string, string> = {
  red: "#ef4444",
  orange: "#f59e0b",
  green: "#10b981",
  blue: "#3b82f6",
  purple: "#8b5cf6",
};

/** Resolve a colorTag (preset name or "#rrggbb") to a CSS color, or undefined. */
export function colorValue(tag?: string): string | undefined {
  if (!tag) return undefined;
  if (tag.startsWith("#")) return tag;
  return COLOR_VALUES[tag];
}

export function ColorPicker({
  value,
  onChange,
  /** Prevent the picker from stealing focus (so an adjacent input keeps it). */
  keepFocus = false,
  /** Show a custom-color input. Off for the tab popover (it closes on blur). */
  allowCustom = true,
}: {
  value: string;
  onChange: (c: string) => void;
  keepFocus?: boolean;
  allowCustom?: boolean;
}) {
  const isCustom = value.startsWith("#");
  const noMouseDown = keepFocus ? (e: React.MouseEvent) => e.preventDefault() : undefined;
  return (
    <div className="color-picker">
      {COLORS.map((c) => (
        <button
          key={c || "none"}
          type="button"
          className={`swatch swatch-${c || "none"}${value === c ? " selected" : ""}`}
          title={c || "なし"}
          onMouseDown={noMouseDown}
          onClick={() => onChange(c)}
        />
      ))}
      {allowCustom && (
        <label
          className={`swatch swatch-custom${isCustom ? " selected" : ""}`}
          title="カスタム色"
          style={isCustom ? { background: value } : undefined}
        >
          <input
            type="color"
            value={isCustom ? value : "#7c7c7c"}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      )}
    </div>
  );
}
