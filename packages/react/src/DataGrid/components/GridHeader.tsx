import type { ColumnDefinition } from "../DataGrid";

interface GridHeaderProps<Row> {
  columns?: readonly ColumnDefinition<Row>[] | undefined;
}

export default function GridHeader<Row>({ columns }: GridHeaderProps<Row>) {
  return (
    <thead>
      <tr className="grid-header">
        {columns?.map((column) => (
          <th key={column.field} className="header-cell">
            {column.header
              ? typeof column.header === "function"
                ? column.header()
                : column.header
              : column.field.split(".").join(" ")}
          </th>
        ))}
      </tr>
    </thead>
  );
}
