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
          icon: <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />,
          text: 'SECURITY',
          border: 'border-[#8B5CF6]/50',
          bg: 'bg-[#18102E]',
          color: 'text-[#C084FC]',
        };
      case 'TELEMETRY':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-[#10B981]" />,
          text: 'TELEMETRY & BOTS',
          border: 'border-[#10B981]/50',
          bg: 'bg-[#0E2820]',
          color: 'text-[#10B981]',
        };
      case 'STAKING':
        return {
          icon: <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B]" />,
          text: 'NPOS STAKING',
          border: 'border-[#F59E0B]/50',
          bg: 'bg-[#2B1B0E]',
          color: 'text-[#F59E0B]',
        };
      default:
        return {
          icon: <Workflow className="w-3.5 h-3.5 text-[#38BDF8]" />,
          text: 'CUSTOM FLOW',
          border: 'border-[#38BDF8]/50',
          bg: 'bg-[#0C1F2E]',
          color: 'text-[#38BDF8]',
        };
    }
  };

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col bg-[#07040E] overflow-y-auto select-none font-mono">
      {/* Hidden File Input for JSON Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImportWorkflow}
        accept=".json"
        className="hidden"
      />

      {/* Hero Header Area */}
      <div className="border-b border-[#261B42] bg-[#0E071F]/90 px-6 py-6 sm:py-8 shrink-0">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-none bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/25">
                  <Workflow className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                    AUTOMATION WORKFLOW CANVASES
                  </h1>
                </div>
              </div>
              <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                Visual control plane for Portaldot Network V3.0. Create 24/7 telemetry signal bots, automated slashing failover runbooks, and yield optimizers with zero double-signing risk.
              </p>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono rounded-none border border-[#261B42] hover:border-[#8B5CF6] bg-[#110A24] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md hover:bg-[#1A1033]"
              >
                <Upload className="w-4 h-4 text-[#38BDF8]" />
                <span>Import JSON</span>
              </button>

              <button
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-none border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-lg shadow-[#8B5CF6]/30 hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workflow</span>
              </button>
            </div>
          </div>

          {/* Telemetry Stats Rail */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 border border-[#261B42] bg-[#0A0516] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Total Workflows</div>
                <div className="text-lg font-bold text-white tabular-nums">{workflows.length}</div>
              </div>
              <Workflow className="w-4 h-4 text-zinc-600" />
            </div>

            <div className="p-3 border border-[#261B42] bg-[#0A0516] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase">24/7 Active Daemons</div>
                <div className="text-lg font-bold text-emerald-400 tabular-nums">{activeCount}</div>
              </div>
              <Bot className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="p-3 border border-[#261B42] bg-[#0A0516] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Anti-Slashing Defense</div>
                <div className="text-lg font-bold text-[#8B5CF6] tabular-nums">100% Safe</div>
              </div>
              <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
            </div>

            <div className="p-3 border border-[#261B42] bg-[#0A0516] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Target Dual-VM</div>
                <div className="text-lg font-bold text-[#38BDF8] tabular-nums">WASM + EVM</div>
              </div>
              <Layers className="w-4 h-4 text-[#38BDF8]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Filter & Grid */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#261B42] pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows by name or keywords..."
              className="w-full bg-[#0E071F] border border-[#261B42] focus:border-[#8B5CF6] text-white pl-9 pr-4 py-2 text-xs font-mono focus:outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['ALL', 'SECURITY', 'TELEMETRY', 'STAKING', 'CUSTOM'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 border text-xs transition-colors cursor-pointer ${
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

        {/* Workflows Cards Grid */}
        {filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWorkflows.map((workflow) => {
              const badge = getCategoryBadge(workflow.category);
              const is24_7 = workflow.id === 'runbook-health-bot';
              
              // Find key trigger and action nodes
              const triggerNode = workflow.nodes.find(
                (n) => n.data.category === 'INFRA' || n.data.category === 'WATCHER'
              );
              const actionNode = workflow.nodes.find(
                (n) => n.data.category === 'ACTION' || n.data.category === 'SECURITY'
              );

              return (
                <div
                  key={workflow.id}
                  className="tech-corner-accent flex flex-col justify-between border border-[#261B42] bg-[#0E071F]/90 hover:border-[#8B5CF6]/70 transition-all p-5 space-y-4 group shadow-xl relative"
                >
                  {/* Card Top: Badges & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border ${badge.border} ${badge.bg} ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.text}</span>
                      </span>
                      {workflow.isCustom && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                          USER CANVAS
                        </span>
                      )}
                    </div>

                    {/* Card Context Buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateWorkflow(`${workflow.name} (Clone)`, 'duplicate');
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#1A1033] border border-transparent hover:border-[#3B2564]"
                        title="Duplicate Canvas"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWorkflow(workflow);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#1A1033] border border-transparent hover:border-[#3B2564]"
                        title="Rename Canvas"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportWorkflow(workflow);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#1A1033] border border-transparent hover:border-[#3B2564]"
                        title="Export JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {workflow.isCustom && workflows.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete workflow "${workflow.name}"?`)) {
                              onDeleteWorkflow(workflow.id);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800"
                          title="Delete Canvas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5 cursor-pointer" onClick={() => onOpenWorkflow(workflow.id)}>
                    <h3 className="text-base font-bold text-white group-hover:text-[#C084FC] transition-colors flex items-center gap-2">
                      <span>{workflow.name}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {workflow.description || 'Configured DAG automation runbook for Portaldot validator nodes.'}
                    </p>
                  </div>

                  {/* Operational Topology Mini-Card */}
                  <div className="p-3 bg-[#080512] border border-[#261B42] text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Trigger Source:</span>
                      <span className="text-zinc-200 font-bold truncate max-w-[170px]">
                        {triggerNode?.data.label || 'Substrate / EVM Sensor'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Automated Action:</span>
                      <span className="text-emerald-400 font-bold truncate max-w-[170px]">
                        {actionNode?.data.label || 'Discord / Ops Alert'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500 pt-1 border-t border-[#1F143D]">
                      <span>Topology Density:</span>
                      <span className="text-white tabular-nums">
                        {workflow.nodes.length} nodes · {workflow.edges.length} wires
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{is24_7 ? '24/7 Daemon Ready' : 'Armed & Verified'}</span>
                    </span>

                    <button
                      onClick={() => onOpenWorkflow(workflow.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border border-[#8B5CF6]/50 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] text-white transition-all cursor-pointer group-hover:border-[#8B5CF6]"
                    >
                      <span>Open Canvas Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
      </div>

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
