import { createPortal } from "react-dom";
import { KEYBOARD_STEP } from "@gridkitjs/core";
import type { ResolvedColumn } from "../DataGrid";
import type { ColumnDragApi } from "../useColumnDrag";
import type { ColumnResizeApi } from "../useColumnResize";
import { HEADER_ROW, type GridNavigationApi } from "../useGridNavigation";
import { intentOf, type GridSelectionApi } from "../useGridSelection";

interface GridHeaderProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  resize: ColumnResizeApi<Row>;
  drag: ColumnDragApi<Row>;
  nav: GridNavigationApi;
  selection: GridSelectionApi;
}

export default function GridHeader<Row>({
  columns,
  resize,
  drag,
  nav,
  selection,
}: GridHeaderProps<Row>) {
  const { beforeId } = drag.dropTarget ?? {};
  const draggedEntry =
    columns.find((entry) => entry.id === drag.draggedColumnId) ?? null;

  return (
    <thead>
      <tr className="grid-header" role="row" aria-rowindex={1}>
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
          const selected = selection.selectedColumnIds.has(entry.id);

          /**
           * Announced so the keys are discoverable, since neither is a
           * convention a user would try unprompted.
           */
          const shortcuts = [
            entry.reorderable ? "Control+ArrowLeft Control+ArrowRight" : "",
            entry.resizable ? "Alt+ArrowLeft Alt+ArrowRight" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <th
              key={entry.id}
              scope="col"
              data-gridkit-column={entry.id}
              aria-colindex={index + 1}
              tabIndex={nav.tabIndexFor(HEADER_ROW, index)}
              {...(selection.columnMode !== false && {
                "aria-selected": selected,
              })}
              onFocus={() => {
                nav.focusCell(HEADER_ROW, index);
              }}
              onClick={(event) => {
                /*
                 * A drag ends in a click on the header it started from, and a
                 * resize in one on the handle inside it. Neither is the press
                 * that selects a column, so both are shown the door here —
                 * the drag by the distance it travelled, the resize by where
                 * it began.
                 */
                if (drag.justDragged()) {
                  return;
                }
                if (
                  event.target instanceof Element &&
                  event.target.closest(".header-resize-handle") !== null
                ) {
                  return;
                }
                selection.selectColumn(entry.id, intentOf(event));
              }}
              onKeyDown={(event) => {
                const horizontal =
                  event.key === "ArrowLeft" || event.key === "ArrowRight";
                const direction = event.key === "ArrowLeft" ? -1 : 1;

                if (horizontal && event.ctrlKey && entry.reorderable) {
                  event.preventDefault();
                  drag.moveByKeyboard(entry, direction);
                  return;
                }
                if (horizontal && event.altKey && entry.resizable) {
                  event.preventDefault();
                  resize.nudge(entry, direction * KEYBOARD_STEP);
                  return;
                }
                // Space builds a selection up and Enter replaces it, as in the
                // body. Taken either way, or Space scrolls the grid away.
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  selection.selectColumn(
                    entry.id,
                    intentOf({
                      ctrlKey: event.key === " " || event.ctrlKey,
                      metaKey: event.metaKey,
                      shiftKey: event.shiftKey,
                    }),
                  );
                  return;
                }
                nav.onKeyDown(event);
              }}
              className={[
                "header-cell",
                entry.reorderable ? "is-reorderable" : "",
                selected ? "is-selected" : "",
                resizing ? "is-resizing" : "",
                dragging ? "is-dragging" : "",
                dropBefore ? "is-drop-before" : "",
                dropAfter ? "is-drop-after" : "",
                column.wrap?.header ? "is-wrapped" : "",
                column.headerClassName ?? "",
              ]
                .filter(Boolean)
                .join(" ")}
              {...(shortcuts !== "" && { "aria-keyshortcuts": shortcuts })}
              {...(entry.reorderable && {
                onPointerDown: (event) => {
                  drag.startDrag(entry, event);
                },
              })}
            >
              {entry.label}
              {entry.resizable && (
                /*
                 * A pointer affordance only, and hidden from assistive
                 * technology accordingly: a focusable handle per column would
                 * put N tab stops inside a widget that is meant to have one.
                 * The keyboard resizes from the header itself, under Alt.
                 */
                <span
                  className="header-resize-handle"
                  aria-hidden="true"
                  tabIndex={-1}
                  onPointerDown={(event) => {
                    resize.startResize(entry, event);
                  }}
                  onDoubleClick={() => {
                    resize.sizeToContent(entry);
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
