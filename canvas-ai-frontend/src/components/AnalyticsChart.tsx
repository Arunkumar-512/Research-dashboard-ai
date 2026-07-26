'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsChartProps {
  title: string;
  data: any[];
  xAxisKey: string;
  yAxisKey: string;
}

export default function AnalyticsChart({
  title,
  data,
  xAxisKey,
  yAxisKey,
}: AnalyticsChartProps) {

  if (!data || data.length === 0) return null;

  return (
    <div
      className="
        w-full
        overflow-hidden
        rounded-2xl
        border
        border-zinc-200
        bg-white
        shadow-sm
        col-span-1
        lg:col-span-3
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          border-b
          border-zinc-200
          px-6
          py-5
        "
      >

        <div>

          <h3
            className="
              text-lg
              font-semibold
              tracking-tight
              text-zinc-900
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-1
              text-sm
              text-zinc-500
            "
          >
            AI generated analytical visualization
          </p>
        </div>

        <div
          className="
            rounded-md
            border
            border-emerald-200
            bg-emerald-50
            px-3
            py-1.5
            text-xs
            font-medium
            text-emerald-700
          "
        >
          Live
        </div>
      </div>

      {/* CHART */}
      <div className="p-5">

        <div
          className="
            h-[360px]
            w-full
            rounded-xl
            border
            border-zinc-200
            bg-zinc-50
            p-4
          "
        >

          <ResponsiveContainer width="100%" height="100%">

            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 0,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e4e4e7"
              />

              <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 12,
                  fill: '#71717a',
                  fontWeight: 500,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 12,
                  fill: '#71717a',
                  fontWeight: 500,
                }}
              />

              <Tooltip
                cursor={{
                  fill: 'rgba(0,0,0,0.03)',
                }}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e4e4e7',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  padding: '10px 12px',
                }}
                labelStyle={{
                  color: '#71717a',
                  marginBottom: '4px',
                  fontWeight: 600,
                }}
              />

              <Bar
                dataKey={yAxisKey}
                fill="#4f46e5"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}