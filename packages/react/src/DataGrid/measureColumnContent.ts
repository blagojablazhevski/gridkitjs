/**
 * The width the widest cell in `columnId` needs to show its content in full,
 * or `null` when the column has no cells.
 *
 * Measured with a `Range` over each cell's contents rather than the cell's own
 * `scrollWidth`. A range shrink-wraps what is actually laid out, so a column
 * far wider than its content reports the content width and can be sized *down*;
 * `scrollWidth` never reports less than the cell it is read from and so can
 * only ever grow a column.
 *
 * Only rendered rows are measured — once paging or virtualisation lands, that
 * means the visible ones.
 */
export default function measureColumnContent(
  table: HTMLTableElement,
  columnId: string,
): number | null {
  const cells = table.querySelectorAll<HTMLElement>(
    `[data-gridkit-column="${CSS.escape(columnId)}"]`,
  );
  const range = document.createRange();
  let widest: number | null = null;

  for (const cell of cells) {
    range.selectNodeContents(cell);
    const style = getComputedStyle(cell);
    // The range covers the content box only, so the cell's own spacing has to
    // be added back or the column would clip by exactly its padding.
    const width =
      range.getBoundingClientRect().width +
      parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight) +
      parseFloat(style.borderLeftWidth) +
      parseFloat(style.borderRightWidth);

    if (widest === null || width > widest) {
      widest = width;
    }
  }

  return widest;
}
