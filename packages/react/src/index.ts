// React components will be exported from here. They consume the framework-agnostic logic in @gridkit/core.
export {
  DataGridComponent,
  type ColumnDefinition,
  type DataGridProps,
  type ResizeMode,
  type ResolvedColumn,
} from "./DataGrid/DataGrid";
// Re-exported so a consumer wiring up resize needs one import, not two.
export type {
  ColumnResizeEvent,
  ColumnSizeDefaults,
  ColumnSizingState,
} from "@gridkit/core";
