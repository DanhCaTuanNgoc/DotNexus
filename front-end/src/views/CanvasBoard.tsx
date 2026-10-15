import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Workflow, 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Download, 
  RotateCcw, 
  AlertTriangle,
  FileCode2,
  Sliders
} from 'lucide-react';
import { RunbookDAG, api } from '../services/api';
import { CanvasEdge, CanvasNode, CanvasViewport, FlowHandleId, NodeCategory, NodeTemplate } from '../components/canvas/types';
import { InteractiveCanvas } from '../components/canvas/InteractiveCanvas';
import { NodePalette } from '../components/canvas/NodePalette';
import { NodeInspector } from '../components/canvas/NodeInspector';
import { validateCanvasSafety, autoFixEquivocation } from '../components/canvas/safetyLinter';
import { storage } from '../services/storage';

export const CanvasBoard: React.FC = () => {
  // Check localStorage for saved canvas state
  const savedCanvas = useMemo(() => storage.getCanvasState(), []);

  const [runbooks, setRunbooks] = useState<RunbookDAG[]>([]);
  const [selectedRunbookId, setSelectedRunbookId] = useState<string>(
    () => savedCanvas?.selectedRunbookId || 'runbook-slash-guard'
  );
  
  // Interactive DAG State: load saved nodes/edges if available
  const [nodes, setNodes] = useState<CanvasNode[]>(() => savedCanvas?.nodes || []);
  const [edges, setEdges] = useState<CanvasEdge[]>(() => savedCanvas?.edges || []);
  const [viewport, setViewport] = useState<CanvasViewport>(
    () => savedCanvas?.viewport || { x: 30, y: 30, zoom: 0.88 }
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState<boolean>(
    () => !!(savedCanvas && (savedCanvas.nodes.length > 0 || savedCanvas.selectedRunbookId === 'custom-blank'))
  );

  // Flow Connect Mode (Handle / Pin Visibility)
  const [flowConnectMode, setFlowConnectMode] = useState<boolean>(() =>
    storage.getFlowConnectMode(false)
  );

  const handleToggleFlowConnect = useCallback(() => {
    setFlowConnectMode((prev) => {
      const next = !prev;
      storage.setFlowConnectMode(next);
      return next;
    });
  }, []);

  const handleClearBoard = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setExecResult(null);
    storage.setCanvasState({
      nodes: [],
      edges: [],
      selectedRunbookId: 'custom-blank',
      viewport,
      lastSavedAt: Date.now(),
    });
  }, [viewport]);

  // Execution State
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any | null>(null);

  // Load initial runbooks from API
  useEffect(() => {
    loadRunbooks();
  }, []);

  const loadRunbooks = async () => {
    try {
      const res = await api.getRunbooks();
      if (res.success && res.data.length > 0) {
        setRunbooks(res.data);
        // Only initialize default graph if user did NOT have a saved canvas in localStorage!
        const existingSaved = storage.getCanvasState();
        if (!existingSaved || (existingSaved.nodes.length === 0 && existingSaved.selectedRunbookId !== 'custom-blank')) {
          initRunbookGraph(res.data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load DAG runbooks', e);
    }
  };

  // Auto-save canvas to localStorage with debounce
  useEffect(() => {
    if (nodes.length === 0 && !isHydrated && selectedRunbookId !== 'custom-blank') {
      return;
    }

    const timer = setTimeout(() => {
      storage.setCanvasState({
        nodes,
        edges,
        selectedRunbookId,
        viewport,
        lastSavedAt: Date.now(),
      });
      setIsHydrated(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [nodes, edges, selectedRunbookId, viewport, isHydrated]);

  // Synchronous flush on page unload / refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (nodes.length > 0 || selectedRunbookId === 'custom-blank') {
        storage.setCanvasState({
          nodes,
          edges,
          selectedRunbookId,
          viewport,
          lastSavedAt: Date.now(),
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nodes, edges, selectedRunbookId, viewport]);

  // Convert a preset Runbook into Canvas Nodes and Edges
  const initRunbookGraph = (rb: RunbookDAG) => {
    const convertedNodes: CanvasNode[] = rb.nodes.map((n, idx) => {
      let cat: NodeCategory = 'INFRA';
      const t = n.type.toLowerCase();
      if (t.includes('watch')) cat = 'WATCHER';
      else if (t.includes('sec') || t.includes('lock')) cat = 'SECURITY';
      else if (t.includes('action') || t.includes('promot') || t.includes('alert')) cat = 'ACTION';
      else if (t.includes('stak') || t.includes('yield') || t.includes('bond')) cat = 'STAKING';

      return {
        id: n.id,
        type: n.type,
        position: n.position || { x: 80 + idx * 300, y: 160 },
        data: {
          kind: n.id,
          category: cat,
          label: n.label,
          description: `Configured operational step: ${n.label}`,
          status: 'idle',
          config: { ...(n.data || {}) },
        },
      };
    });

    const convertedEdges: CanvasEdge[] = rb.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: 'right',
      targetHandle: 'left',
      animated: true,
      label: e.label || 'Trigger Flow',
    }));

    setNodes(convertedNodes);
    setEdges(convertedEdges);
    setSelectedNodeId(null);
    setExecResult(null);
  };

  const handleSelectRunbook = (rbId: string) => {
    setSelectedRunbookId(rbId);
    if (rbId === 'custom-blank') {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setExecResult(null);
      storage.setCanvasState({
        nodes: [],
        edges: [],
        selectedRunbookId: 'custom-blank',
        viewport,
        lastSavedAt: Date.now(),
      });
    } else {
      const targetRb = runbooks.find((r) => r.id === rbId);
      if (targetRb) {
        initRunbookGraph(targetRb);
      }
    }
  };

  const handleResetCanvas = () => {
    if (selectedRunbookId === 'custom-blank') {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setExecResult(null);
      storage.setCanvasState({
        nodes: [],
        edges: [],
        selectedRunbookId: 'custom-blank',
        viewport,
        lastSavedAt: Date.now(),
      });
      return;
    }
    const targetRb = runbooks.find((r) => r.id === selectedRunbookId) || runbooks[0];
    if (targetRb) {
      initRunbookGraph(targetRb);
    }
  };

  // Background Safety Linter
  const { issues, hasCritical, hasWarning } = useMemo(() => {
    return validateCanvasSafety(nodes, edges);
  }, [nodes, edges]);

  const violatedNodeIds = useMemo(() => {
    return issues.filter((i) => i.nodeId).map((i) => i.nodeId as string);
  }, [issues]);

  // 1-Click Topology Auto-Fix
  const handleAutoFix = useCallback(() => {
    const fixed = autoFixEquivocation(nodes, edges);
    setNodes(fixed.nodes);
    setEdges(fixed.edges);
  }, [nodes, edges]);

  // Add Node from Palette
  const handleAddNodeFromTemplate = useCallback(
    (tpl: NodeTemplate, dropPos?: { x: number; y: number }) => {
      const newId = `node-${tpl.kind}-${Date.now().toString(36)}`;
      const position = dropPos || {
        x: 100 + (nodes.length % 4) * 280,
        y: 120 + Math.floor(nodes.length / 4) * 180,
      };

      const newNode: CanvasNode = {
        id: newId,
        type: tpl.category.toLowerCase(),
        position,
        data: {
          kind: tpl.kind,
          category: tpl.category,
          label: tpl.label,
          description: tpl.description,
          status: 'idle',
          config: { ...tpl.defaultConfig },
        },
      };

      setNodes((prev) => [...prev, newNode]);
      setSelectedNodeId(newId);
    },
    [nodes.length]
  );

  // Functional updater for butter-smooth 60-120fps node movement without stale state
  const handleMoveNodes = useCallback((nodeIds: string[], delta: { x: number; y: number }) => {
    const moving = new Set(nodeIds);
    setNodes((current) =>
      current.map((node) =>
        moving.has(node.id)
          ? {
              ...node,
              position: {
                x: Math.round(node.position.x + delta.x),
                y: Math.round(node.position.y + delta.y),
              },
            }
          : node
      )
    );
  }, []);

  // Connect two nodes with deduplication and auto handle wire
  const handleConnect = useCallback(
    (connection: {
      source: string;
      target: string;
      sourceHandle: FlowHandleId;
      targetHandle: FlowHandleId;
    }) => {
      setEdges((prev) => {
        const exists = prev.some(
          (e) => e.source === connection.source && e.target === connection.target
        );
        if (exists) return prev;
        const newEdge: CanvasEdge = {
          id: `edge-${connection.source}-${connection.target}-${Date.now().toString(36)}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          animated: true,
          label: 'Trigger Flow',
        };
        return [...prev, newEdge];
      });
    },
    []
  );

  // Update Node Config
  const handleUpdateNodeConfig = useCallback((nodeId: string, newConfig: Record<string, any>) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, config: newConfig } } : n))
    );
  }, []);

  // Delete Node
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
  }, []);

  // Execute Pipeline (with visual step transitions)
  const handleExecute = async () => {
    if (hasCritical) return;
    setExecuting(true);
    setExecResult(null);

    // Visual: Transition nodes to 'running'
    setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, status: 'running' } })));

    try {
      let res: any;
      if (selectedRunbookId !== 'custom-blank') {
        res = await api.executeRunbook(selectedRunbookId);
      } else {
        // Mock custom execution
        await new Promise((r) => setTimeout(r, 600));
        res = {
          success: true,
          data: {
            execution_id: `custom-exec-${Date.now().toString(36)}`,
            duration_ms: 182,
            steps: nodes.map((n) => ({
              step: n.data.label,
              status: 'SUCCESS',
              detail: `Executed custom node with params: ${JSON.stringify(n.data.config)}`,
            })),
          },
        };
      }

      if (res?.success) {
        setExecResult(res.data);
        // Visual: Transition nodes to 'success'
        setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, status: 'success' } })));
      }
    } catch (err) {
      console.error(err);
      setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, status: 'error' } })));
    } finally {
      setExecuting(false);
    }
  };

  // Export Graph to JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dotnexus-dag-${selectedRunbookId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to Python CLI Headless Script
  const handleExportCLI = () => {
    const scriptContent = `#!/usr/bin/env python3
"""
Generated by DotNexus Visual DAG Automation Canvas
Runbook: ${selectedRunbookId}
Portaldot Network V3.0 (Substrate WASM + EVM Dual-VM)
"""
import sys, time, logging

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s - %(message)s")
logger = logging.getLogger("DotNexus.HeadlessRunner")

def run_pipeline():
    logger.info("Initializing DotNexus Autonomous Runbook: ${selectedRunbookId}")
    ${nodes.map((n, idx) => `
    # Step ${idx + 1}: ${n.data.label}
    logger.info("Executing node: ${n.data.label} (${n.data.category})")
    time.sleep(0.1)`).join('\n')}
    logger.info("Pipeline completed successfully without equivocation!")

if __name__ == "__main__":
    run_pipeline()
`;
    const blob = new Blob([scriptContent], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runbook_${selectedRunbookId}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const activeRunbook = runbooks.find((r) => r.id === selectedRunbookId);

  return (
    <div className="flex flex-col h-full min-h-0 space-y-1.5 select-none">
      {/* Sleek, Compact Header & Runbook Controls (Minimal height to maximize board space) */}
      <div className="px-3 py-1.5 border border-[#261B42] bg-[#0E071F]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Workflow className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Visual DAG Control Plane
            </span>
          </div>

          {/* Inline Compact Safety Status Tag */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border ${
              hasCritical
                ? 'border-rose-500/80 bg-rose-950/60 text-rose-300'
                : hasWarning
                ? 'border-amber-500/80 bg-amber-950/60 text-amber-300'
                : 'border-[#10B981]/50 bg-[#0E2820]/50 text-[#10B981]'
            }`}
          >
            {hasCritical ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : hasWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            )}
            <span>
              {hasCritical
                ? 'CRITICAL EQUIVOCATION HAZARD'
                : hasWarning
                ? 'TOPOLOGY WARNING'
                : 'TOPOLOGY VERIFIED (0 Slashing Hazards)'}
            </span>
            {hasCritical && (
              <button
                onClick={handleAutoFix}
                className="underline hover:text-white font-bold ml-1 text-amber-300 cursor-pointer"
              >
                Auto-Fix ➔
              </button>
            )}
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <select
            value={selectedRunbookId}
            onChange={(e) => handleSelectRunbook(e.target.value)}
            className="bg-[#06030D] border border-[#261B42] text-[11px] font-mono text-[#C084FC] px-2.5 py-1 rounded-none focus:outline-none focus:border-[#8B5CF6]"
          >
            {runbooks.map((r) => (
              <option key={r.id} value={r.id}>
                [{r.category}] {r.name}
              </option>
            ))}
            <option value="custom-blank">[CUSTOM] Blank Canvas</option>
          </select>

          {/* Reset button */}
          <button
            onClick={handleResetCanvas}
            className="p-1 border border-[#261B42] bg-[#110A24] text-zinc-400 hover:text-white hover:bg-[#1E113E] transition-colors"
            title="Reset to Original Preset (Clears Custom Edits)"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono border border-[#261B42] bg-[#110A24] text-zinc-300 hover:text-white hover:bg-[#1E113E] transition-colors"
            title="Export DAG as JSON"
          >
            <Download className="w-3 h-3 text-[#8B5CF6]" />
            <span>JSON</span>
          </button>

          {/* Export CLI Script */}
          <button
            onClick={handleExportCLI}
            className="hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-mono border border-[#261B42] bg-[#110A24] text-zinc-300 hover:text-white hover:bg-[#1E113E] transition-colors"
            title="Export Standalone Python CLI Runner"
          >
            <FileCode2 className="w-3 h-3 text-[#10B981]" />
            <span>CLI</span>
          </button>

          {/* 1-Click Auto-Fix Button (if critical error exists) */}
          {hasCritical && (
            <button
              onClick={handleAutoFix}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono border border-amber-500 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-bold transition-all shadow-md animate-pulse cursor-pointer"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Auto-Fix</span>
            </button>
          )}

          {/* Execute Pipeline */}
          <button
            onClick={handleExecute}
            disabled={executing || hasCritical}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold transition-all shadow-md cursor-pointer ${
              hasCritical
                ? 'border-rose-900 bg-rose-950/40 text-rose-400 cursor-not-allowed opacity-70'
                : executing
                ? 'bg-[#581C87] border border-[#8B5CF6] text-white animate-pulse cursor-wait'
                : 'border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-[#8B5CF6]/20'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${executing ? 'animate-pulse' : ''}`} />
            <span>{executing ? 'Executing...' : 'Run Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* 3-Section Main Workspace: [Palette | Interactive Canvas | Inspector] */}
      <div className="relative flex-1 min-h-[500px] h-[calc(100vh-175px)] flex border border-[#261B42] bg-[#06030D] overflow-hidden shadow-2xl">
        {/* Left: Node Toolbox Palette - Fixed height & strictly internal scroll */}
        <NodePalette onAddNode={handleAddNodeFromTemplate} />

        {/* Center: Interactive 60-120fps Flow Canvas */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <InteractiveCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              violatedNodeIds={violatedNodeIds}
              onMoveNodes={handleMoveNodes}
              onConnect={handleConnect}
              onEdgesChange={setEdges}
              onSelectNode={setSelectedNodeId}
              onDropTemplate={handleAddNodeFromTemplate}
              initialViewport={viewport}
              onViewportChange={setViewport}
              flowConnectMode={flowConnectMode}
              onToggleFlowConnect={handleToggleFlowConnect}
              onDeleteSelectedNode={() => {
                if (selectedNodeId) {
                  handleDeleteNode(selectedNodeId);
                }
              }}
              onClearBoard={handleClearBoard}
            />

            {/* Floating Execution Results Summary HUD (Shifted above dock) */}
            {execResult && (
              <div className="absolute bottom-16 right-3 z-30 max-w-sm w-full tech-corner-accent p-3 border border-[#10B981]/60 bg-[#0E071F]/95 backdrop-blur-md shadow-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#10B981] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Executed in {execResult.duration_ms}ms
                  </span>
                  <button
                    onClick={() => setExecResult(null)}
                    className="text-zinc-500 hover:text-white text-xs font-mono px-1 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {execResult.steps.map((st: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-[10px] font-mono p-1.5 bg-[#080512] border border-[#261B42]"
                    >
                      <span className="px-1 py-0.2 bg-[#10B981]/20 text-[#10B981] text-[8px] font-bold shrink-0">
                        {st.status}
                      </span>
                      <span className="text-white font-semibold truncate shrink-0">{st.step}:</span>
                      <span className="text-zinc-300 truncate">{st.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compact Bottom Metadata Strip */}
          <div className="h-6 px-3 bg-[#0A0516] border-t border-[#261B42] flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
            <div className="truncate">
              <span className="text-[#C084FC] font-semibold">Active Architecture: </span>
              <span>{activeRunbook?.description || 'Custom Visual DAG Flow'}</span>
            </div>
            <div className="text-zinc-500 shrink-0 ml-3 hidden sm:block">
              {nodes.length} nodes · {edges.length} wires
            </div>
          </div>
        </div>

        {/* Right: Slide-over Inspector (when node selected) */}
        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            issues={issues}
            onClose={() => setSelectedNodeId(null)}
            onUpdateConfig={handleUpdateNodeConfig}
            onDeleteNode={handleDeleteNode}
          />
        )}
      </div>
    </div>
  );
};
