import { cn } from "@/lib/cn";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyLabel: string;
}

export function DataTable<T>({ columns, rows, emptyLabel }: DataTableProps<T>) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-strobl-200 bg-strobl-50/60 px-4 py-8 text-sm text-ink-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/70">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-100 text-sm">
          <thead className="bg-strobl-50/70">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-ink-500",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map((row, index) => (
              <tr key={index} className="transition hover:bg-strobl-50/40">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3 text-ink-700", column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
