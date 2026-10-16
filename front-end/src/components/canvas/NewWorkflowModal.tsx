import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Copy, 
  Workflow, 
  Bot, 
  ShieldCheck, 
  Shield, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  Check 
} from 'lucide-react';
import { DEFAULT_RUNBOOKS } from './constants';

export interface NewWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, mode: 'blank' | 'duplicate' | 'template', templateId?: string) => void;
  activeWorkflowName: string;
}

export const NewWorkflowModal: React.FC<NewWorkflowModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  activeWorkflowName,
}) => {
  const [mode, setMode] = useState<'template' | 'blank' | 'duplicate'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('runbook-health-bot');
  const [workflowName, setWorkflowName] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'blank') {
        setWorkflowName('Custom Automation Workflow');
      } else if (mode === 'duplicate') {
        setWorkflowName(`${activeWorkflowName} (Clone)`);
      } else {
        const tpl = DEFAULT_RUNBOOKS.find((r) => r.id === selectedTemplateId);
        setWorkflowName(tpl ? `${tpl.name} (Custom)` : 'New Workflow');
      }
    }
  }, [isOpen, mode, selectedTemplateId, activeWorkflowName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(workflowName, mode, selectedTemplateId);
  };

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'runbook-health-bot':
        return <Bot className="w-4 h-4 text-[#10B981]" />;
      case 'runbook-slash-guard':
        return <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />;
      case 'runbook-rpc-shield':
        return <Shield className="w-4 h-4 text-[#38BDF8]" />;
      case 'runbook-dual-vm-sync':
        return <Layers className="w-4 h-4 text-[#EC4899]" />;
      case 'runbook-npos-compound':
        return <TrendingUp className="w-4 h-4 text-[#F59E0B]" />;
      default:
        return <Workflow className="w-4 h-4 text-[#8B5CF6]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div 
        className="relative w-full max-w-xl border border-[#2D1F52] bg-[#0E071F] p-6 shadow-2xl text-[#E2E8F0] font-mono space-y-5 tech-corner-accent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#261B42] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Create New Automation Canvas
              </h3>
              <p className="text-[11px] text-zinc-400">
                Design independent 24/7 bots, failover runbooks, and node guards.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-[#1A1033] border border-transparent hover:border-[#3B2564] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Creation Mode Tabs */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode('template')}
            className={`p-2.5 border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
              mode === 'template'
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white font-bold'
                : 'border-[#261B42] bg-[#110A24] text-zinc-400 hover:text-white hover:border-[#3B2564]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C084FC]" />
            <span>From Preset Template</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('blank')}
            className={`p-2.5 border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
              mode === 'blank'
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white font-bold'
                : 'border-[#261B42] bg-[#110A24] text-zinc-400 hover:text-white hover:border-[#3B2564]'
            }`}
          >
            <Plus className="w-4 h-4 text-[#10B981]" />
            <span>Blank Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('duplicate')}
            className={`p-2.5 border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
              mode === 'duplicate'
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white font-bold'
                : 'border-[#261B42] bg-[#110A24] text-zinc-400 hover:text-white hover:border-[#3B2564]'
            }`}
          >
            <Copy className="w-4 h-4 text-[#38BDF8]" />
            <span>Clone Active Canvas</span>
          </button>
        </div>

        {/* Mode Specific Body */}
        {mode === 'template' && (
          <div className="space-y-2">
            <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">
              Select Starting Template:
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {DEFAULT_RUNBOOKS.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-2.5 border text-left cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#8B5CF6] bg-[#180E30] text-white'
                        : 'border-[#261B42] bg-[#0A0516] text-zinc-400 hover:text-zinc-200 hover:border-[#3B2564]'
                    }`}
                  >
                    <div className="p-1.5 bg-[#140C2B] border border-[#2D1F52] shrink-0 mt-0.5">
                      {getTemplateIcon(tpl.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-zinc-100 truncate">
                          {tpl.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0 ml-1" />}
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                        {tpl.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {mode === 'duplicate' && (
          <div className="p-3 bg-[#110A24] border border-[#261B42] text-xs text-zinc-300 space-y-1">
            <div className="text-[11px] text-zinc-400">Cloning topology from:</div>
            <div className="font-bold text-white flex items-center gap-2">
              <Workflow className="w-4 h-4 text-[#8B5CF6]" />
              <span>{activeWorkflowName}</span>
            </div>
            <p className="text-[10px] text-zinc-400 pt-1">
              All nodes, configurations, and directed wires will be copied into an independent canvas.
            </p>
          </div>
        )}

        {mode === 'blank' && (
          <div className="p-3 bg-[#110A24] border border-[#261B42] text-xs text-zinc-300 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clean Slate Canvas</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Start with an empty workspace. Use the Node Toolbox on the left to drag &amp; drop telemetry watchers, security gates, and alert bots.
            </p>
          </div>
        )}

        {/* Workflow Name Input */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 border-t border-[#261B42]">
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">
              Workflow Name:
            </label>
            <input
              type="text"
              required
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g. 24/7 Discord Health Alert Bot"
              className="w-full bg-[#06030D] border border-[#261B42] focus:border-[#8B5CF6] text-white px-3 py-2 text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono border border-[#261B42] hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-lg shadow-[#8B5CF6]/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Canvas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
