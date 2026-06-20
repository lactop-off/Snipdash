import { useEffect, useRef, useState, type CSSProperties } from "react";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useActiveBoard, useStore } from "../store";
import { CardFrame } from "./CardFrame";

const ResponsiveGrid = WidthProvider(GridLayout);

/** Minimum card size in grid cells. Kept in lockstep with `MIN_CARD_W/H` in the
 * Rust `snipdash-core` validator so the frontend never produces a layout the
 * backend would reject. */
const MIN_W = 2;
const MIN_H = 2;

export function GridCanvas({ edit }: { edit: boolean }) {
  const board = useActiveBoard();
  const applyLayout = useStore((s) => s.applyLayout);
  const canvasRef = useRef<HTMLDivElement>(null);
  // Available column width measured from the canvas. We then snap it to a whole
  // pixel so react-grid-layout's rounded item positions line up *exactly* with
  // the painted grid lines (fractional column widths drifted by ~1px before).
  const [cellW, setCellW] = useState<number | null>(null);

  const cols = board?.grid.cols ?? 12;
  const gap = board?.grid.gap ?? 8;

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const inner = el.clientWidth - padX;
      const w = (inner - gap * (cols + 1)) / cols;
      setCellW(w > 0 ? w : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols, gap]);

  if (!board) return null;

  // Integer square cell. Constraining the grid container to exactly this total
  // width forces react-grid-layout's column width to the same integer, so the
  // background grid and the cards share one pixel-perfect raster.
  const cell = cellW ? Math.floor(cellW) : null;
  const totalWidth = cell ? cell * cols + gap * (cols + 1) : null;
  const rowHeight = cell ?? board.grid.rowHeight;

  const layout: Layout[] = board.cards.map((c) => ({
    i: c.id,
    x: c.layout.x,
    y: c.layout.y,
    w: c.layout.w,
    h: c.layout.h,
    minW: MIN_W,
    minH: MIN_H,
  }));

  const sizerStyle: CSSProperties = {
    width: totalWidth ? `${totalWidth}px` : "100%",
    ...(edit && cell
      ? ({
          "--cell-w": `${cell}px`,
          "--cell-h": `${cell}px`,
          "--grid-gap": `${gap}px`,
        } as CSSProperties)
      : {}),
  };

  return (
    <div ref={canvasRef} className="canvas">
      <div className={`grid-sizer${edit ? " editing" : ""}`} style={sizerStyle}>
        <ResponsiveGrid
          className="grid"
          layout={layout}
          cols={cols}
          rowHeight={rowHeight}
          margin={[gap, gap]}
          isDraggable={edit}
          isResizable={edit}
          isBounded
          // Free placement with collision pushing (Metabase-style): dragging or
          // resizing a card shoves neighbours out of the way instead of being
          // blocked, and there is no gravity pulling cards to the top.
          compactType={null}
          draggableHandle=".card-drag-handle"
          draggableCancel=".rgl-cancel"
          onLayoutChange={(l: Layout[]) => {
            if (edit) {
              applyLayout(l.map((x) => ({ i: x.i, x: x.x, y: x.y, w: x.w, h: x.h })));
            }
          }}
        >
          {board.cards.map((card) => (
            <div key={card.id} className="grid-item">
              <CardFrame card={card} edit={edit} />
            </div>
          ))}
        </ResponsiveGrid>
      </div>
    </div>
  );
}
