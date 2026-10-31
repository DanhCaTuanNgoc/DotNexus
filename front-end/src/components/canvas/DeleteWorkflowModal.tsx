import React, { useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { CanvasWorkflow } from './types';

export interface DeleteWorkflowModalProps {
  isOpen: boolean;
  workflow: CanvasWorkflow | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteWorkflowModal: React.FC<DeleteWorkflowModalProps> = ({
  isOpen,
  workflow,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !workflow) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-workflow-title"
    >
      <div 
        className="relative w-full max-w-md border border-rose-900/50 bg-[#0E0616] p-5 shadow-2xl text-[#E2E8F0] font-mono space-y-4 tech-corner-accent"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-950/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-none bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 id="delete-workflow-title" className="text-xs font-bold text-white uppercase tracking-wider">
                Delete Automation Canvas
              </h3>
              <p className="text-[10px] text-zinc-400">
                Permanent Runbook Removal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-[#1A0E24] border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Are you sure you want to delete this custom automation canvas? This action cannot be undone.
          </p>

          {/* Workflow Snapshot Card */}
          <div className="p-3 bg-[#08030F] border border-[#2E162B] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate max-w-[280px]" title={workflow.name}>
                {workflow.name}
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
                {workflow.category || 'CUSTOM'}
              </span>
            </div>
            {workflow.description && (
              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">
                {workflow.description}
              </p>
            )}
            <div className="pt-1 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
              <span className="tabular-nums text-zinc-400 font-semibold">
                {workflow.nodes.length} Nodes
              </span>
              <span>·</span>
              <span className="tabular-nums text-zinc-400 font-semibold">
                {workflow.edges.length} Wires
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#261024]">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-mono border border-[#2E1F4A] hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold border border-rose-500 bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-950/60 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
