import React, { useState, useMemo, useRef } from 'react';
import { 
  Workflow, 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  ArrowRight, 
  Bot, 
  ShieldCheck, 
  Shield, 
  TrendingUp, 
  Layers, 
  Clock, 
  Activity, 
  CheckCircle2,
  SlidersHorizontal,
  FileCode2
} from 'lucide-react';
import { CanvasWorkflow, NodeCategory } from '../components/canvas/types';
import { NewWorkflowModal } from '../components/canvas/NewWorkflowModal';
import { RenameWorkflowModal } from '../components/canvas/RenameWorkflowModal';

export interface CanvasHubViewProps {
  workflows: CanvasWorkflow[];
  onOpenWorkflow: (workflowId: string) => void;
  onCreateWorkflow: (name: string, mode: 'blank' | 'duplicate' | 'template', templateId?: string) => void;
  onRenameWorkflow: (workflowId: string, newName: string) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onImportWorkflow: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportWorkflow: (workflow: CanvasWorkflow) => void;
}

export const CanvasHubView: React.FC<CanvasHubViewProps> = ({
  workflows,
  onOpenWorkflow,
  onCreateWorkflow,
  onRenameWorkflow,
  onDeleteWorkflow,
  onImportWorkflow,
  onExportWorkflow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<CanvasWorkflow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      const matchesSearch = 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = 
        categoryFilter === 'ALL' || 
        w.category.toUpperCase() === categoryFilter.toUpperCase() ||
        (categoryFilter === 'CUSTOM' && w.isCustom);
      return matchesSearch && matchesCategory;
    });
  }, [workflows, searchQuery, categoryFilter]);

  const activeCount = useMemo(() => {
    return workflows.filter((w) => w.status === 'ACTIVE' || w.id === 'runbook-health-bot').length;
  }, [workflows]);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'SECURITY':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-[#8B5CF6]" />,
          text: 'SECURITY',
          border: 'border-[#8B5CF6]/50',
          bg: 'bg-[#18102E]',
          color: 'text-[#C084FC]',
        };
      case 'TELEMETRY':
        return {
          icon: <Activity className="w-3 h-3 text-[#10B981]" />,
          text: 'TELEMETRY',
          border: 'border-[#10B981]/50',
          bg: 'bg-[#0E2820]',
          color: 'text-[#10B981]',
        };
      case 'STAKING':
        return {
          icon: <TrendingUp className="w-3 h-3 text-[#F59E0B]" />,
          text: 'STAKING',
          border: 'border-[#F59E0B]/50',
          bg: 'bg-[#2B1B0E]',
          color: 'text-[#F59E0B]',
        };
      default:
        return {
          icon: <Workflow className="w-3 h-3 text-[#38BDF8]" />,
          text: 'CUSTOM',
          border: 'border-[#38BDF8]/50',
          bg: 'bg-[#0C1F2E]',
          color: 'text-[#38BDF8]',
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 select-none font-mono">
      {/* Hidden File Input for JSON Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImportWorkflow}
        accept=".json"
        className="hidden"
      />

      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#261B42] pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wider uppercase">
              AUTOMATION WORKFLOW CANVASES
            </h2>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#180E30] hover:bg-[#261B42] border border-[#4C2889] text-[#C084FC] transition-colors cursor-pointer"
            title="Import Workflow JSON"
          >
            <Upload className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>IMPORT JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-mono bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] text-white font-bold border border-[#8B5CF6] transition-colors cursor-pointer shadow-lg shadow-[#8B5CF6]/30"
            title="Create New Automation Workflow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW WORKFLOW</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#0B0813] border border-[#201538]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows by name or keywords..."
            className="w-full bg-[#0E071F] border border-[#261B42] focus:border-[#8B5CF6] text-white pl-9 pr-4 py-1.5 text-xs font-mono focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['ALL', 'SECURITY', 'TELEMETRY', 'STAKING', 'CUSTOM'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-[11px] font-mono border transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white font-bold'
                  : 'border-[#261B42] bg-[#0E071F] text-zinc-400 hover:text-white hover:border-[#3B2564]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Workflows Cards Grid - 4 cards per row */}
      {filteredWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredWorkflows.map((workflow) => {
            const badge = getCategoryBadge(workflow.category);
            const is24_7 = workflow.id === 'runbook-health-bot';

            return (
              <div
                key={workflow.id}
                onClick={() => onOpenWorkflow(workflow.id)}
                className="tech-corner-accent flex flex-col justify-between border border-[#201538] bg-[#0E091B]/95 hover:border-[#8B5CF6] hover:bg-[#130C24] transition-all p-3.5 space-y-3 group shadow-lg relative cursor-pointer"
              >
                {/* Top: Category Badge & Quick Actions */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold border ${badge.border} ${badge.bg} ${badge.color}`}>
                      {badge.icon}
                      <span>{badge.text}</span>
                    </span>
                    {workflow.isCustom && (
                      <span className="px-1 py-0.5 text-[8px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                        USER
                      </span>
                    )}
                  </div>

                  {/* Context Actions */}
                  <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateWorkflow(`${workflow.name} (Clone)`, 'duplicate');
                      }}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-[#1A1033] border border-transparent hover:border-[#3B2564]"
                      title="Duplicate Canvas"
                    >
                      <Copy className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingWorkflow(workflow);
                      }}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-[#1A1033] border border-transparent hover:border-[#3B2564]"
                      title="Rename Canvas"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportWorkflow(workflow);
                      }}
                      className="p-1 text-zinc-400 hover:text-white hover:bg-[#1A1033] border border-transparent hover:border-[#3B2564]"
                      title="Export JSON"
                    >
                      <Download className="w-3 h-3" />
                    </button>

                    {workflow.isCustom && workflows.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete workflow "${workflow.name}"?`)) {
                            onDeleteWorkflow(workflow.id);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800"
                        title="Delete Canvas"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Short Description */}
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white group-hover:text-[#C084FC] transition-colors truncate" title={workflow.name}>
                    {workflow.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                    {workflow.description || 'Configured DAG automation runbook for Portaldot validator nodes.'}
                  </p>
                </div>

                {/* Bottom Stats & Launch Prompt */}
                <div className="pt-2 border-t border-[#1F143D] flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span className="tabular-nums font-semibold text-zinc-300">
                      {workflow.nodes.length}N · {workflow.edges.length}W
                    </span>
                    <span>·</span>
                    <span className={is24_7 ? 'text-emerald-400' : 'text-[#8B5CF6]'}>
                      {is24_7 ? '24/7' : 'ARMED'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8B5CF6] group-hover:text-white transition-colors">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center border border-dashed border-[#261B42] bg-[#0E071F]/50 space-y-4">
          <Workflow className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase">No workflows match your search</h3>
            <p className="text-xs text-zinc-500">
              Try searching with different keywords or clear the category filter.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
            }}
            className="px-4 py-2 text-xs font-mono border border-[#8B5CF6] text-[#C084FC] hover:bg-[#8B5CF6]/20 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* New Workflow Modal */}
      <NewWorkflowModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={(name, mode, templateId) => {
          onCreateWorkflow(name, mode, templateId);
          setIsNewModalOpen(false);
        }}
        activeWorkflowName={workflows[0]?.name || 'Workflow'}
      />

      {/* Rename Workflow Modal */}
      {editingWorkflow && (
        <RenameWorkflowModal
          isOpen={!!editingWorkflow}
          currentName={editingWorkflow.name}
          onClose={() => setEditingWorkflow(null)}
          onRename={(newName) => {
            onRenameWorkflow(editingWorkflow.id, newName);
            setEditingWorkflow(null);
          }}
        />
      )}
    </div>
  );
};
