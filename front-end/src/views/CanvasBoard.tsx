import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { RunbookDAG, api, LogItem } from '../services/api';
import { CanvasEdge, CanvasNode, CanvasViewport, FlowHandleId, NodeCategory, NodeTemplate } from '../components/canvas/types';
import { DEFAULT_RUNBOOKS } from '../components/canvas/constants';
import { InteractiveCanvas } from '../components/canvas/InteractiveCanvas';
import { NodePalette } from '../components/canvas/NodePalette';
import { NodeInspector } from '../components/canvas/NodeInspector';
import { validateCanvasSafety, autoFixEquivocation } from '../components/canvas/safetyLinter';
import { storage } from '../services/storage';

/**
 * Topologically sorts DAG nodes according to directed edges (Source -> Target).
 * Entry / Root nodes (inDegree === 0) always execute first!
 * Ties and unvisited nodes are sorted by position.x (left-to-right deterministic flow).
 */
export function getTopologicalSortedNodes(nodes: CanvasNode[], edges: CanvasEdge[]): CanvasNode[] {
  if (nodes.length <= 1) return nodes;

  const nodeMap = new Map<string, CanvasNode>(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach((e) => {
    if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Root nodes have no incoming edges (inDegree === 0).
  // Sắp xếp các root node từ trái qua phải theo trục X
  const queue: string[] = nodes
    .filter((n) => (inDegree.get(n.id) || 0) === 0)
    .sort((a, b) => a.position.x - b.position.x)
    .map((n) => n.id);

  const order: CanvasNode[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (visited.has(u)) continue;
    visited.add(u);
    const nodeObj = nodeMap.get(u);
    if (nodeObj) order.push(nodeObj);

    const neighbors = adj.get(u) || [];
    // Sort neighbors by X position for consistent left-to-right traversal
    neighbors.sort((a, b) => {
      const na = nodeMap.get(a);
      const nb = nodeMap.get(b);
      return (na?.position.x || 0) - (nb?.position.x || 0);
    });

    for (const v of neighbors) {
      const curDeg = (inDegree.get(v) || 1) - 1;
      inDegree.set(v, curDeg);
      if (curDeg === 0 && !visited.has(v)) {
        queue.push(v);
      }
    }
  }

  // Any remaining nodes (e.g. disconnected or cycles) sorted left to right
  const remaining = nodes.filter((n) => !visited.has(n.id)).sort((a, b) => a.position.x - b.position.x);
  return [...order, ...remaining];
}

export interface CanvasBoardProps {
  onLog?: (log: LogItem) => void;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onRequestOpenTerminal?: () => void;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  onLog,
  selectedNodeId: externalSelectedNodeId,
  onSelectNode: externalOnSelectNode,
  onRequestOpenTerminal,
}) => {
  // Check localStorage for saved canvas state with defensive validation
  const savedCanvas = useMemo(() => {
    const raw = storage.getCanvasState();
    if (!raw) return null;
    const safeNodes = Array.isArray(raw.nodes)
      ? raw.nodes.filter(Boolean).map((n) => ({
          ...n,
          position: {
            x: Number.isFinite(n?.position?.x) ? n.position.x : 100,
            y: Number.isFinite(n?.position?.y) ? n.position.y : 100,
          },
        }))
      : [];
    const safeEdges = Array.isArray(raw.edges) ? raw.edges.filter((e) => e && e.id && e.source && e.target) : [];
    const vp = raw.viewport;
    const safeVp: CanvasViewport = {
      x: Number.isFinite(vp?.x) ? vp!.x : 30,
      y: Number.isFinite(vp?.y) ? vp!.y : 30,
      zoom: Number.isFinite(vp?.zoom) && vp!.zoom >= 0.2 && vp!.zoom <= 3.0 ? vp!.zoom : 0.88,
    };
    return {
      ...raw,
      nodes: safeNodes,
      edges: safeEdges,
      viewport: safeVp,
    };
  }, []);

  const [runbooks, setRunbooks] = useState<RunbookDAG[]>(DEFAULT_RUNBOOKS as unknown as RunbookDAG[]);
  const [selectedRunbookId, setSelectedRunbookId] = useState<string>(
    () => savedCanvas?.selectedRunbookId || 'runbook-slash-guard'
  );
  
  // Interactive DAG State: load saved nodes/edges if available
  const [nodes, setNodes] = useState<CanvasNode[]>(() => savedCanvas?.nodes || []);
  const [edges, setEdges] = useState<CanvasEdge[]>(() => savedCanvas?.edges || []);
  const viewportRef = useRef<CanvasViewport>(
    savedCanvas?.viewport || { x: 30, y: 30, zoom: 0.88 }
  );
  const handleViewportChange = useCallback((vp: CanvasViewport) => {
    viewportRef.current = vp;
  }, []);
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<string | null>(null);

  const selectedNodeId = externalSelectedNodeId !== undefined ? externalSelectedNodeId : internalSelectedNodeId;
  const setSelectedNodeId = useCallback(
    (id: string | null) => {
      if (externalOnSelectNode) {
        externalOnSelectNode(id);
      } else {
        setInternalSelectedNodeId(id);
      }
    },
    [externalOnSelectNode]
  );

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
    setActiveEdgeId(null);
    setCompletedEdgeIds([]);
    storage.setCanvasState({
      nodes: [],
      edges: [],
      selectedRunbookId: 'custom-blank',
      viewport: viewportRef.current,
      lastSavedAt: Date.now(),
    });
  }, []);

  // Execution State
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any | null>(null);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);
  const [completedEdgeIds, setCompletedEdgeIds] = useState<string[]>([]);

  // Load initial runbooks from API (with automatic fallback to DEFAULT_RUNBOOKS)
  useEffect(() => {
    loadRunbooks();
  }, []);

  const loadRunbooks = async () => {
    try {
      const res = await api.getRunbooks();
      const list = res?.success && res.data?.length > 0 ? res.data : (DEFAULT_RUNBOOKS as unknown as RunbookDAG[]);
      setRunbooks(list);

      const existingSaved = storage.getCanvasState();
      // If user had no saved canvas or had 0 nodes on a non-blank preset, initialize the selected preset!
      if (!existingSaved || (existingSaved.nodes.length === 0 && existingSaved.selectedRunbookId !== 'custom-blank')) {
        const target = list.find((r) => r.id === selectedRunbookId) || list[0];
        if (target) {
          initRunbookGraph(target);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch DAG runbooks from API, using default presets:', e);
      setRunbooks(DEFAULT_RUNBOOKS as unknown as RunbookDAG[]);
      const existingSaved = storage.getCanvasState();
      if (!existingSaved || (existingSaved.nodes.length === 0 && existingSaved.selectedRunbookId !== 'custom-blank')) {
        const target = DEFAULT_RUNBOOKS.find((r) => r.id === selectedRunbookId) || DEFAULT_RUNBOOKS[0];
        initRunbookGraph(target as unknown as RunbookDAG);
      }
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
        viewport: viewportRef.current,
        lastSavedAt: Date.now(),
      });
      setIsHydrated(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [nodes, edges, selectedRunbookId, isHydrated]);

  // Synchronous flush on page unload / refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (nodes.length > 0 || selectedRunbookId === 'custom-blank') {
        storage.setCanvasState({
          nodes,
          edges,
          selectedRunbookId,
          viewport: viewportRef.current,
          lastSavedAt: Date.now(),
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nodes, edges, selectedRunbookId]);

  // Convert a preset Runbook into Canvas Nodes and Edges
  const initRunbookGraph = (rb: RunbookDAG) => {
    const convertedNodes: CanvasNode[] = rb.nodes.map((n, idx) => {
      let cat: NodeCategory = 'INFRA';
      const t = n.type.toLowerCase();
      const labelLower = n.label.toLowerCase();

      if (t.includes('watch') || labelLower.includes('heartbeat') || labelLower.includes('scanner') || labelLower.includes('detector')) {
        cat = 'WATCHER';
      } else if (t.includes('sec') || t.includes('lock') || labelLower.includes('mutex') || labelLower.includes('equivocation')) {
        cat = 'SECURITY';
      } else if (t.includes('stak') || t.includes('yield') || t.includes('bond') || labelLower.includes('compound') || labelLower.includes('top 16')) {
        cat = 'STAKING';
      } else if (t.includes('action') || t.includes('promot') || t.includes('alert') || labelLower.includes('standby')) {
        cat = 'ACTION';
      }

      // Match best icon kind from NODE_TEMPLATES
      let matchedKind = n.id;
      if (labelLower.includes('heartbeat')) matchedKind = 'heartbeat_daemon';
      else if (labelLower.includes('mutex') || labelLower.includes('equivocation')) matchedKind = 'mutex_lock';
      else if (labelLower.includes('standby')) matchedKind = 'promote_standby';
      else if (labelLower.includes('substrate')) matchedKind = 'ws_substrate';
      else if (labelLower.includes('evm')) matchedKind = 'evm_rpc';
      else if (labelLower.includes('desync')) matchedKind = 'desync_detector';
      else if (labelLower.includes('alert')) matchedKind = 'discord_alert';
      else if (labelLower.includes('era')) matchedKind = 'era_scanner';
      else if (labelLower.includes('top 16') || labelLower.includes('filter')) matchedKind = 'top_16_filter';
      else if (labelLower.includes('compound') || labelLower.includes('bond')) matchedKind = 'compound_yield';

      return {
        id: n.id,
        type: n.type,
        position: n.position || { x: 80 + idx * 300, y: 160 },
        data: {
          kind: matchedKind,
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
    setActiveEdgeId(null);
    setCompletedEdgeIds([]);
  };

  const handleSelectRunbook = (rbId: string) => {
    setSelectedRunbookId(rbId);
    setActiveEdgeId(null);
    setCompletedEdgeIds([]);
    if (rbId === 'custom-blank') {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setExecResult(null);
      storage.setCanvasState({
        nodes: [],
        edges: [],
        selectedRunbookId: 'custom-blank',
        viewport: viewportRef.current,
        lastSavedAt: Date.now(),
      });
    } else {
      const targetRb = runbooks.find((r) => r.id === rbId) || (DEFAULT_RUNBOOKS.find((r) => r.id === rbId) as unknown as RunbookDAG);
      if (targetRb) {
        initRunbookGraph(targetRb);
      }
    }
  };

  const handleResetCanvas = () => {
    setActiveEdgeId(null);
    setCompletedEdgeIds([]);
    if (selectedRunbookId === 'custom-blank') {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setExecResult(null);
      storage.setCanvasState({
        nodes: [],
        edges: [],
        selectedRunbookId: 'custom-blank',
        viewport: viewportRef.current,
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
      const uniqueSuffix = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      const newId = `node-${tpl.kind}-${uniqueSuffix}`;
      const position = {
        x: Number.isFinite(dropPos?.x) ? dropPos!.x : 100 + (nodes.length % 4) * 280,
        y: Number.isFinite(dropPos?.y) ? dropPos!.y : 120 + Math.floor(nodes.length / 4) * 180,
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
    [nodes.length, setSelectedNodeId]
  );

  // Functional updater for butter-smooth 60-120fps node movement without stale state
  const handleMoveNodes = useCallback((nodeIds: string[], delta: { x: number; y: number }) => {
    if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) return;
    const moving = new Set(nodeIds);
    setNodes((current) =>
      current.map((node) => {
        if (!moving.has(node.id)) return node;
        const currentX = Number.isFinite(node.position?.x) ? node.position.x : 0;
        const currentY = Number.isFinite(node.position?.y) ? node.position.y : 0;
        return {
          ...node,
          position: {
            x: Math.round(currentX + delta.x),
            y: Math.round(currentY + delta.y),
          },
        };
      })
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

  // Helper delay for sequential animations
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Execute Pipeline (with strictly sequential topological flow step transitions and real-time terminal streaming)
  const handleExecute = async () => {
    if (hasCritical || executing) return;
    setExecuting(true);
    setExecResult(null);
    setActiveEdgeId(null);
    setCompletedEdgeIds([]);

    // Open terminal automatically to stream live activity
    onRequestOpenTerminal?.();

    // Topologically sort nodes starting from entry/root nodes (in-degree === 0)
    const sortedNodes = getTopologicalSortedNodes(nodes, edges);
    const rootNode = sortedNodes[0];

    const timestamp = Date.now() / 1000;
    onLog?.({
      source: 'DAG_ENGINE',
      level: 'INFO',
      time: timestamp,
      text: `▶ Initiating pipeline: "${activeRunbook?.name || 'Custom DAG Topology'}" (Root Entry: [${rootNode?.data.label || 'None'}], ${sortedNodes.length} nodes, ${edges.length} wires)...`,
    });

    // Reset all nodes to idle
    setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));

    try {
      let res: any;
      if (selectedRunbookId !== 'custom-blank') {
        res = await api.executeRunbook(selectedRunbookId);
      } else {
        await sleep(300);
        res = {
          success: true,
          data: {
            execution_id: `custom-exec-${Date.now().toString(36)}`,
            duration_ms: sortedNodes.length * 480,
            steps: sortedNodes.map((n) => ({
              step: n.data.label,
              status: 'SUCCESS',
              detail: `Executed custom node with params: ${JSON.stringify(n.data.config)}`,
            })),
          },
        };
      }

      if (res?.success && res.data) {
        const steps: Array<{ step: string; status: string; detail: string }> = res.data.steps || [];

        // Strictly sequential execution: Node -> Wire -> Next Node -> Next Wire...
        for (let i = 0; i < sortedNodes.length; i++) {
          const currentNode = sortedNodes[i];
          const matchedStep = steps[i] || {
            step: currentNode.data.label,
            status: 'SUCCESS',
            detail: `Processed by Portaldot runtime (Engine: ${currentNode.type || currentNode.data.category})`,
          };

          // Step A: If this is NOT the root node, first animate the connecting wire into currentNode!
          if (i > 0) {
            // Find edge connecting from predecessor to currentNode
            const prevNode = sortedNodes[i - 1];
            const incomingEdge = edges.find((e) => e.source === prevNode.id && e.target === currentNode.id)
              || edges.find((e) => e.target === currentNode.id && sortedNodes.slice(0, i).some((p) => p.id === e.source));

            if (incomingEdge) {
              setActiveEdgeId(incomingEdge.id);
              onLog?.({
                source: 'DAG_ENGINE',
                level: 'RUNNING',
                time: Date.now() / 1000,
                text: `⚡ Flow transmitting along wire -> [${currentNode.data.label}]...`,
              });
              // Wire laser dash animation plays sequentially on this wire alone
              await sleep(480);
              setCompletedEdgeIds((prev) => [...prev, incomingEdge.id]);
              setActiveEdgeId(null);
            }
          }

          // Step B: Mark current node as 'running'
          setNodes((prev) =>
            prev.map((n) => (n.id === currentNode.id ? { ...n, data: { ...n.data, status: 'running' } } : n))
          );

          onLog?.({
            source: 'DAG_ENGINE',
            level: 'RUNNING',
            time: Date.now() / 1000,
            nodeId: currentNode.id,
            text: `[${currentNode.data.label}] Executing step: ${matchedStep.step}...`,
          });

          // Wait natural step interval for node processing
          await sleep(400);

          // Step C: Mark current node as 'success'
          setNodes((prev) =>
            prev.map((n) => (n.id === currentNode.id ? { ...n, data: { ...n.data, status: 'success' } } : n))
          );

          onLog?.({
            source: 'DAG_ENGINE',
            level: 'SUCCESS',
            time: Date.now() / 1000,
            nodeId: currentNode.id,
            text: `[${currentNode.data.label}] ${matchedStep.detail}`,
          });

          await sleep(150);
        }

        // All steps completed: finalize all edges as completed
        setCompletedEdgeIds(edges.map((e) => e.id));
        setExecResult(res.data);
        onLog?.({
          source: 'DAG_ENGINE',
          level: 'SUCCESS',
          time: Date.now() / 1000,
          text: `✔ Pipeline completed successfully in ${res.data.duration_ms || 420}ms (${sortedNodes.length} nodes processed).`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setActiveEdgeId(null);
      setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, status: 'error' } })));
      onLog?.({
        source: 'DAG_ENGINE',
        level: 'ERROR',
        time: Date.now() / 1000,
        text: `✖ Pipeline execution failed: ${err?.message || 'Internal execution error'}`,
      });
    } finally {
      setExecuting(false);
      setActiveEdgeId(null);
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
              initialViewport={viewportRef.current}
              onViewportChange={handleViewportChange}
              flowConnectMode={flowConnectMode}
              onToggleFlowConnect={handleToggleFlowConnect}
              onDeleteSelectedNode={() => {
                if (selectedNodeId) {
                  handleDeleteNode(selectedNodeId);
                }
              }}
              onClearBoard={handleClearBoard}
              isExecuting={executing}
              activeEdgeId={activeEdgeId}
              completedEdgeIds={completedEdgeIds}
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
