import {
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  applyColumnResize,
  beginColumnResize,
  clampColumnWidth,
  resolveColumnConstraints,
  sizeColumnToContent,
  type ColumnResizeEvent,
  type ColumnSizeDefaults,
  type ColumnSizingState,
} from "@gridkitjs/core";
import type { ResolvedColumn } from "./DataGrid";
import measureColumnContent from "./measureColumnContent";

interface UseColumnResizeOptions {
  tableRef: RefObject<HTMLTableElement | null>;
  sizing: ColumnSizingState;
  setSizing: Dispatch<SetStateAction<ColumnSizingState>>;
  columnSizeDefaults?: Partial<ColumnSizeDefaults> | undefined;
  onColumnResize?: ((event: ColumnResizeEvent) => void) | undefined;
}

export interface ColumnResizeApi<Row> {
  /** The column being dragged, for as long as the drag lasts. */
  activeColumnId: string | null;
  startResize: (
    entry: ResolvedColumn<Row>,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  sizeToContent: (entry: ResolvedColumn<Row>) => void;
  nudge: (entry: ResolvedColumn<Row>, delta: number) => void;
}

/**
 * Turns pointer and keyboard input into column widths. Every width it produces
 * comes from `@gridkitjs/core`; this hook only supplies the coordinates.
 */
export default function useColumnResize<Row>({
  tableRef,
  sizing,
  setSizing,
  columnSizeDefaults,
  onColumnResize,
}: UseColumnResizeOptions): ColumnResizeApi<Row> {
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  function commit(
    base: ColumnSizingState,
    columnId: string,
    width: number,
    phase: "move" | "end",
  ): void {
    const next = { ...base, [columnId]: width };
    setSizing(next);
    onColumnResize?.({ columnId, width, sizing: next, phase });
  }

  function startResize(
    entry: ResolvedColumn<Row>,
    event: ReactPointerEvent<HTMLElement>,
  ): void {
    const handle = event.currentTarget;
    const { pointerId } = event;
    const session = beginColumnResize(
      entry.column,
      entry.width,
      event.clientX,
      columnSizeDefaults,
    );
    /**
     * Only the dragged column can change while the drag lasts, so the state as
     * it was when the drag opened stays a correct base to merge into — no ref
     * mirror is needed to dodge a stale closure.
     */
    const base = sizing;
    let width = session.startWidth;

    // Otherwise the drag selects the header text it started on.
    event.preventDefault();
    event.stopPropagation();
    handle.setPointerCapture(pointerId);
    setActiveColumnId(session.columnId);

    function move(moveEvent: PointerEvent): void {
      width = applyColumnResize(session, moveEvent.clientX);
      commit(base, session.columnId, width, "move");
    }

    function stop(): void {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", onKeyDown);
      if (handle.hasPointerCapture(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
      setActiveColumnId(null);
    }

    function end(): void {
      stop();
      commit(base, session.columnId, width, "end");
    }

    /**
     * Escape puts back only the dragged column's pre-drag width, merged into
     * whatever the sizing state is *now* — not the `base` snapshot taken at
     * drag-start — so a different column resized via keyboard while this drag
     * was still open keeps its change instead of being clobbered by a stale
     * restore. A column that had no stored width at all is correctly omitted
     * by deleting the key rather than merging `startWidth` back in, which
     * would otherwise leave it pinned and hidden from auto-fit.
     */
    function cancel(): void {
      stop();
      setSizing((current) => {
        const next = Object.fromEntries(
          Object.entries(current).filter(
            ([columnId]) => columnId !== session.columnId,
          ),
        );
        if (session.columnId in base) {
          next[session.columnId] = base[session.columnId] as number;
        }
        onColumnResize?.({
          columnId: session.columnId,
          width: session.startWidth,
          sizing: next,
          phase: "end",
        });
        return next;
      });
    }

    function onKeyDown(keyEvent: KeyboardEvent): void {
      if (keyEvent.key === "Escape") {
        cancel();
      }
    }

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", onKeyDown);
  }

  function sizeToContent(entry: ResolvedColumn<Row>): void {
    const table = tableRef.current;
    if (table === null) {
      return;
    }

    const measured = measureColumnContent(table, entry.id);
    if (measured === null) {
      return;
    }

    commit(
      sizing,
      entry.id,
      sizeColumnToContent(
        measured,
        resolveColumnConstraints(entry.column, columnSizeDefaults),
      ),
      "end",
    );
  }

  function nudge(entry: ResolvedColumn<Row>, delta: number): void {
    commit(
      sizing,
      entry.id,
      clampColumnWidth(
        entry.width + delta,
        resolveColumnConstraints(entry.column, columnSizeDefaults),
      ),
      "end",
    );
  }

  // Deliberately a new object each render: the handlers close over `sizing` to
  // merge into, and a stable identity would need either `sizing` in a
  // `useCallback` dep list (no gain) or the ref mirror avoided above.
  return { activeColumnId, startResize, sizeToContent, nudge };
}
