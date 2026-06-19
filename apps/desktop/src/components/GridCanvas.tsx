import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useActiveBoard, useStore } from "../store";
import { CardFrame } from "./CardFrame";

const ResponsiveGrid = WidthProvider(GridLayout);

export function GridCanvas({ edit }: { edit: boolean }) {
  const board = useActiveBoard();
  const applyLayout = useStore((s) => s.applyLayout);
  if (!board) return null;

  const layout: Layout[] = board.cards.map((c) => ({
    i: c.id,
    x: c.layout.x,
    y: c.layout.y,
    w: c.layout.w,
    h: c.layout.h,
    minW: 2,
    minH: 2,
  }));

  return (
    <div className={`canvas${edit ? " editing" : ""}`}>
      <ResponsiveGrid
        className="grid"
        layout={layout}
        cols={board.grid.cols}
        rowHeight={board.grid.rowHeight}
        margin={[board.grid.gap, board.grid.gap]}
        isDraggable={edit}
        isResizable={edit}
        isBounded
        compactType={null}
        preventCollision
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
  );
}
