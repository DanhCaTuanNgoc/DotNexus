import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface LogItem {
  source: string;
  level: string;
  time: number;
  text: string;
}

interface TerminalDrawerProps {
  logs: LogItem[];
  onClear: () => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({ logs, onClear }) => {
  const [isOpen, setIsOpen] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to latest event when new log arrives
  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.length, isOpen]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#261B42] bg-[#080512]/95 backdrop-blur-md transition-all duration-200 shadow-2xl shadow-black/80">
      {/* Bar toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-4 bg-[#0E071F]/90 flex items-center justify-between cursor-pointer select-none hover:bg-[#150B2E] border-b border-[#261B42]/70"
      >
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="font-semibold tracking-wide">DIAGNOSTIC TERMINAL & EVENT STREAM</span>
          <span className="text-[10px] px-2 py-0.5 rounded-none border border-[#3B2564] bg-[#1E113E] text-[#C084FC] tabular-nums font-bold">
            {logs.length} events
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-[#10B981] ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            LIVE FEED
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded-none hover:bg-[#261B42]/50 transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="text-zinc-400 hover:text-zinc-200 p-0.5 transition-colors"
            title={isOpen ? "Minimize Terminal" : "Maximize Terminal"}
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      {isOpen && (
        <div className="h-36 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-[#06030D]/95 border-b border-[#261B42]/50">
          {logs.length === 0 ? (
            <div className="text-zinc-600 italic py-2">No incoming events. Diagnostic engine listening on Portaldot RPC...</div>
          ) : (
            <>
              {logs.map((log, idx) => {
                const timeStr = new Date(log.time * 1000).toLocaleTimeString();
                const levelColor =
                  log.level === 'BLOCKED' || log.level === 'CRITICAL'
                    ? 'text-[#EF4444]'
                    : log.level === 'THROTTLED' || log.level === 'WARNING'
                    ? 'text-[#F59E0B]'
                    : 'text-[#10B981]';

                return (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed hover:bg-[#110A24]/40 px-1 py-0.5 transition-colors">
                    <span className="text-zinc-600 shrink-0 tabular-nums">[{timeStr}]</span>
                    <span className="text-[#C084FC] shrink-0 font-semibold">[{log.source}]</span>
                    <span className={`shrink-0 font-semibold ${levelColor}`}>[{log.level}]</span>
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
