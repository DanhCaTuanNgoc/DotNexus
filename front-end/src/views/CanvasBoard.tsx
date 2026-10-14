import React, { useState, useEffect } from 'react';
import { Workflow, Play, CheckCircle2, ArrowRight, ShieldCheck, Cpu, Bell, Activity } from 'lucide-react';
import { RunbookDAG, api } from '../services/api';

export const CanvasBoard: React.FC = () => {
  const [runbooks, setRunbooks] = useState<RunbookDAG[]>([]);
  const [selectedRunbookId, setSelectedRunbookId] = useState<string>('runbook-slash-guard');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any | null>(null);

  useEffect(() => {
    loadRunbooks();
  }, []);

  const loadRunbooks = async () => {
    try {
      const res = await api.getRunbooks();
      if (res.success) {
        setRunbooks(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const res = await api.executeRunbook(selectedRunbookId);
      if (res.success) {
        setExecResult(res.data);
      }
    } finally {
      setExecuting(false);
    }
  };

  const activeRunbook = runbooks.find((r) => r.id === selectedRunbookId) || runbooks[0];

  const getNodeBadgeColor = (type: string) => {
    switch (type) {
      case 'infra':
        return 'border-[#6366F1] text-[#818CF8] bg-[#181C3D]';
      case 'watcher':
        return 'border-[#E6007A] text-[#E6007A] bg-[#2E0B20]';
      case 'security':
        return 'border-[#8B5CF6] text-[#C084FC] bg-[#1F143D]';
      case 'action':
        return 'border-[#10B981] text-[#10B981] bg-[#0E2820]';
      default:
        return 'border-zinc-700 text-zinc-300 bg-zinc-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Runbook Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
            <Workflow className="w-4 h-4 text-[#8B5CF6]" />
            Visual DAG Automation Canvas
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Chain monitoring triggers and autonomous failover actions into verifiable operational runbooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector */}
          <select
            value={selectedRunbookId}
            onChange={(e) => {
              setSelectedRunbookId(e.target.value);
              setExecResult(null);
            }}
            className="bg-[#130E26] border border-[#261B42] text-xs font-mono text-[#C084FC] px-3 py-1.5 rounded focus:outline-none focus:border-[#8B5CF6]"
          >
            {runbooks.map((r) => (
              <option key={r.id} value={r.id}>
                [{r.category}] {r.name}
              </option>
            ))}
          </select>

          {/* Execute Pipeline */}
          <button
            onClick={handleExecute}
            disabled={executing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium transition-colors shadow-lg shadow-[#8B5CF6]/20"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${executing ? 'animate-pulse' : ''}`} />
            {executing ? 'Executing Runbook...' : 'Execute Runbook'}
          </button>
        </div>
      </div>

      {/* Canvas Workspace Viewport */}
      {activeRunbook && (
        <div className="relative min-h-[380px] p-6 rounded-lg border border-[#261B42] bg-[#090610] overflow-x-auto shadow-inner">
          <div className="text-[11px] font-mono text-zinc-500 mb-6 flex items-center justify-between">
            <span>PIPELINE TOPOLOGY: {activeRunbook.name}</span>
            <span className="text-zinc-600">Pure Tech Microchip Board Layout</span>
          </div>

          {/* Interactive DAG Nodes Row */}
          <div className="flex items-center justify-around gap-6 min-w-[700px] my-6">
            {activeRunbook.nodes.map((node, idx) => (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div className="w-64 p-4 rounded border border-[#2D1F52] bg-[#130E26] hover:border-[#8B5CF6] transition-all shadow-md group">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${getNodeBadgeColor(node.type)}`}>
                      {node.type}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6] group-hover:animate-ping" />
                  </div>

                  <div className="text-xs font-mono font-bold text-white mb-2">
                    {node.label}
                  </div>

                  <div className="p-2 rounded bg-[#0B0813] border border-[#261B42]/50 text-[10px] font-mono text-zinc-400 space-y-1">
                    {Object.entries(node.data).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-zinc-500 capitalize">{k}:</span>
                        <span className="text-zinc-200">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connection Edge */}
                {idx < activeRunbook.nodes.length - 1 && (
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="w-12 h-[2px] bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#C084FC] rounded-full animate-ping" />
                    </div>
                    {activeRunbook.edges[idx]?.label && (
                      <span className="text-[9px] font-mono text-zinc-500 mt-1 whitespace-nowrap">
                        {activeRunbook.edges[idx].label}
                      </span>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="text-xs text-zinc-400 font-mono mt-8 p-3 rounded bg-[#130E26] border border-[#261B42]">
            <span className="text-[#C084FC] font-semibold">Runbook Rationale: </span>
            {activeRunbook.description}
          </div>
        </div>
      )}

      {/* Execution Results Summary */}
      {execResult && (
        <div className="p-4 rounded-lg border border-[#10B981]/40 bg-[#130E26] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#10B981] font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Pipeline Executed Successfully in {execResult.duration_ms}ms
            </span>
            <span className="text-zinc-500">ID: {execResult.execution_id}</span>
          </div>

          <div className="space-y-1.5">
            {execResult.steps.map((st: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-mono p-2 rounded bg-[#0B0813] border border-[#261B42]">
                <span className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold">
                  {st.status}
                </span>
                <span className="text-white font-semibold">{st.step}:</span>
                <span className="text-zinc-300">{st.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
