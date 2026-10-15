import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, Copy, Check, Filter } from 'lucide-react';
import { storage } from '../services/storage';
import { LogItem } from '../services/api';

interface TerminalDrawerProps {
  logs: LogItem[];
  onClear: () => void;
  selectedNodeId?: string | null;
  onClearNodeFilter?: () => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  logs,
  onClear,
  selectedNodeId,
  onClearNodeFilter,
  isOpen: controlledIsOpen,
  onToggleOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(() => storage.getTerminalOpen(true));
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [activeTab, setActiveTabState] = useState<string>(() => storage.getTerminalFilter('ALL'));
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const setIsOpen = (next: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(next);
    } else {
      setInternalIsOpen(next);
      storage.setTerminalOpen(next);
    }
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    storage.setTerminalFilter(tab);
  };

  // Filter logs by source tab and node filter
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Tab filter
      if (activeTab === 'DAG' && log.source !== 'DAG_ENGINE' && log.source !== 'RUNBOOK') return false;
      if (activeTab === 'SECURITY' && log.source !== 'SLASH_GUARD' && log.source !== 'RPC_SHIELD') return false;
      if (activeTab === 'SYSTEM' && (log.source === 'DAG_ENGINE' || log.source === 'RUNBOOK')) return false;

      // 2. Node filter (if selected on Canvas)
      if (selectedNodeId && log.nodeId && log.nodeId !== selectedNodeId) {
        return false;
      }

      return true;
    });
  }, [logs, activeTab, selectedNodeId]);

  // Auto-scroll to latest event when new log arrives
  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs.length, isOpen]);

  // Copy logs handler
  const handleCopyLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = filteredLogs
      .map(
        (l) =>
          `[${new Date(l.time * 1000).toISOString()}] [${l.source}] [${l.level}]${
            l.nodeId ? ` (Node: ${l.nodeId})` : ''
          } ${l.text}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#261B42] bg-[#080512]/95 backdrop-blur-md transition-all duration-200 shadow-2xl shadow-black/80">
      {/* Bar toggle & Controls */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-4 bg-[#0E071F]/90 flex items-center justify-between cursor-pointer select-none hover:bg-[#150B2E] border-b border-[#261B42]/70"
      >
        <div className="flex items-center gap-2.5 text-xs font-mono text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="font-semibold tracking-wide hidden sm:inline">DIAGNOSTIC TERMINAL & EVENT STREAM</span>
          <span className="font-semibold tracking-wide sm:hidden">TERMINAL</span>
          
          <span className="text-[10px] px-2 py-0.2 rounded-none border border-[#3B2564] bg-[#1E113E] text-[#C084FC] tabular-nums font-bold">
            {filteredLogs.length} events
          </span>

          <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono text-[#10B981] ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            LIVE FEED
          </span>

          {/* Active Node Filter Badge */}
          {selectedNodeId && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onClearNodeFilter?.();
              }}
              className="flex items-center gap-1 px-1.5 py-0.2 bg-[#581C87] border border-[#C084FC] text-[9px] font-mono text-white cursor-pointer hover:bg-rose-950 hover:border-rose-500 transition-colors"
              title="Filter active: Click to clear node filter"
            >
              <Filter className="w-2.5 h-2.5 text-[#C084FC]" />
              <span>Node: {selectedNodeId}</span>
              <span className="text-zinc-300 hover:text-white font-bold ml-0.5">✕</span>
            </div>
          )}
        </div>

        {/* Center Tabs (Visible when open) */}
        {isOpen && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="hidden sm:flex items-center gap-1 bg-[#06030D] p-0.5 border border-[#261B42]"
          >
            {(['ALL', 'DAG', 'SECURITY', 'SYSTEM'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#7C3AED] text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1A0E38]'
                }`}
              >
                {tab === 'DAG' ? 'DAG Runbook' : tab}
              </button>
            ))}
          </div>
        )}

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              onClick={handleCopyLogs}
              className="text-zinc-400 hover:text-zinc-200 p-1 hover:bg-[#261B42]/50 transition-colors cursor-pointer"
              title="Copy Terminal Logs"
            >
              {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-zinc-400 hover:text-rose-400 p-1 hover:bg-[#261B42]/50 transition-colors cursor-pointer"
            title="Clear Terminal Logs"
          >
            <Trash2 className="w-3 h-3" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="text-zinc-400 hover:text-zinc-200 p-1 transition-colors cursor-pointer"
            title={isOpen ? "Minimize Terminal" : "Maximize Terminal"}
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      {isOpen && (
        <div className="h-40 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-[#06030D]/95 border-b border-[#261B42]/50">
          {filteredLogs.length === 0 ? (
            <div className="text-zinc-600 italic py-2">
              {selectedNodeId
                ? `No execution logs found for Node ID: "${selectedNodeId}". Run pipeline or click on another node.`
                : 'No incoming events in this view. Diagnostic engine listening on Portaldot RPC...'}
            </div>
          ) : (
            <>
              {filteredLogs.map((log, idx) => {
                const timeStr = new Date(log.time * 1000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const levelColor =
                  log.level === 'BLOCKED' || log.level === 'CRITICAL' || log.level === 'ERROR'
                    ? 'text-[#EF4444]'
                    : log.level === 'THROTTLED' || log.level === 'WARNING' || log.level === 'WARN'
                    ? 'text-[#F59E0B]'
                    : log.level === 'RUNNING'
                    ? 'text-[#A855F7] animate-pulse'
                    : 'text-[#10B981]';

                const sourceColor =
                  log.source === 'DAG_ENGINE' || log.source === 'RUNBOOK'
                    ? 'text-[#C084FC]'
                    : log.source === 'SLASH_GUARD'
                    ? 'text-rose-400'
                    : log.source === 'RPC_SHIELD'
                    ? 'text-amber-400'
                    : 'text-sky-400';

                return (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed hover:bg-[#110A24]/40 px-1 py-0.5 transition-colors">
                    <span className="text-zinc-600 shrink-0 tabular-nums">[{timeStr}]</span>
                    <span className={`${sourceColor} shrink-0 font-semibold`}>[{log.source}]</span>
                    <span className={`shrink-0 font-semibold ${levelColor}`}>[{log.level}]</span>
                    {log.nodeId && (
                      <span className="text-[#8B5CF6] font-semibold shrink-0">({log.nodeId})</span>
                    )}
                    <span className="text-zinc-300 break-all">{log.text}</span>
                  </div>
                );
              })}
              <div ref={endRef} />
            </>
          )}
        </div>
      )}
    </div>
  );
};
