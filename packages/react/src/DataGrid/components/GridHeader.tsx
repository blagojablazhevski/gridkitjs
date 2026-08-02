import { KEYBOARD_STEP } from "@gridkitjs/core";
import type { ResolvedColumn } from "../DataGrid";
import type { ColumnResizeApi } from "../useColumnResize";

interface GridHeaderProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  resize: ColumnResizeApi<Row>;
}

export default function GridHeader<Row>({
  columns,
  resize,
}: GridHeaderProps<Row>) {
  return (
    <thead>
      <tr className="grid-header">
        {columns.map((entry) => {
          const { column } = entry;
          const resizing = resize.activeColumnId === entry.id;

          return (
            <th
              key={entry.id}
              data-gridkit-column={entry.id}
              className={resizing ? "header-cell is-resizing" : "header-cell"}
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
    </thead>
  );
}
