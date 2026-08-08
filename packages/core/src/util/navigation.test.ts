import { describe, expect, test } from "vitest";

import { HEADER_ROW, clampFocus, nextFocusForKey } from "./navigation";

const noModifiers = {
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
};

describe("clampFocus", () => {
  test("leaves a focus already in range untouched", () => {
    expect(clampFocus({ rowIndex: 1, columnIndex: 1 }, 3, 3)).toEqual({
      rowIndex: 1,
      columnIndex: 1,
    });
  });

  test("holds rowIndex at the header for anything above it", () => {
    expect(clampFocus({ rowIndex: -5, columnIndex: 0 }, 3, 3)).toEqual({
      rowIndex: HEADER_ROW,
      columnIndex: 0,
    });
  });

  test("holds rowIndex at the last row for anything below it", () => {
    expect(clampFocus({ rowIndex: 99, columnIndex: 0 }, 3, 3)).toEqual({
      rowIndex: 2,
      columnIndex: 0,
    });
  });

  test("holds columnIndex within [0, columnCount - 1]", () => {
    expect(clampFocus({ rowIndex: 0, columnIndex: -1 }, 3, 3)).toEqual({
      rowIndex: 0,
      columnIndex: 0,
    });
    expect(clampFocus({ rowIndex: 0, columnIndex: 99 }, 3, 3)).toEqual({
      rowIndex: 0,
      columnIndex: 2,
    });
  });

  test("holds columnIndex at 0 when there are no columns", () => {
    expect(clampFocus({ rowIndex: 0, columnIndex: 5 }, 3, 0)).toEqual({
      rowIndex: 0,
      columnIndex: 0,
    });
  });
});

describe("nextFocusForKey", () => {
  const focus = { rowIndex: 2, columnIndex: 2 };

  test("moves one cell per arrow key", () => {
    expect(nextFocusForKey("ArrowLeft", noModifiers, focus, 5, 5, 2)).toEqual({
      rowIndex: 2,
      columnIndex: 1,
    });
    expect(nextFocusForKey("ArrowRight", noModifiers, focus, 5, 5, 2)).toEqual({
      rowIndex: 2,
      columnIndex: 3,
    });
    expect(nextFocusForKey("ArrowUp", noModifiers, focus, 5, 5, 2)).toEqual({
      rowIndex: 1,
      columnIndex: 2,
    });
    expect(nextFocusForKey("ArrowDown", noModifiers, focus, 5, 5, 2)).toEqual({
      rowIndex: 3,
      columnIndex: 2,
    });
  });

  test("is null for Alt on any key, resize's to claim", () => {
    expect(
      nextFocusForKey(
        "ArrowLeft",
        { ...noModifiers, altKey: true },
        focus,
        5,
        5,
        2,
      ),
    ).toBeNull();
    expect(
      nextFocusForKey("Home", { ...noModifiers, altKey: true }, focus, 5, 5, 2),
    ).toBeNull();
  });

  test("is null for Ctrl+ArrowLeft/Right, reorder's to claim", () => {
    expect(
      nextFocusForKey(
        "ArrowLeft",
        { ...noModifiers, ctrlKey: true },
        focus,
        5,
        5,
        2,
      ),
    ).toBeNull();
    expect(
      nextFocusForKey(
        "ArrowRight",
        { ...noModifiers, ctrlKey: true },
        focus,
        5,
        5,
        2,
      ),
    ).toBeNull();
  });

  test("still moves for Ctrl+ArrowUp/Down", () => {
    expect(
      nextFocusForKey(
        "ArrowUp",
        { ...noModifiers, ctrlKey: true },
        focus,
        5,
        5,
        2,
      ),
    ).toEqual({ rowIndex: 1, columnIndex: 2 });
  });

  test("Home/End are row-scoped without Ctrl", () => {
    expect(nextFocusForKey("Home", noModifiers, focus, 5, 5, 2)).toEqual({
      rowIndex: 2,
      columnIndex: 0,
    });
    expect(nextFocusForKey("End", noModifiers, focus, 5, 5, 2)).toEqual({
      rowIndex: 2,
      columnIndex: 4,
    });
  });

  test("Ctrl+Home/Ctrl+End jump to the grid's absolute ends", () => {
    expect(
      nextFocusForKey(
        "Home",
        { ...noModifiers, ctrlKey: true },
        focus,
        5,
        5,
        2,
      ),
    ).toEqual({ rowIndex: HEADER_ROW, columnIndex: 0 });
    expect(
      nextFocusForKey("End", { ...noModifiers, ctrlKey: true }, focus, 5, 5, 2),
    ).toEqual({ rowIndex: 4, columnIndex: 4 });
  });

  test("PageUp/PageDown move by the given pageSize", () => {
    expect(nextFocusForKey("PageUp", noModifiers, focus, 20, 5, 7)).toEqual({
      rowIndex: -5,
      columnIndex: 2,
    });
    expect(nextFocusForKey("PageDown", noModifiers, focus, 20, 5, 7)).toEqual({
      rowIndex: 9,
      columnIndex: 2,
    });
  });

  test("is null for a key it does not own", () => {
    expect(nextFocusForKey("Escape", noModifiers, focus, 5, 5, 2)).toBeNull();
    expect(nextFocusForKey("Tab", noModifiers, focus, 5, 5, 2)).toBeNull();
  });
});
