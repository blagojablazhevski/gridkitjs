// Framework-agnostic grid logic: sorting, filtering, paging will live here so it stays testable without a DOM.
export type {
  ColumnDefinition,
  FieldPath,
  ColumnAlignment,
  ColumnType,
} from "./types";
export { defineColumnsFromRows, accessDotted } from "./util/grid";
