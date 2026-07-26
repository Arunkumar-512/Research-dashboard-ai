'use client';

import React, { useState, useEffect } from 'react';
import ChatInput from '@/components/ChatInput';
import DashboardCanvas from '@/components/DashboardCanvas';
import ThinkingConsole from '@/components/ThinkingConsole';
import {
  LayoutDashboard,
  History,
  RotateCcw,
} from 'lucide-react';

import CSVUploadZone from '@/components/CSVUploadZone';
import DataPreviewGrid from '@/components/DataPreviewGrid';

interface LogLine {
  type: 'status' | 'code' | 'error';
  content: string;
}

interface HistoryItem {
  prompt: string;
  canvasData: any;
  executionData: any[];
  timestamp: string;
}

interface ActiveDatasetState {
  columns: string[];
  rows: Record<string, any>[];
  filename: string;
}

export default function Home() {

  const [isLoading, setIsLoading] = useState(false);

  const [canvasData, setCanvasData] = useState<any>(null);

  const [executionData, setExecutionData] = useState<any[]>([]);

  const [logs, setLogs] = useState<LogLine[]>([]);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [activeDataset, setActiveDataset] =
    useState<ActiveDatasetState | null>(null);

  useEffect(() => {
    const cachedDataset =
      localStorage.getItem('active_dataset_cache');

    const cachedCanvas =
      localStorage.getItem('active_canvas_cache');

    const cachedExecutionData =
      localStorage.getItem(
        'active_execution_data_cache'
      );

    const cachedLogs =
      localStorage.getItem('active_logs_cache');

    const cachedHistory =
      localStorage.getItem(
        'dashboard_history_cache'
      );

    if (cachedDataset) {
      try {
        setActiveDataset(
          JSON.parse(cachedDataset)
        );
      } catch (e) {
        console.error(e);
      }
    }

    if (cachedCanvas) {
      try {
        setCanvasData(
          JSON.parse(cachedCanvas)
        );
      } catch (e) {
        console.error(e);
      }
    }

    if (cachedExecutionData) {
      try {
        setExecutionData(
          JSON.parse(cachedExecutionData)
        );
      } catch (e) {
        console.error(e);
      }
    }

    if (cachedLogs) {
      try {
        setLogs(
          JSON.parse(cachedLogs)
        );
      } catch (e) {
        console.error(e);
      }
    }

    if (cachedHistory) {
      try {
        setHistory(
          JSON.parse(cachedHistory)
        );
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handlePromptSubmit = async (
    prompt: string
  ) => {

    setIsLoading(true);

    setLogs([]);

    localStorage.removeItem(
      'active_logs_cache'
    );

    let currentActiveLayout = null;

    const cachedCanvas =
      localStorage.getItem(
        'active_canvas_cache'
      );

    if (cachedCanvas) {
      try {
        currentActiveLayout =
          JSON.parse(cachedCanvas);
      } catch (e) {
        console.error(
          'Failed to parse canvas cache:',
          e
        );
      }
    }

    try {

      const response = await fetch(
        'http://localhost:8000/api/analyze',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            prompt,
            currentLayout:
              currentActiveLayout,
          }),
        }
      );

      if (!response.body) return;

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let finished = false;

      let buffer = '';

      let trackingLogs: LogLine[] = [];

      while (!finished) {

        const { value, done } =
          await reader.read();

        finished = done;

        if (value) {

          buffer += decoder.decode(value, {
            stream: !finished,
          });

          const lines =
            buffer.split('\n\n');

          buffer = lines.pop() || '';

          for (const line of lines) {

            if (
              line.startsWith('data: ')
            ) {

              const rawData =
                line
                  .replace('data: ', '')
                  .trim();

              if (!rawData) continue;

              const parsed =
                JSON.parse(rawData);

              if (
                parsed.type ===
                'final_result'
              ) {

                const payload =
                  parsed.payload;

                const extractedLayout =
                  payload.layout ||
                  payload.ui_layout || {
                    canvasTitle:
                      'Executive Data Canvas',
                    widgets: [],
                  };

                setCanvasData(
                  extractedLayout
                );

                setExecutionData(
                  payload.data || []
                );

                localStorage.setItem(
                  'active_canvas_cache',
                  JSON.stringify(
                    extractedLayout
                  )
                );

                localStorage.setItem(
                  'active_execution_data_cache',
                  JSON.stringify(
                    payload.data || []
                  )
                );

                setHistory((prev) => {

                  const updatedHistory = [
                    {
                      prompt,

                      canvasData:
                        extractedLayout,

                      executionData:
                        payload.data || [],

                      timestamp:
                        new Date().toLocaleTimeString(
                          [],
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        ),
                    },

                    ...prev,
                  ];

                  localStorage.setItem(
                    'dashboard_history_cache',
                    JSON.stringify(
                      updatedHistory
                    )
                  );

                  return updatedHistory;
                });

              } else {

                trackingLogs = [
                  ...trackingLogs,
                  {
                    type: parsed.type,
                    content:
                      parsed.content,
                  },
                ];

                setLogs(trackingLogs);

                localStorage.setItem(
                  'active_logs_cache',
                  JSON.stringify(
                    trackingLogs
                  )
                );
              }
            }
          }
        }
      }

    } catch (err) {

      console.error(
        'Streaming error:',
        err
      );

    } finally {

      setIsLoading(false);
    }
  };

  const handleResetWorkspace = () => {

    setCanvasData(null);

    setExecutionData([]);

    setLogs([]);

    setActiveDataset(null);

    setHistory([]);

    localStorage.removeItem(
      'active_dataset_cache'
    );

    localStorage.removeItem(
      'active_canvas_cache'
    );

    localStorage.removeItem(
      'active_execution_data_cache'
    );

    localStorage.removeItem(
      'active_logs_cache'
    );

    localStorage.removeItem(
      'dashboard_history_cache'
    );
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">

      {/* PAGE CONTAINER */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">

        {/* TOP HEADER */}
        <div className="mb-8 border border-zinc-200 rounded-2xl bg-white px-8 py-7 shadow-sm">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

            {/* LEFT */}
            <div className="max-w-3xl">

              <div className="inline-flex items-center rounded-md bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 mb-4">
                AI Analytics Platform
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-zinc-950">
                AI Analytics Canvas
              </h1>

              <p className="mt-4 text-base leading-7 text-zinc-600">
                Intelligent workspace for querying datasets, generating dashboards,
                restoring layouts, and managing live analytical visualizations.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    Runtime
                  </p>

                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    Active
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    Dataset Sync
                  </p>

                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    Connected
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    Visualization
                  </p>

                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    Executive Canvas
                  </p>
                </div>

              </div>
            </div>

            {/* RIGHT */}
            <div className="w-full xl:w-[420px] shrink-0">

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">

                <h2 className="text-lg font-semibold text-zinc-900">
                  Upload Dataset
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Upload CSV or Excel files to initialize the workspace.
                </p>

                <div className="mt-5">
                  <CSVUploadZone
                    onUploadSuccess={(
                      cols,
                      filename,
                      previewRows
                    ) => {

                      console.log(
                        `Active core redirected to ${filename}. Fields detected:`,
                        cols
                      );

                      const datasetPayload = {
                        columns: cols,
                        rows: previewRows || [],
                        filename,
                      };

                      setActiveDataset(
                        datasetPayload
                      );

                      localStorage.setItem(
                        'active_dataset_cache',
                        JSON.stringify(
                          datasetPayload
                        )
                      );

                      setLogs([
                        {
                          type: 'status',
                          content:
                            `Core schema updated! New fields recognized: ${cols.join(', ')}`,
                        },
                      ]);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DATASET PREVIEW */}
        {activeDataset && (

          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 border-b border-zinc-200">

              <div>

                <h2 className="text-xl font-semibold text-zinc-900">
                  Dataset Preview
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {activeDataset.filename}
                </p>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700">
                {activeDataset.columns.length} Fields
              </div>
            </div>

            <div className="p-5">
              <DataPreviewGrid
                columns={activeDataset.columns}
                rows={activeDataset.rows}
                filename={activeDataset.filename}
              />
            </div>
          </div>
        )}

        {/* QUERY INPUT */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white shadow-sm p-5">

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">
              AI Query Interface
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Generate dashboards, metrics, charts, and visual layouts using natural language.
            </p>
          </div>

          <ChatInput
            onSubmit={handlePromptSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* MAIN GRID */}
        <div
          className="
    grid
    grid-cols-1
    xl:grid-cols-[380px_minmax(0,1fr)]
    2xl:grid-cols-[420px_minmax(0,1fr)]
    gap-8
    items-start
  "
        >

          {/* SIDEBAR */}
          <div className="space-y-6">


            {/* THINKING CONSOLE */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">

              <div className="px-5 py-4 border-b border-zinc-200">

                <h3 className="text-base font-semibold text-zinc-900">
                  Live Execution
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Real-time AI processing stream
                </p>
              </div>

              <div className="p-4">
                <ThinkingConsole
                  logs={logs}
                  isOpen={
                    isLoading ||
                    logs.length > 0
                  }
                />
              </div>
            </div>

            {/* HISTORY */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">

              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200">

                <div>

                  <h3 className="text-base font-semibold text-zinc-900">
                    Saved Layouts
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Restore previous dashboard states
                  </p>
                </div>

                <button
                  onClick={handleResetWorkspace}
                  className="
                  rounded-lg
                  border
                  border-zinc-200
                  bg-white
                  px-3
                  py-2
                  text-sm
                  text-zinc-600
                  hover:bg-zinc-100
                  transition-colors
                "
                >
                  Reset
                </button>
              </div>

              <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">

                {history.length === 0 && (

                  <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center">

                    <p className="text-sm text-zinc-500">
                      No saved layouts available.
                    </p>
                  </div>
                )}

                {history.map((item, index) => (

                  <button
                    key={index}

                    onClick={() => {

                      setCanvasData(
                        item.canvasData
                      );

                      setExecutionData(
                        item.executionData || []
                      );

                      localStorage.setItem(
                        'active_canvas_cache',
                        JSON.stringify(
                          item.canvasData
                        )
                      );

                      localStorage.setItem(
                        'active_execution_data_cache',
                        JSON.stringify(
                          item.executionData || []
                        )
                      );

                      setLogs([]);
                    }}

                    className="
                    w-full
                    rounded-xl
                    border
                    border-zinc-200
                    bg-white
                    p-4
                    text-left
                    hover:bg-zinc-50
                    transition-colors
                  "
                  >

                    <p className="text-sm font-medium text-zinc-800 line-clamp-2">
                      "{item.prompt}"
                    </p>

                    <div className="mt-4 flex items-center justify-between">

                      <span className="text-xs text-zinc-500">
                        {item.timestamp}
                      </span>

                      <span className="text-xs font-medium text-zinc-700">
                        Restore
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* DASHBOARD */}
          <div className="min-w-0">

            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">

              {/* HEADER */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-7 py-5 border-b border-zinc-200">

                <div>

                  <h2 className="text-2xl font-bold text-zinc-900">
                    Executive Dashboard
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Dynamic AI-generated visualization workspace.
                  </p>
                </div>

                <div className="flex items-center gap-3">

                  <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700">
                    Active
                  </div>

                  <div className="rounded-md bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs font-medium text-indigo-700">
                    Live Canvas
                  </div>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-6">

                <DashboardCanvas
                  layout={
                    canvasData || {
                      canvasTitle:
                        'Executive Data Canvas',
                      widgets: [],
                    }
                  }

                  executionData={
                    executionData
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}