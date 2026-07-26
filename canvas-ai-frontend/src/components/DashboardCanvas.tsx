'use client';

import React from 'react';
import MetricCard from './MetricCard';
import AnalyticsChart from './AnalyticsChart';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';

interface DashboardCanvasProps {
  layout: {
    canvasTitle: string;
    widgets: any[];
  };
  executionData: any;
}

export default function DashboardCanvas({
  layout,
  executionData,
}: DashboardCanvasProps) {

  if (!layout || !layout.widgets || layout.widgets.length === 0) {
    return (
      <div
        className="
          rounded-2xl
          border
          border-zinc-200
          dark:border-zinc-800
          bg-white
          dark:bg-zinc-900
          px-8
          py-20
          text-center
        "
      >
        <h3
          className="
            text-lg
            font-semibold
            text-zinc-900
            dark:text-zinc-100
          "
        >
          No dashboard generated
        </h3>

        <p
          className="
            mt-2
            text-sm
            text-zinc-500
            dark:text-zinc-400
          "
        >
          Submit a query above to generate analytics widgets and charts.
        </p>
      </div>
    );
  }

  // ⚡ POSTGRES DATA NORMALIZATION LAYER
  const dataRows = Array.isArray(executionData)
    ? executionData
    : [];

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div
        className="
          flex
          flex-col
          gap-2
          border-b
          border-zinc-200
          dark:border-zinc-800
          pb-5
        "
      >
        <h2
          className="
            text-2xl
            font-semibold
            tracking-tight
            text-zinc-900
            dark:text-zinc-100
          "
        >
          {layout.canvasTitle}
        </h2>

        <p
          className="
            text-sm
            text-zinc-500
            dark:text-zinc-400
          "
        >
          AI-generated dashboard analytics and visual insights.
        </p>
      </div>

      {/* GRID */}
      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        "
      >

        {layout.widgets.map((widget) => {

          // 1. Metric Cards
          if (widget.type === 'metric_card') {

            const metricKey =
              widget.props.yAxisKey ||
              (dataRows[0]
                ? Object.keys(dataRows[0])[0]
                : null);

            const rawValue =
              dataRows[0] && metricKey
                ? dataRows[0][metricKey]
                : 'Calculating...';

            return (
              <MetricCard
                key={widget.id}
                title={widget.props.title}
                value={rawValue}
                currency={!String(rawValue).includes('$')}
              />
            );
          }

          // 2. Text/List Cards
          if (widget.type === 'text_card') {

            const labelKey =
              widget.props.xAxisKey ||
              (dataRows[0]
                ? Object.keys(dataRows[0])[0]
                : 'name');

            const valueKey =
              widget.props.yAxisKey ||
              (dataRows[0]
                ? Object.keys(dataRows[0])[1]
                : 'value');

            return (
              <div
                key={widget.id}
                className="
                  rounded-2xl
                  border
                  border-zinc-200
                  dark:border-zinc-800
                  bg-white
                  dark:bg-zinc-900
                  p-6
                  shadow-sm
                "
              >

                <div className="mb-5">
                  <h3
                    className="
                      text-base
                      font-semibold
                      text-zinc-900
                      dark:text-zinc-100
                    "
                  >
                    {widget.props.title}
                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-zinc-500
                      dark:text-zinc-400
                    "
                  >
                    Generated insights overview
                  </p>
                </div>

                <div
                  className="
                    space-y-3
                    max-h-[320px]
                    overflow-y-auto
                    pr-1
                  "
                >
                  {dataRows.map((row: any, idx: number) => (
                    <div
                      key={idx}
                      className="
                        flex
                        items-center
                        justify-between
                        rounded-xl
                        border
                        border-zinc-100
                        dark:border-zinc-800
                        bg-zinc-50
                        dark:bg-zinc-950
                        px-4
                        py-3
                      "
                    >

                      <span
                        className="
                          text-sm
                          font-medium
                          text-zinc-700
                          dark:text-zinc-300
                        "
                      >
                        {String(
                          row[labelKey] || 'Unknown'
                        )}
                      </span>

                      <span
                        className="
                          text-sm
                          font-semibold
                          text-zinc-900
                          dark:text-zinc-100
                        "
                      >
                        {String(
                          row[valueKey] !== undefined
                            ? row[valueKey]
                            : ''
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // 3. Dynamic Bar Chart Widget
          if (widget.type === 'bar_chart') {
            return (
              <AnalyticsChart
                key={widget.id}
                title={widget.props.title}
                data={dataRows}
                xAxisKey={
                  widget.props.xAxisKey || 'name'
                }
                yAxisKey={
                  widget.props.yAxisKey || 'value'
                }
              />
            );
          }

          // 4. Dynamic Line Chart Widget
          if (widget.type === 'line_chart') {

            const xKey =
              widget.props.xAxisKey || 'name';

            const yKey =
              widget.props.yAxisKey || 'value';

            return (
              <div
                key={widget.id}
                className="
                  rounded-2xl
                  border
                  border-zinc-200
                  dark:border-zinc-800
                  bg-white
                  dark:bg-zinc-900
                  p-6
                  shadow-sm
                  h-[420px]
                  md:col-span-2
                  xl:col-span-3
                "
              >

                <div className="mb-6">
                  <h3
                    className="
                      text-base
                      font-semibold
                      text-zinc-900
                      dark:text-zinc-100
                    "
                  >
                    {widget.props.title}
                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-zinc-500
                      dark:text-zinc-400
                    "
                  >
                    Trend visualization
                  </p>
                </div>

                <ResponsiveContainer
                  width="100%"
                  height="82%"
                >
                  <LineChart
                    data={dataRows}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(113,113,122,0.12)"
                    />

                    <XAxis
                      dataKey={xKey}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#71717a"
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#71717a"
                    />

                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border:
                          '1px solid rgba(113,113,122,0.15)',
                        backgroundColor:
                          'rgba(24,24,27,0.98)',
                        color: '#fff',
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey={yKey}
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{
                        fill: '#6366f1',
                        r: 3,
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          }

          // 5. Dynamic Pie Chart Widget
          if (widget.type === 'pie_chart') {

            const xKey =
              widget.props.nameKey ||
              widget.props.xAxisKey ||
              'name';

            const yKey =
              widget.props.valueKey ||
              widget.props.yAxisKey ||
              'value';

            return (
              <div
                key={widget.id}
                className="
                  rounded-2xl
                  border
                  border-zinc-200
                  dark:border-zinc-800
                  bg-white
                  dark:bg-zinc-900
                  p-6
                  shadow-sm
                  h-[420px]
                "
              >

                <div className="mb-6">
                  <h3
                    className="
                      text-base
                      font-semibold
                      text-zinc-900
                      dark:text-zinc-100
                    "
                  >
                    {widget.props.title}
                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-zinc-500
                      dark:text-zinc-400
                    "
                  >
                    Category distribution
                  </p>
                </div>

                <ResponsiveContainer
                  width="100%"
                  height="82%"
                >
                  <PieChart>

                    <Pie
                      data={dataRows}
                      dataKey={yKey}
                      nameKey={xKey}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {dataRows.map((_, index) => {

                        const colors = [
                          '#6366f1',
                          '#8b5cf6',
                          '#0ea5e9',
                          '#10b981',
                          '#f59e0b',
                          '#ef4444',
                          '#14b8a6',
                        ];

                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              colors[
                                index % colors.length
                              ]
                            }
                          />
                        );
                      })}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border:
                          '1px solid rgba(113,113,122,0.15)',
                        backgroundColor:
                          'rgba(24,24,27,0.98)',
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: '12px',
                        color: '#71717a',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}