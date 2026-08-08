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
  revertColumnSize,
  sizeColumnToContent,
  type ColumnResizeEvent,
  type ColumnSizeDefaults,
  type ColumnSizingState,
} from "@gridkitjs/core";
import type { ResolvedColumn } from "./DataGrid";
import measureColumnContent from "./measureColumnContent";
import { startPointerGesture } from "./pointerGesture";

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

  /**
   * Deliberately not built on `commitIfChanged`: its "move" phase is called
   * on every pointer move, including ones pinned against a min/max clamp
   * where the resulting width doesn't change, and it intentionally fires
   * `onColumnResize` anyway rather than adopting the bail-if-unchanged guard
   * every other commit-style call site has.
   */
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
    setActiveColumnId(session.columnId);

    startPointerGesture(handle, pointerId, {
      onMove(moveEvent) {
        width = applyColumnResize(session, moveEvent.clientX);
        commit(base, session.columnId, width, "move");
      },
      onEnd() {
        setActiveColumnId(null);
        // A click with no intervening `move` — as every double-click's two
        // constituent clicks are — leaves `width` at `startWidth`. Committing
        // that anyway would fire a spurious onColumnResize on every click.
        if (width !== session.startWidth) {
          commit(base, session.columnId, width, "end");
        }
      },
      /**
       * Escape puts back only the dragged column's pre-drag width, merged
       * into whatever the sizing state is *now* — not the `base` snapshot
       * taken at drag-start — so a different column resized via keyboard
       * while this drag was still open keeps its change instead of being
       * clobbered by a stale restore.
       */
      onCancel() {
        setActiveColumnId(null);
        setSizing((current) => {
          const next = revertColumnSize(current, base, session.columnId);
          onColumnResize?.({
            columnId: session.columnId,
            width: session.startWidth,
            sizing: next,
            phase: "end",
          });
          return next;
        });
      },
    });
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
