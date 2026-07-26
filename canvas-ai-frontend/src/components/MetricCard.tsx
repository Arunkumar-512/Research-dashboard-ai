import React from 'react';
import { TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  currency?: boolean;
}

export default function MetricCard({
  title,
  value,
  currency,
}: MetricCardProps) {

  let displayValue = value;

  if (
    typeof value === 'string' &&
    value.includes('${')
  ) {
    displayValue = 'Calculating...';
  }

  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-200
        dark:border-zinc-800
        bg-white
        dark:bg-zinc-950
        shadow-sm
        transition-all
        duration-200
        hover:border-zinc-300
        dark:hover:border-zinc-700
        hover:shadow-md
      "
    >
      <div className="p-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-wide
                text-zinc-500
                dark:text-zinc-400
              "
            >
              Metric
            </p>

            <h3
              className="
                mt-2
                text-sm
                font-semibold
                text-zinc-900
                dark:text-zinc-100
                leading-6
              "
            >
              {title}
            </h3>
          </div>

          {/* Icon */}
          <div
            className="
              flex
              items-center
              justify-center
              h-10
              w-10
              rounded-xl
              border
              border-zinc-200
              dark:border-zinc-800
              bg-zinc-100
              dark:bg-zinc-900
              text-zinc-600
              dark:text-zinc-300
              shrink-0
            "
          >
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        {/* Value */}
        <div className="mt-8">

          <div
            className="
              text-3xl
              md:text-4xl
              font-bold
              tracking-tight
              text-zinc-900
              dark:text-white
              leading-none
              truncate
            "
          >
            {currency &&
            typeof displayValue === 'number'
              ? `$${displayValue.toLocaleString()}`
              : displayValue}
          </div>

          <div
            className="
              mt-4
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <p
              className="
                text-sm
                text-zinc-500
                dark:text-zinc-400
              "
            >
              AI generated insight
            </p>

            <div
              className="
                flex
                items-center
                gap-1
                rounded-md
                border
                border-emerald-200
                dark:border-emerald-900/40
                bg-emerald-50
                dark:bg-emerald-950/30
                px-2.5
                py-1
                text-xs
                font-medium
                text-emerald-600
                dark:text-emerald-400
                whitespace-nowrap
              "
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}