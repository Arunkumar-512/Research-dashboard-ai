'use client';
import { useState, useEffect } from 'react';
import type { Components } from "react-markdown";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Loader2, Zap, Terminal, Bot, FileText, LayoutDashboard,
  RefreshCw, AlertCircle, Trash2, Trash, Send, Menu, X,
  Sparkles, History, Cpu, Database, Clock, ChevronRight,
  Brain, BarChart3, Globe2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Mermaid from '@/components/MermaidDiagram';
import rehypeRaw from 'rehype-raw';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
const STATUS_STAGES = ['ResearchAgent', 'Analyzer', 'Reporter'];

interface HistoryItem {
  id: number;
  query: string;
  created_at?: string;
  report_content?: string;
}

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");

    if (match?.[1] === "mermaid") {
      return (
        <Mermaid
          chart={String(children).replace(/\n$/, "")}
        />
      );
    }

    return (
      <code
        className="bg-slate-900 px-1 py-0.5 rounded text-cyan-300"
        {...props}
      >
        {children}
      </code>
    );
  },
};
export default function ResearchDashboard() {
  const [query, setQuery] = useState('');
  const [report, setReport] = useState<string>('');
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isMobile, setIsMobile] = useState(false);



  const downloadPDF = async () => {
    const input = document.getElementById("report-container");

    if (!input) {
      alert("Report not found.");
      return;
    }

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f172a",
        logging: false,
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

        heightLeft -= pdfHeight;
      }

      pdf.save("Research_Report.pdf");
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF.");
    }
  };
  const cleanContent = (content: string): string => {
    if (!content) return '';

    let cleaned = content;
    cleaned = cleaned.replace(/\[\{"type":"text","text":"/g, '');
    cleaned = cleaned.replace(/"\}\]/g, '');
    cleaned = cleaned.replace(/\\n/g, '\n');
    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.replace(/\\/g, '');
    cleaned = cleaned.replace(/```mermaid\n?\s*```/g, '');
    cleaned = cleaned.replace(/````mermaid/g, '```mermaid');
    cleaned = cleaned.replace(/````/g, '```');
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    return cleaned.trim();
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchHistory();
    setCurrentTime(new Date().toLocaleTimeString());
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 60000);

    checkBackendStatus();

    return () => clearInterval(interval);
  }, []);



  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    console.log(API_URL);

  const checkBackendStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/health-check`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setBackendStatus('online');
        setError(null);
      } else {
        setBackendStatus('offline');
      }
    } catch (err) {
      setBackendStatus('offline');
      setError('Backend server is not responding.');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/threads`);
      if (!res.ok) throw new Error("Server unreachable");
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("History fetch error:", err);
      setError("Cannot connect to backend.");
    }
  };

  const loadThread = async (id: number, queryText: string) => {
    setLoading(true);
    setQuery(queryText);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/thread/${id}`);
      if (!res.ok) throw new Error("Failed to load thread");
      const data = await res.json();
      const cleanedReport = cleanContent(typeof data.report_content === 'string' ? data.report_content : "");
      setReport(cleanedReport);
      if (isMobile) setIsSidebarOpen(false);
    } catch (err) {
      console.error(err);
      setError("Could not select thread.");
    }
    setLoading(false);
  };

  const deleteHistoryItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await fetch(
        `${API_URL}/thread/${id}`,
        {
          method: 'DELETE'
        }
      );
      if (!res.ok) throw new Error("Failed to delete thread");
      setHistory(prev => prev.filter(item => item.id !== id));
      if (history.find(item => item.id === id)?.query === query) {
        setReport('');
        setQuery('');
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("Could not delete.");
    }
  };

  const clearAllHistory = async () => {
    try {
      const res = await fetch(
        `${API_URL}/threads`,
        {
          method: 'DELETE'
        }
      );
      if (!res.ok) throw new Error("Failed to clear history");
      setHistory([]);
      setReport('');
      setQuery('');
    } catch (err) {
      console.error("Clear history error:", err);
      setError("Could not clear history.");
    }
  };

  const startResearch = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setReport('');
    setActiveStage(null);
    setLogs(['Connecting to research agent...']);

    try {
      const encodedQuery = encodeURIComponent(query);
      const url =
        `${API_URL}/stream-research?query=${encodedQuery}&thread_id=default_${Date.now()}`;
      setLogs(prev => [...prev, `Researching: "${query.substring(0, 50)}..."`]);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');

        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.replace('data: ', '');
              const data = JSON.parse(jsonStr);

              if (data.node) {
                setActiveStage(data.node);
                setLogs(prev => [...prev, `[${data.node}] Processing...`]);
              }

              if (data.output) {
                let textToAppend = data.output;

                if (typeof data.output === 'object') {
                  if (data.output.text) textToAppend = data.output.text;
                  else if (data.output.content) textToAppend = data.output.content;
                  else textToAppend = JSON.stringify(data.output);
                }

                textToAppend = textToAppend.replace(/\\n/g, '\n');
                fullContent += textToAppend;
                const cleanedChunk = cleanContent(textToAppend);
                setReport(prev => prev + cleanedChunk);
              }

              if (data.error) {
                setLogs(prev => [...prev, `Error: ${data.error}`]);
                setError(data.error);
              }

            } catch (parseErr) {
              console.debug("Parse error:", parseErr);
            }
          }
        }
      }

      const finalCleanedContent = cleanContent(fullContent);
      setReport(finalCleanedContent);

      if (finalCleanedContent.length > 100) {
        setLogs(prev => [...prev, 'Saving report to database...']);
        await fetch(
          `${API_URL}/save-report`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query,
              content: finalCleanedContent
            })
          }
        );
        setLogs(prev => [...prev, 'Research complete & saved!']);
        fetchHistory();
      } else {
        setLogs(prev => [...prev, 'No content received. Check if your research agent is working.']);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Research failed: ${errorMessage}`);
      setLogs(prev => [...prev, `Error: ${errorMessage}`]);
      console.error(err);
    } finally {
      setLoading(false);
      setActiveStage(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2 text-sm max-w-[90vw] sm:max-w-lg"
        >
          <AlertCircle size={14} />
          <span className="flex-1">{error}</span>
        </motion.div>
      )}

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 border border-slate-700 p-2 rounded-lg text-slate-300"
      >
        {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              />
            )}
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed lg:relative w-72 sm:w-80 z-40 bg-slate-800 border-r border-slate-700 flex flex-col h-full"
            >
              <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-600 p-2 rounded-lg">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-lg">ARCHIVE.AI</span>
                    <p className="text-xs text-slate-400">Intelligent Research</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <button
                  onClick={() => { setReport(''); setQuery(''); setError(null); if (isMobile) setIsSidebarOpen(false); }}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  New Research Session
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History size={12} className="text-cyan-500" />
                    <p className="text-xs font-semibold uppercase text-slate-400">Research History</p>
                  </div>
                  {history.length > 0 && (
                    <button onClick={clearAllHistory} className="text-slate-500 hover:text-red-400">
                      <Trash size={12} />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {history.length === 0 ? (
                    <div className="text-center py-8">
                      <Database size={24} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No research history yet</p>
                    </div>
                  ) : (
                    history.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => loadThread(h.id, h.query)}
                        className="group p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 cursor-pointer transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-300 truncate">{h.query}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {h.created_at ? new Date(h.created_at).toLocaleDateString() : 'Saved'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs font-semibold uppercase">
                      {backendStatus === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Cpu size={10} />
                    <span>{backendStatus === 'online' ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Status Panel */}
      <aside className="w-full lg:w-80 border-l border-slate-700 flex flex-col bg-slate-800/30 h-auto lg:h-full z-20 order-last lg:order-none">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-cyan-500" />
              <span className="text-sm font-bold uppercase tracking-wider">Processing</span>
            </div>
            {loading && <RefreshCw size={12} className="animate-spin text-cyan-500" />}
          </div>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            {STATUS_STAGES.map((stage, idx) => {
              const isCurrent = activeStage === stage;
              const isCompleted = activeStage && STATUS_STAGES.indexOf(activeStage) > idx;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isCurrent ? 'bg-cyan-600' : isCompleted ? 'bg-green-600' : 'bg-slate-700'
                    }`}>
                    {isCurrent && <Loader2 size={10} className="animate-spin text-white" />}
                    {isCompleted && !isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    {!isCurrent && !isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isCurrent ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-slate-500'}`}>
                      {stage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Logs</div>
            <div className="bg-slate-900 rounded-lg p-2 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-center py-4">Waiting for research...</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="text-slate-400">
                    <span className="text-cyan-500 mr-2">$</span>
                    {l}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-slate-500" />
                <span>{currentTime || '--:--:--'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Database size={10} className="text-slate-500" />
                <span>{history.length} sessions</span>
              </div>
            </div>
            <div className={`px-2 py-0.5 rounded font-semibold text-xs ${loading ? 'bg-cyan-500/20 text-cyan-400' :
              backendStatus === 'online' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
              }`}>
              {loading ? 'ACTIVE' : backendStatus === 'online' ? 'READY' : 'OFFLINE'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <div className="max-w-4xl mx-auto">
            {!report && !loading && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400 uppercase">AI-Powered Research</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">Deep Research Assistant</h1>
                <p className="text-sm text-slate-400">Enter any topic to generate a comprehensive research report with diagrams</p>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl focus-within:border-cyan-500 transition-colors">
                <Bot className="absolute left-3 text-slate-500" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startResearch()}
                  className="w-full pl-10 pr-24 py-3 bg-transparent rounded-xl focus:outline-none text-sm placeholder-slate-500"
                  placeholder="e.g., 'How do recommendation engines work?'"
                />
                <button
                  onClick={startResearch}
                  disabled={loading || backendStatus === 'offline'}
                  className="absolute right-2 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  <span className="ml-1">{loading ? 'Processing' : 'Research'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {report ? (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden"
                >
                  <div className="border-b border-slate-700 px-4 py-3 bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-cyan-500" />
                      <span className="text-xs font-semibold uppercase text-slate-400">Research Report</span>
                    </div>
                  </div>
                  <div
                    id="report-container"
                    className="p-6 prose prose-sm max-w-none text-slate-200"
                  >

                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={markdownComponents}
                    >
                      {report}
                    </ReactMarkdown>
                    <button
                      onClick={downloadPDF}
                      className="mt-6 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >
                      Download PDF
                    </button>

                  </div>
                </motion.div>
              ) : loading ? (
                <motion.div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-cyan-500 mb-3" />
                  <p className="text-slate-400 text-sm">Generating your research report...</p>
                </motion.div>
              ) : (
                <motion.div className="flex flex-col items-center justify-center py-20">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="text-center p-4 rounded-lg bg-slate-800/20 border border-slate-700">
                      <Brain size={20} className="text-cyan-500 mx-auto mb-2" />
                      <p className="text-xs font-medium">Deep Analysis</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-800/20 border border-slate-700">
                      <Globe2 size={20} className="text-blue-500 mx-auto mb-2" />
                      <p className="text-xs font-medium">Web Sources</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-slate-800/20 border border-slate-700">
                      <BarChart3 size={20} className="text-violet-500 mx-auto mb-2" />
                      <p className="text-xs font-medium">Data-Driven</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}