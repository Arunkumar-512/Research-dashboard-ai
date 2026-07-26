'use client';

import React from 'react';
import {
  Terminal,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface LogLine {
  type: 'status' | 'code' | 'error';
  content: string;
}

interface ThinkingConsoleProps {
  logs: LogLine[];
  isOpen: boolean;
}

export default function ThinkingConsole({
  logs,
  isOpen,
}: ThinkingConsoleProps) {
  if (!isOpen) return null;

  return (
    <div
  className="
    group
    relative
    overflow-hidden
    w-full
    min-w-0
    rounded-[28px]
    border
    border-zinc-200/70
    dark:border-zinc-800/70
    bg-white/80
    dark:bg-zinc-900/60
    backdrop-blur-xl
    shadow-sm
    flex
    flex-col
    h-[560px]
  "
>
      {/* HEADER */}
      <div
        className="
          flex
          items-center
          justify-between
          px-5
          py-4
          border-b
          border-zinc-200
          dark:border-zinc-800
          bg-zinc-50/80
          dark:bg-zinc-900/60
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              items-center
              justify-center
              h-10
              w-10
              rounded-xl
              bg-zinc-100
              dark:bg-zinc-800
              text-zinc-600
              dark:text-zinc-300
            "
          >
            <Terminal className="h-5 w-5" />
          </div>

          <div>
            <p
              className="
                text-xs
                font-medium
                uppercase
                tracking-wide
                text-zinc-500
              "
            >
              Runtime Console
            </p>

            <h2
              className="
                text-sm
                font-semibold
                text-zinc-900
                dark:text-zinc-100
              "
            >
              AI Processing Logs
            </h2>
          </div>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
            rounded-full
            border
            border-emerald-200
            dark:border-emerald-900/40
            bg-emerald-50
            dark:bg-emerald-500/10
            px-3
            py-1.5
            text-xs
            font-medium
            text-emerald-600
            dark:text-emerald-400
          "
        >
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          Active
        </div>
      </div>

      {/* BODY */}
      <div
        className="
          flex-1
          overflow-y-auto
          p-4
          space-y-3
        "
      >
        {/* EMPTY */}
        {logs.length === 0 && (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              h-full
              text-center
              px-6
            "
          >
            <div
              className="
                flex
                items-center
                justify-center
                h-14
                w-14
                rounded-xl
                bg-zinc-100
                dark:bg-zinc-800
                text-zinc-500
                dark:text-zinc-400
                mb-4
              "
            >
              <Cpu className="h-6 w-6" />
            </div>

            <h3
              className="
                text-sm
                font-semibold
                text-zinc-900
                dark:text-zinc-100
              "
            >
              Waiting for execution
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-relaxed
                text-zinc-500
                dark:text-zinc-400
                max-w-xs
              "
            >
              Logs and execution updates will appear here while the AI processes your request.
            </p>
          </div>
        )}

        {/* LOGS */}
        {logs.map((log, index) => (
          <div
            key={index}
            className="
              rounded-xl
              border
              border-zinc-200
              dark:border-zinc-800
              bg-white
              dark:bg-zinc-900
              overflow-hidden
            "
          >
            {/* TOP */}
            <div
              className="
                flex
                items-start
                gap-3
                p-4
              "
            >
              {/* ICON */}
              <div
                className={`
                  flex
                  items-center
                  justify-center
                  h-9
                  w-9
                  rounded-lg
                  shrink-0
                  ${
                    log.type === 'status'
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : log.type === 'error'
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }
                `}
              >
                {log.type === 'status' && (
                  <Cpu className="h-4 w-4" />
                )}

                {log.type === 'error' && (
                  <AlertTriangle className="h-4 w-4" />
                )}

                {log.type === 'code' && (
                  <Terminal className="h-4 w-4" />
                )}
              </div>

              {/* TEXT */}
              <div className="flex-1 min-w-0">
                <div
                  className={`
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wide
                    mb-2
                    ${
                      log.type === 'status'
                        ? 'text-blue-600 dark:text-blue-400'
                        : log.type === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }
                  `}
                >
                  {log.type === 'code'
                    ? 'Execution Script'
                    : log.type === 'error'
                    ? 'Runtime Error'
                    : 'System Status'}
                </div>

                {log.type !== 'code' && (
                  <p
                    className={`
                      text-sm
                      leading-relaxed
                      ${
                        log.type === 'error'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }
                    `}
                  >
                    {log.content}
                  </p>
                )}
              </div>
            </div>

            {/* CODE BLOCK */}
            {log.type === 'code' && (
              <div
                className="
                  border-t
                  border-zinc-200
                  dark:border-zinc-800
                  bg-zinc-950
                "
              >
                {/* CODE HEADER */}
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    px-4
                    py-2.5
                    border-b
                    border-zinc-800
                    bg-zinc-900
                  "
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    </div>

                    <span
                      className="
                        text-[11px]
                        font-medium
                        text-zinc-400
                      "
                    >
                      pandas_runtime.py
                    </span>
                  </div>

                  <span
                    className="
                      text-[10px]
                      uppercase
                      tracking-wide
                      text-zinc-500
                    "
                  >
                    Generated
                  </span>
                </div>

                {/* CODE */}
                <pre
                  className="
                    overflow-x-auto
                    p-4
                    text-[12px]
                    leading-relaxed
                    text-emerald-400
                    font-mono
                  "
                >
                  {log.content}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div
        className="
          flex
          items-center
          justify-between
          px-5
          py-3
          border-t
          border-zinc-200
          dark:border-zinc-800
          bg-zinc-50/80
          dark:bg-zinc-900/60
        "
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />

          <span
            className="
              text-xs
              text-zinc-500
              dark:text-zinc-400
            "
          >
            Real-time monitoring enabled
          </span>
        </div>

        <span
          className="
            text-[10px]
            font-medium
            uppercase
            tracking-wide
            text-zinc-400
          "
        >
          AI Core
        </span>
      </div>
    </div>
  );
}