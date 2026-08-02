import { createPortal } from "react-dom";
import { KEYBOARD_STEP } from "@gridkitjs/core";
import type { ResolvedColumn } from "../DataGrid";
import type { ColumnDragApi } from "../useColumnDrag";
import type { ColumnResizeApi } from "../useColumnResize";

interface GridHeaderProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  resize: ColumnResizeApi<Row>;
  drag: ColumnDragApi<Row>;
}

export default function GridHeader<Row>({
  columns,
  resize,
  drag,
}: GridHeaderProps<Row>) {
  const { beforeId } = drag.dropTarget ?? {};
  const draggedEntry =
    columns.find((entry) => entry.id === drag.draggedColumnId) ?? null;

  return (
    <thead>
      <tr className="grid-header">
        {columns.map((entry, index) => {
          const { column } = entry;
          const resizing = resize.activeColumnId === entry.id;
          const dragging = drag.draggedColumnId === entry.id;

          /**
           * Drawn on the gap's own edge, so the one gap between two columns is
           * marked once. No guard against the dragged column: the hook reports
           * only gaps that would move it.
           */
          const dropBefore = beforeId !== undefined && beforeId === entry.id;
          const dropAfter = beforeId === null && index === columns.length - 1;

          return (
            <th
              key={entry.id}
              data-gridkit-column={entry.id}
              className={[
                "header-cell",
                resizing ? "is-resizing" : "",
                dragging ? "is-dragging" : "",
                dropBefore ? "is-drop-before" : "",
                dropAfter ? "is-drop-after" : "",
                column.wrap?.header ? "is-wrapped" : "",
                column.headerClassName ?? "",
              ]
                .filter(Boolean)
                .join(" ")}
              {...(entry.reorderable && {
                tabIndex: 0,
                onPointerDown: (event) => {
                  drag.startDrag(entry, event);
                },
                onKeyDown: (event) => {
                  if (!event.ctrlKey) return;
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                    return;
                  event.preventDefault();
                  drag.moveByKeyboard(
                    entry,
                    event.key === "ArrowLeft" ? -1 : 1,
                  );
                },
              })}
            >
              {entry.label}
              {entry.resizable && (
                <span
                  className="header-resize-handle"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`Resize ${column.field}`}
                  tabIndex={0}
                  onPointerDown={(event) => {
                    resize.startResize(entry, event);
                  }}
                  onDoubleClick={() => {
                    resize.sizeToContent(entry);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                      return;
                    event.preventDefault();
                    resize.nudge(
                      entry,
                      event.key === "ArrowLeft"
                        ? -KEYBOARD_STEP
                        : KEYBOARD_STEP,
                    );
                  }}
                />
              )}
            </th>
          );
        })}
      </tr>
      {/*
       * Portalled to the body, and not only because a `div` cannot sit in a
       * `tr`: inside the viewport the overflow that makes the grid scroll
       * would clip it.
       */}
      {draggedEntry !== null &&
        drag.ghostTransform !== null &&
        createPortal(
          <div
            className="gridkit-data-grid header-cell drag-ghost"
            style={{
              width: draggedEntry.width,
              transform: drag.ghostTransform,
            }}
            aria-hidden="true"
          >
            {draggedEntry.label}
          </div>,
          document.body,
        )}
    </thead>
  );
}
