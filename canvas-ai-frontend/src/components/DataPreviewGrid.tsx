'use client';

import React from 'react';

interface DataPreviewGridProps {
  columns: string[];
  rows: Record<string, any>[];
  filename: string;
}

export default function DataPreviewGrid({
  columns,
  rows,
  filename,
}: DataPreviewGridProps) {

  if (!rows || rows.length === 0) return null;

  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-zinc-200
        dark:border-zinc-800
        bg-white
        dark:bg-zinc-900
        shadow-sm
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          flex-col
          gap-4
          border-b
          border-zinc-200
          dark:border-zinc-800
          px-6
          py-5
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <div>
          <h3
            className="
              text-lg
              font-semibold
              tracking-tight
              text-zinc-900
              dark:text-zinc-100
            "
          >
            Dataset Preview
          </h3>

          <p
            className="
              mt-1
              text-sm
              text-zinc-500
              dark:text-zinc-400
            "
          >
            Previewing uploaded dataset structure and records.
          </p>
        </div>

        <div
          className="
            rounded-lg
            border
            border-zinc-200
            dark:border-zinc-700
            bg-zinc-50
            dark:bg-zinc-800/50
            px-4
            py-2
          "
        >
          <p
            className="
              text-xs
              font-medium
              text-zinc-500
              dark:text-zinc-400
            "
          >
            File
          </p>

          <p
            className="
              mt-1
              max-w-[240px]
              truncate
              text-sm
              font-medium
              text-zinc-900
              dark:text-zinc-100
            "
          >
            {filename}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">

        <table
          className="
            min-w-full
            border-collapse
          "
        >

          {/* TABLE HEAD */}
          <thead
            className="
              bg-zinc-50
              dark:bg-zinc-800/50
            "
          >
            <tr
              className="
                border-b
                border-zinc-200
                dark:border-zinc-800
              "
            >
              {columns.map((col) => (
                <th
                  key={col}
                  className="
                    whitespace-nowrap
                    px-6
                    py-4
                    text-left
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-zinc-500
                    dark:text-zinc-400
                  "
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody
            className="
              divide-y
              divide-zinc-200
              dark:divide-zinc-800
            "
          >
            {rows.map((row, index) => (
              <tr
                key={index}
                className="
                  transition-colors
                  hover:bg-zinc-50
                  dark:hover:bg-zinc-800/40
                "
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="
                      max-w-[240px]
                      truncate
                      px-6
                      py-4
                      text-sm
                      text-zinc-700
                      dark:text-zinc-300
                    "
                  >
                    {row[col]?.toString() || (
                      <span
                        className="
                          italic
                          text-zinc-400
                          dark:text-zinc-500
                        "
                      >
                        null
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div
        className="
          flex
          flex-col
          gap-3
          border-t
          border-zinc-200
          dark:border-zinc-800
          px-6
          py-4
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <div className="flex flex-wrap gap-3">

          <div
            className="
              rounded-md
              bg-zinc-100
              dark:bg-zinc-800
              px-3
              py-1.5
              text-sm
              font-medium
              text-zinc-700
              dark:text-zinc-300
            "
          >
            {columns.length} Columns
          </div>

          <div
            className="
              rounded-md
              bg-zinc-100
              dark:bg-zinc-800
              px-3
              py-1.5
              text-sm
              font-medium
              text-zinc-700
              dark:text-zinc-300
            "
          >
            {rows.length} Rows
          </div>
        </div>

        <p
          className="
            text-sm
            text-zinc-500
            dark:text-zinc-400
          "
        >
          Showing preview records from uploaded dataset
        </p>
      </div>
    </div>
  );
}