import type { ResolvedColumn } from "../DataGrid";
import { KEYBOARD_STEP, type ColumnResizeApi } from "../useColumnResize";

interface GridHeaderProps<Row> {
  columns: readonly ResolvedColumn<Row>[];
  resizableColumns: boolean;
  resize: ColumnResizeApi<Row>;
}

export default function GridHeader<Row>({
  columns,
  resizableColumns,
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
              {column.header
                ? typeof column.header === "function"
                  ? column.header()
                  : column.header
                : column.field.split(".").join(" ")}
              {(column.resizable ?? resizableColumns) && (
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
                >
                  <svg
                    className="header-resize-grip"
                    viewBox="0 0 6 14"
                    width="6"
                    height="14"
                    aria-hidden="true"
                  >
                    <circle cx="1.5" cy="4" r="1" />
                    <circle cx="1.5" cy="7" r="1" />
                    <circle cx="1.5" cy="10" r="1" />
                    <circle cx="4.5" cy="4" r="1" />
                    <circle cx="4.5" cy="7" r="1" />
                    <circle cx="4.5" cy="10" r="1" />
                  </svg>
                </span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
