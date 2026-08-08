import { defineColumnsFromRows } from "@gridkitjs/core";
import type { ColumnDefinition } from "@gridkitjs/react";

export const rows = [
  {
    Id: 1,
    Tags: ["ops"],
    Application: { Id: 9, Name: "Portal" },
    Cost: 1250.5,
  },
  { Id: 2, Status: "ok", Application: { Id: 4, Name: "Admin" }, Cost: 87.25 },
  { Id: 3, Status: "ok", Application: { Id: 7, Name: "Billing" }, Cost: 2410 },
  {
    Id: 4,
    Status: "warn",
    Application: { Id: 2, Name: "Search" },
    Cost: 340.8,
  },
  { Id: 5, Status: "ok", Application: { Id: 5, Name: "Reports" }, Cost: 19.99 },
  { Id: 6, Status: "warn", Application: { Id: 1, Name: "Auth" }, Cost: 1875.4 },
];

export type Row = (typeof rows)[number];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Assignable to the ReactNode-bound alias despite defaulting to `string`.
export const columns: readonly ColumnDefinition<Row>[] = [
  ...defineColumnsFromRows(rows),
  // Declared rather than inferred, so its alignment comes from `type` alone.
  {
    field: "Cost",
    id: "Cost.currency",
    type: "currency",
    headerTemplate: <span className="italic">Cost</span>,
    cellTemplate: ({ value, row }) => (
      <span className={row.Cost > 1000 ? "font-bold text-red-600" : ""}>
        {currency.format(Number(value))}
      </span>
    ),
  },
];
