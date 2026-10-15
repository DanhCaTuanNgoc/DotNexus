import React, { useRef, useState, useCallback, useMemo, useEffect, PointerEvent, DragEvent } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Link2, Trash2, RotateCcw } from 'lucide-react';
import { CanvasEdge, CanvasNode, CanvasViewport, FlowHandleId, NodeTemplate } from './types';
import { calculateBezierPath, getHandlePoint, NODE_HEIGHT, NODE_WIDTH } from './constants';
import { NodeCard } from './NodeCard';

interface ConnectingState {
  source: string;
  sourceHandle: FlowHandleId;
  target: { x: number; y: number };
}

interface InteractiveCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  violatedNodeIds: string[];
  onMoveNodes: (nodeIds: string[], delta: { x: number; y: number }) => void;
  onConnect: (connection: {
    source: string;
    target: string;
    sourceHandle: FlowHandleId;
    targetHandle: FlowHandleId;
  }) => void;
  onEdgesChange: (edges: CanvasEdge[]) => void;
  onSelectNode: (nodeId: string | null) => void;
  onDropTemplate: (template: NodeTemplate, position: { x: number; y: number }) => void;
  initialViewport?: CanvasViewport;
  onViewportChange?: (viewport: CanvasViewport) => void;
  flowConnectMode?: boolean;
  onToggleFlowConnect?: () => void;
  onDeleteSelectedNode?: () => void;
  onClearBoard?: () => void;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  violatedNodeIds,
  onMoveNodes,
  onConnect,
  onEdgesChange,
  onSelectNode,
  onDropTemplate,
  initialViewport,
  onViewportChange,
  flowConnectMode = false,
  onToggleFlowConnect,
  onDeleteSelectedNode,
  onClearBoard,
}) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<CanvasViewport>(
    initialViewport || { x: 30, y: 30, zoom: 0.88 }
  );
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    onViewportChange?.(viewport);
  }, [viewport, onViewportChange]);

  useEffect(() => {
    if (initialViewport) {
      setViewport((current) => {
        if (
          current.x === initialViewport.x &&
          current.y === initialViewport.y &&
          current.zoom === initialViewport.zoom
        ) {
          return current;
        }
        return initialViewport;
      });
    }
  }, [initialViewport]);

  // RAF Throttled Movement references (identical to proven PortalModeler engine)
  const pendingMoveRef = useRef<{ nodeIds: string[]; delta: { x: number; y: number } } | null>(null);
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    nodeIds: string[];
    origin: { x: number; y: number };
    lastDelta: { x: number; y: number };
  } | null>(null);
  const panRef = useRef<{
    pointerId: number;
    origin: { x: number; y: number };
    viewport: { x: number; y: number };
  } | null>(null);

  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  // Screen Coordinates (clientX, clientY) -> Flow World Coordinates
  const screenToFlow = useCallback(
    (clientX: number, clientY: number) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - viewport.x) / viewport.zoom,
        y: (clientY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Smooth RAF movement flusher
  const flushMove = useCallback(() => {
    rafRef.current = null;
    const pending = pendingMoveRef.current;
    if (!pending) return;
    pendingMoveRef.current = null;
    onMoveNodes(pending.nodeIds, pending.delta);
  }, [onMoveNodes]);

  const scheduleMove = useCallback(
    (nodeIds: string[], delta: { x: number; y: number }) => {
      pendingMoveRef.current = { nodeIds, delta };
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(flushMove);
      }
    },
    [flushMove]
  );

  // Ultra-smooth Node Drag Handlers
  const startNodeDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>, nodeId: string) => {
      if (event.button !== 0 || (event.target as HTMLElement).closest('[data-flow-handle]')) {
        return;
      }
      event.stopPropagation();
      onSelectNode(nodeId);

      dragRef.current = {
        pointerId: event.pointerId,
        nodeIds: [nodeId],
        origin: { x: event.clientX, y: event.clientY },
        lastDelta: { x: 0, y: 0 },
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [onSelectNode]
  );

  const moveNodeDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const nextDelta = {
        x: (event.clientX - drag.origin.x) / viewport.zoom,
        y: (event.clientY - drag.origin.y) / viewport.zoom,
      };
      const frameDelta = {
        x: nextDelta.x - drag.lastDelta.x,
        y: nextDelta.y - drag.lastDelta.y,
      };
      drag.lastDelta = nextDelta;
      scheduleMove(drag.nodeIds, frameDelta);
    },
    [viewport.zoom, scheduleMove]
  );

  const stopNodeDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        flushMove();
      }
      dragRef.current = null;
    },
    [flushMove]
  );

  // Canvas Viewport Pan Handlers
  const startPan = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 && event.button !== 1) return;
      panRef.current = {
        pointerId: event.pointerId,
        origin: { x: event.clientX, y: event.clientY },
        viewport: { x: viewport.x, y: viewport.y },
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true);
    },
    [viewport]
  );

  const movePan = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId) return;

      setViewport((current) => ({
        ...current,
        x: pan.viewport.x + (event.clientX - pan.origin.x),
        y: pan.viewport.y + (event.clientY - pan.origin.y),
      }));
    },
    []
  );

  const stopPan = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null;
      setIsPanning(false);
    }
  }, []);

  // Wheel handler: Ctrl + Wheel to Zoom towards pointer; Normal Wheel to Pan board
  const zoomBoard = useCallback(
    (event: globalThis.WheelEvent) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const deltaModeScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      const wheelDeltaX = event.deltaX * deltaModeScale;
      const wheelDeltaY = event.deltaY * deltaModeScale;

      const isZoomKey = event.ctrlKey || event.metaKey;

      if (!isZoomKey) {
        // Normal wheel scrolling pans the board vertically / horizontally (Shift + Wheel)
        event.preventDefault();
        setViewport((current) => ({
          ...current,
          x: current.x - (event.shiftKey ? wheelDeltaY : wheelDeltaX),
          y: current.y - (event.shiftKey ? 0 : wheelDeltaY),
        }));
        return;
      }

      // ONLY Zoom when Ctrl or Meta key is pressed
      event.preventDefault();
      event.stopPropagation();

      const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };

      setViewport((current) => {
        const nextZoom = Math.min(2.2, Math.max(0.3, current.zoom - wheelDeltaY * 0.0015));
        const flow = {
          x: (pointer.x - current.x) / current.zoom,
          y: (pointer.y - current.y) / current.zoom,
        };

        return {
          zoom: Number(nextZoom.toFixed(3)),
          x: Math.round(pointer.x - flow.x * nextZoom),
          y: Math.round(pointer.y - flow.y * nextZoom),
        };
      });
    },
    []
  );

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.addEventListener('wheel', zoomBoard, { passive: false });
    return () => board.removeEventListener('wheel', zoomBoard);
  }, [zoomBoard]);

  // Wire Connection Handlers
  const startConnection = useCallback(
    (event: PointerEvent<HTMLButtonElement>, nodeId: string, sourceHandle: FlowHandleId) => {
      if (!flowConnectMode) return;
      event.preventDefault();
      event.stopPropagation();
      const sourceNode = nodesById.get(nodeId);
      if (!sourceNode) return;

      setConnecting({
        source: nodeId,
        sourceHandle,
        target: getHandlePoint(sourceNode.position, sourceHandle),
      });
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [nodesById, flowConnectMode]
  );

  const moveConnection = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!connecting) return;
      const pointer = screenToFlow(event.clientX, event.clientY);
      setConnecting((curr) => (curr ? { ...curr, target: pointer } : null));
    },
    [connecting, screenToFlow]
  );

  const finishConnection = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!connecting) return;

      const hitElement = document.elementFromPoint(event.clientX, event.clientY);
      const handleTarget = hitElement?.closest<HTMLElement>('[data-node-id][data-flow-handle]');
      const nodeTarget = hitElement?.closest<HTMLElement>('[data-node-id]');

      const targetId = handleTarget?.dataset.nodeId || nodeTarget?.dataset.nodeId;
      const targetHandle = (handleTarget?.dataset.flowHandle || 'left') as FlowHandleId;

      if (targetId && targetId !== connecting.source) {
        onConnect({
          source: connecting.source,
          target: targetId,
          sourceHandle: connecting.sourceHandle,
          targetHandle,
        });
      }
      setConnecting(null);
    },
    [connecting, onConnect]
  );

  // Template Drag & Drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const templateData = e.dataTransfer.getData('application/dotnexus-node-template');
    if (!templateData) return;

    try {
      const template: NodeTemplate = JSON.parse(templateData);
      const worldPos = screenToFlow(e.clientX, e.clientY);
      onDropTemplate(template, {
        x: Math.round(worldPos.x - NODE_WIDTH / 2),
        y: Math.round(worldPos.y - NODE_HEIGHT / 2),
      });
    } catch (err) {
      console.error('Failed to parse dropped template', err);
    }
  };

  // Keyboard shortcut for deleting selected edge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        onEdgesChange(edges.filter((edge) => edge.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdgeId, edges, onEdgesChange]);

  return (
    <div
      ref={boardRef}
      className={`flow-board ${isPanning ? 'is-panning' : ''}`}
      onPointerDown={(event) => {
        const interactiveTarget = (event.target as HTMLElement).closest('.flow-board__node, [data-edge-id]');
        if (!interactiveTarget) {
          onSelectNode(null);
          setSelectedEdgeId(null);
          startPan(event);
        }
      }}
      onPointerMove={(event) => {
        movePan(event);
        moveConnection(event);
      }}
      onPointerUp={(event) => {
        stopPan(event);
        finishConnection(event);
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.25) 1.2px, transparent 1.2px)`,
        backgroundSize: `${28 * viewport.zoom}px ${28 * viewport.zoom}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
    >

      {/* Scaled & Translated World Layer */}
      <div
        className="flow-board__world"
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
        }}
      >
        {/* SVG Wiring Layer */}
        <svg
          className="absolute inset-0 overflow-visible pointer-events-none"
          width="3200"
          height="2000"
        >
          <defs>
            <marker
              id="flow-arrow"
              markerWidth="10"
              markerHeight="8"
              refX="8"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 10 4, 0 8" fill="#8B5CF6" />
            </marker>
            <marker
              id="flow-arrow-selected"
              markerWidth="10"
              markerHeight="8"
              refX="8"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 10 4, 0 8" fill="#FACC15" />
            </marker>
          </defs>

          {/* Render Existing Edges */}
          {edges.map((edge) => {
            const sourceNode = nodesById.get(edge.source);
            const targetNode = nodesById.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            const sPos = getHandlePoint(sourceNode.position, edge.sourceHandle || 'right');
            const tPos = getHandlePoint(targetNode.position, edge.targetHandle || 'left');
            const pathD = calculateBezierPath(sPos, tPos, edge.sourceHandle, edge.targetHandle);
            const isSelected = selectedEdgeId === edge.id;

            return (
              <g
                key={edge.id}
                data-edge-id={edge.id}
                className="cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdgeId(edge.id);
                  onSelectNode(null);
                }}
              >
                {/* Thick invisible click hit target */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="18" />

                {/* Visible glowing wire */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#FACC15' : '#8B5CF6'}
                  strokeWidth={isSelected ? '3' : '2'}
                  strokeDasharray={edge.animated ? '8 6' : undefined}
                  className={edge.animated ? 'animate-flow-dash' : undefined}
                  markerEnd={isSelected ? 'url(#flow-arrow-selected)' : 'url(#flow-arrow)'}
                />

                {/* Optional Edge Label */}
                {edge.label && (
                  <text
                    x={(sPos.x + tPos.x) / 2}
                    y={(sPos.y + tPos.y) / 2 - 8}
                    fill="#C084FC"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Rubber-band connecting preview wire */}
          {connecting && (() => {
            const sourceNode = nodesById.get(connecting.source);
            if (!sourceNode) return null;
            const sPos = getHandlePoint(sourceNode.position, connecting.sourceHandle);
            const pathD = calculateBezierPath(sPos, connecting.target, connecting.sourceHandle, 'left');

            return (
              <path
                d={pathD}
                fill="none"
                stroke="#F472B6"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="animate-pulse"
              />
            );
          })()}
        </svg>

        {/* Nodes Layer with Butter-Smooth Dragging */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="flow-board__node"
            style={{
              transform: `translate3d(${node.position.x}px, ${node.position.y}px, 0)`,
            }}
            onPointerDown={(event) => startNodeDrag(event, node.id)}
            onPointerMove={moveNodeDrag}
            onPointerUp={stopNodeDrag}
            onPointerCancel={stopNodeDrag}
          >
            <NodeCard
              node={node}
              selected={selectedNodeId === node.id}
              hasViolation={violatedNodeIds.includes(node.id)}
              isConnectable={flowConnectMode}
              onHandlePointerDown={startConnection}
            />
          </div>
        ))}
      </div>

      {/* Floating Action Dock (Floated at bottom center of visual board) */}
      <div 
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 border border-[#3B2564] bg-[#0E071F]/95 backdrop-blur-md shadow-2xl shadow-black/80 select-none"
        role="toolbar"
        aria-label="Visual Board Actions Dock"
      >
        {/* Selection Status Meta */}
        <div className="hidden sm:flex items-center gap-1.5 pr-2.5 border-r border-[#261B42] text-[10px] font-mono">
          <span className="text-zinc-500 uppercase font-bold tracking-wider">SELECT:</span>
          {selectedNodeId ? (
            <span className="text-[#C084FC] font-semibold truncate max-w-[110px]" title={nodesById.get(selectedNodeId)?.data.label}>
              {nodesById.get(selectedNodeId)?.data.label || '1 node'}
            </span>
          ) : selectedEdgeId ? (
            <span className="text-amber-400 font-semibold">1 wire</span>
          ) : (
            <span className="text-zinc-500">None</span>
          )}
        </div>

        {/* 1. Flow Connect (Toggle custom node connection handles) */}
        <button
          type="button"
          onClick={onToggleFlowConnect}
          title={flowConnectMode ? "Toggle connection pins OFF (Hide handles)" : "Toggle connection pins ON (Show handles)"}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold transition-all cursor-pointer ${
            flowConnectMode
              ? 'bg-[#7C3AED] text-white border border-[#A855F7] shadow-lg shadow-[#8B5CF6]/30'
              : 'bg-[#110A24] text-zinc-300 hover:text-white hover:bg-[#1E113E] border border-[#261B42]'
          }`}
        >
          <Link2 className={`w-3.5 h-3.5 ${flowConnectMode ? 'text-white' : 'text-[#8B5CF6]'}`} />
          <span>Flow connect</span>
          <span className={`text-[8px] font-bold px-1 py-0.2 rounded-none border ${
            flowConnectMode 
              ? 'bg-[#581C87] border-[#C084FC] text-white' 
              : 'bg-[#180E30] border-[#3B2564] text-zinc-400'
          }`}>
            {flowConnectMode ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* 2. Delete Focused Node / Edge */}
        <button
          type="button"
          onClick={() => {
            if (selectedNodeId) {
              onDeleteSelectedNode?.();
            } else if (selectedEdgeId) {
              onEdgesChange(edges.filter((e) => e.id !== selectedEdgeId));
              setSelectedEdgeId(null);
            }
          }}
          disabled={!selectedNodeId && !selectedEdgeId}
          title={
            selectedNodeId
              ? "Delete focused node (Delete key)"
              : selectedEdgeId
              ? "Delete focused wire (Delete key)"
              : "Select a node or wire to delete"
          }
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold border border-[#261B42] bg-[#110A24] text-zinc-400 hover:text-rose-300 hover:bg-rose-950/60 hover:border-rose-500/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        {/* 3. Zoom In / Out Controls */}
        <div className="flex items-center gap-1 px-2 border-x border-[#261B42]">
          <button
            type="button"
            onClick={() => {
              const nextZoom = Math.max(0.3, viewport.zoom - 0.15);
              setViewport((v) => ({ ...v, zoom: Number(nextZoom.toFixed(2)) }));
            }}
            className="p-1 text-zinc-400 hover:text-white hover:bg-[#261B42] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setViewport({ x: 30, y: 30, zoom: 0.88 })}
            className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 hover:text-[#C084FC] tabular-nums font-semibold cursor-pointer hover:bg-[#261B42]/50 transition-colors"
            title="Reset Zoom to 88%"
          >
            {Math.round(viewport.zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={() => {
              const nextZoom = Math.min(2.2, viewport.zoom + 0.15);
              setViewport((v) => ({ ...v, zoom: Number(nextZoom.toFixed(2)) }));
            }}
            className="p-1 text-zinc-400 hover:text-white hover:bg-[#261B42] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. Clear Board */}
        <button
          type="button"
          onClick={onClearBoard}
          title="Clear all nodes and wires on the board"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold border border-[#261B42] bg-[#110A24] text-zinc-400 hover:text-amber-300 hover:bg-amber-950/40 hover:border-amber-500/70 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear board</span>
        </button>
      </div>
    </div>
  );
};
