interface PointerGestureHandlers {
  onMove: (event: PointerEvent) => void;
  onEnd: () => void;
  onCancel: () => void;
}

/**
 * Wires up a pointer-driven gesture — capture, move tracking, and an
 * Escape-to-cancel — leaving the caller's `onMove`/`onEnd`/`onCancel` to own
 * the gesture's own domain logic (and any state reset that goes with it).
 *
 * A plain function rather than a hook: the caller already owns every piece of
 * state involved via closures, so there is nothing here for React to manage.
 */
export function startPointerGesture(
  element: HTMLElement,
  pointerId: number,
  handlers: PointerGestureHandlers,
): void {
  element.setPointerCapture(pointerId);

  function stop(): void {
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerup", end);
    element.removeEventListener("pointercancel", cancel);
    window.removeEventListener("keydown", onKeyDown);
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  }

  function move(event: PointerEvent): void {
    handlers.onMove(event);
  }

  function end(): void {
    stop();
    handlers.onEnd();
  }

  function cancel(): void {
    stop();
    handlers.onCancel();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      cancel();
    }
  }

  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", end);
  element.addEventListener("pointercancel", cancel);
  window.addEventListener("keydown", onKeyDown);
}
