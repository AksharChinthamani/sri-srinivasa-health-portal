'use client';
import { useContext } from 'react';
import React from 'react';
import { LanguageContext } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";

interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  ({ columns, data, loading }, ref) => {
        const langContext = useContext(LanguageContext);
          const language = langContext?.language || 'en';
    if (loading) {
      return <div className="p-4">{getTranslation(language, 'auto.loading')}</div>;
    }

    return (
      <div ref={ref} className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="px-6 py-3 text-left text-sm font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 text-sm">
                    {col.render ? col.render(row[col.key]) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';
