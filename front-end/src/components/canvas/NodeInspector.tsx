import React from 'react';
import { X, Trash2, Sliders, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { CanvasNode, SafetyIssue } from './types';
import { CATEGORY_THEMES } from './constants';

interface NodeInspectorProps {
  node: CanvasNode | null;
  issues: SafetyIssue[];
  onClose: () => void;
  onUpdateConfig: (nodeId: string, newConfig: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  issues,
  onClose,
  onUpdateConfig,
  onDeleteNode,
}) => {
  if (!node) return null;

  const theme = CATEGORY_THEMES[node.data.category] || CATEGORY_THEMES.INFRA;
  const nodeIssues = issues.filter((i) => i.nodeId === node.id);

  const handleFieldChange = (key: string, value: string) => {
    onUpdateConfig(node.id, {
      ...node.data.config,
      [key]: value,
    });
  };

  return (
    <div className="w-80 border-l border-[#261B42] bg-[#0E071F]/95 backdrop-blur-md flex flex-col justify-between p-4 z-20 shadow-2xl overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#261B42]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Node Inspector
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded-none hover:bg-[#261B42]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Node Meta */}
        <div className="my-4 space-y-3">
          <div>
            <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-none border font-bold ${theme.badgeBg}`}>
              {node.data.category}
            </span>
            <h3 className="text-sm font-mono font-bold text-white mt-1.5">{node.data.label}</h3>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5 leading-relaxed">
              {node.data.description}
            </p>
          </div>

          {/* Safety Status for this node */}
          {nodeIssues.length > 0 ? (
            <div className="p-3 border border-rose-500/60 bg-rose-950/40 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Safety Guard Warning</span>
              </div>
              {nodeIssues.map((issue) => (
                <div key={issue.id} className="text-[10px] text-zinc-300 font-mono leading-normal">
                  {issue.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 border border-[#10B981]/40 bg-[#0E2820]/40 flex items-center gap-2 text-xs font-mono text-[#10B981]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Topology Guard Verified</span>
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-mono text-[#C084FC] uppercase font-bold block">
              Parameter Configuration
            </span>

            {Object.entries(node.data.config || {}).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 capitalize block">
                  {key}
                </label>
                <input
                  type="text"
                  value={String(val)}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className="w-full bg-[#06030D] border border-[#261B42] text-xs font-mono text-zinc-200 px-2.5 py-1.5 rounded-none focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>
            ))}

            {Object.keys(node.data.config || {}).length === 0 && (
              <div className="text-zinc-600 text-xs font-mono italic">
                No configurable runtime parameters for this node.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-[#261B42]">
        <button
          onClick={() => onDeleteNode(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono text-rose-400 border border-rose-900/60 bg-rose-950/30 hover:bg-rose-900/50 hover:text-white transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node from DAG</span>
        </button>
      </div>
    </div>
  );
};
