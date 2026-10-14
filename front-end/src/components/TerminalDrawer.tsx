import React, { useState } from 'react';
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

  return (
    <div className="border-t border-[#261B42] bg-[#080512] transition-all duration-200">
      {/* Bar toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-4 bg-[#0E071F] flex items-center justify-between cursor-pointer select-none hover:bg-[#150B2E] border-b border-[#261B42]"
      >
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>DIAGNOSTIC TERMINAL & EVENT STREAM</span>
          <span className="text-[10px] px-2 py-0.5 rounded-none border border-[#3B2564] bg-[#1E113E] text-[#C084FC]">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded-none"
            title="Clear Terminal"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />}
        </div>
      </div>

      {/* Terminal Content */}
      {isOpen && (
        <div className="h-36 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-[#06030D]">
          {logs.length === 0 ? (
            <div className="text-zinc-600 italic">No incoming events. Diagnostic engine listening...</div>
          ) : (
            logs.map((log, idx) => {
              const timeStr = new Date(log.time * 1000).toLocaleTimeString();
              const levelColor =
                log.level === 'BLOCKED' || log.level === 'CRITICAL'
                  ? 'text-[#EF4444]'
                  : log.level === 'THROTTLED' || log.level === 'WARNING'
                  ? 'text-[#F59E0B]'
                  : 'text-[#10B981]';

              return (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-zinc-600 shrink-0">[{timeStr}]</span>
                  <span className="text-[#C084FC] shrink-0 font-semibold">[{log.source}]</span>
                  <span className={`shrink-0 font-semibold ${levelColor}`}>[{log.level}]</span>
                  <span className="text-zinc-300 break-all">{log.text}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
