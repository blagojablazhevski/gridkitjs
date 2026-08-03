import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  movesColumn,
  resolveDropBefore,
  type ColumnOrderState,
  type DropSide,
} from "@gridkitjs/core";
import type { ResolvedColumn } from "./DataGrid";

/**
 * How far the pointer travels before a press becomes a drag. Below it the
 * gesture is still a click, which is what leaves the header free to take one.
 */
const DRAG_THRESHOLD = 4;

/**
 * Where a drop would land. A union rather than the bare id it holds today, so
 * a second drop zone adds a member instead of reshaping this state.
 */
export type DropTarget = { kind: "column-order"; beforeId: string | null };

interface UseColumnDragOptions {
  order: ColumnOrderState;
  onDrop: (target: DropTarget, movedId: string) => void;
}

export interface ColumnDragApi<Row> {
  /** The column being dragged, for as long as the drag lasts. */
  draggedColumnId: string | null;
  /** Where it would land if released now. */
  dropTarget: DropTarget | null;
  /** Where the element trailing the pointer sits, as a CSS `transform`. */
  ghostTransform: string | null;
  startDrag: (
    entry: ResolvedColumn<Row>,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  /** Moves a column one place left (`-1`) or right (`1`). */
  moveByKeyboard: (entry: ResolvedColumn<Row>, direction: -1 | 1) => void;
  /**
   * Whether the gesture that just ended was a drag rather than a click, for a
   * header that has something of its own to do with a click.
   *
   * Reading it clears it, so that a press which never opened a drag at all —
   * on a column that cannot be reordered — does not see the last one's answer.
   */
  justDragged: () => boolean;
}

/**
 * The header under `(x, y)`. `closest` is what makes the whole cell the drop
 * zone: a hit on the label or the resize handle resolves to its header.
 */
function headerAt(x: number, y: number): Element | null {
  const element = document.elementFromPoint(x, y);
  return element?.closest("th[data-gridkit-column]") ?? null;
}

/** Which half of `element` `x` falls in. */
function sideOf(element: Element, x: number): DropSide {
  const rect = element.getBoundingClientRect();
  return x < rect.left + rect.width / 2 ? "before" : "after";
}

/**
 * Turns a pointer drag over the header into a drop target, leaving `onDrop` to
 * apply it.
 *
 * Pointer events rather than HTML5 drag-and-drop: `dragenter`/`dragleave` fire
 * per descendant, so the header's text and resize handle would each report the
 * target leaving and re-entering as the pointer crossed them.
 */
export default function useColumnDrag<Row>({
  order,
  onDrop,
}: UseColumnDragOptions): ColumnDragApi<Row> {
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [ghostTransform, setGhostTransform] = useState<string | null>(null);
  const dragged = useRef(false);

  function justDragged(): boolean {
    const answer = dragged.current;
    dragged.current = false;
    return answer;
  }

  function startDrag(
    entry: ResolvedColumn<Row>,
    event: ReactPointerEvent<HTMLElement>,
  ): void {
    const header = event.currentTarget;
    // Only the horizontal distance opens the drag: columns move along one
    // axis, so vertical travel says nothing about the user's intent.
    const { pointerId, clientX: startX } = event;
    const grabX = startX - header.getBoundingClientRect().left;
    let dragging = false;
    let target: DropTarget | null = null;

    /** Keeps the grab offset, so the pointer holds the spot it picked up. */
    function placeGhost(x: number, y: number): void {
      setGhostTransform(`translate(${String(x - grabX)}px, ${String(y)}px)`);
    }

    header.setPointerCapture(pointerId);

    function move(moveEvent: PointerEvent): void {
      const { clientX, clientY } = moveEvent;

      if (!dragging) {
        if (Math.abs(clientX - startX) < DRAG_THRESHOLD) {
          return;
        }
        dragging = true;
        // Latched for the `click` that follows the release, which is the only
        // thing that can tell a drag apart from a press in the same spot.
        dragged.current = true;
        setDraggedColumnId(entry.id);
      }

      placeGhost(clientX, clientY);

      // Hit-tested rather than read from the event's target, which pointer
      // capture pins to the header the drag opened on.
      const over = headerAt(clientX, clientY);
      const overId = over?.getAttribute("data-gridkit-column");

      // The rect is read fresh each move, so a width changed mid-drag cannot
      // leave the midpoint stale.
      const beforeId =
        over && overId
          ? resolveDropBefore(order, overId, sideOf(over, clientX))
          : undefined;

      // A gap the column already sits in would promise a move that
      // `moveColumnBefore` then declines to make.
      target =
        beforeId !== undefined && movesColumn(order, entry.id, beforeId)
          ? { kind: "column-order", beforeId }
          : null;

      setDropTarget(target);
    }

    function stop(): void {
      header.removeEventListener("pointermove", move);
      header.removeEventListener("pointerup", end);
      header.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", onKeyDown);
      if (header.hasPointerCapture(pointerId)) {
        header.releasePointerCapture(pointerId);
      }
      setGhostTransform(null);
      setDraggedColumnId(null);
      setDropTarget(null);
    }

    function end(): void {
      const dropped = target;
      stop();
      if (dragging && dropped !== null) {
        onDrop(dropped, entry.id);
      }
    }

    /** Escape and a cancelled pointer both leave the order as it was. */
    function cancel(): void {
      target = null;
      stop();
    }

    function onKeyDown(keyEvent: KeyboardEvent): void {
      if (keyEvent.key === "Escape") {
        cancel();
      }
    }

    header.addEventListener("pointermove", move);
    header.addEventListener("pointerup", end);
    header.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", onKeyDown);
  }

  function moveByKeyboard(entry: ResolvedColumn<Row>, direction: -1 | 1): void {
    const index = order.indexOf(entry.id);
    if (index === -1) {
      return;
    }

    /**
     * Moving right lands in front of the id two along: the gap immediately
     * after a column is the one it already sits in.
     */
    const targetIndex = direction === -1 ? index - 1 : index + 2;
    if (targetIndex < 0) {
      return;
    }

    onDrop(
      { kind: "column-order", beforeId: order[targetIndex] ?? null },
      entry.id,
    );
  }

  // A new object each render, as `useColumnResize` returns: the handlers close
  // over `order`, and a stable identity would buy nothing.
  return {
    draggedColumnId,
    dropTarget,
    ghostTransform,
    startDrag,
    moveByKeyboard,
    justDragged,
  };
}
