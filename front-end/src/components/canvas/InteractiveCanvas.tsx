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
  isExecuting?: boolean;
  activeEdgeId?: string | null;
  completedEdgeIds?: string[];
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
  isExecuting = false,
  activeEdgeId = null,
  completedEdgeIds = [],
}) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<CanvasViewport>(
    initialViewport || { x: 30, y: 30, zoom: 0.88 }
  );
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const lastNotifiedViewportRef = useRef(viewport);
  useEffect(() => {
    if (
      viewport.x !== lastNotifiedViewportRef.current.x ||
      viewport.y !== lastNotifiedViewportRef.current.y ||
      viewport.zoom !== lastNotifiedViewportRef.current.zoom
    ) {
      lastNotifiedViewportRef.current = viewport;
      onViewportChange?.(viewport);
    }
  }, [viewport, onViewportChange]);

  const lastInitialViewportRef = useRef(initialViewport);
  useEffect(() => {
    if (
      initialViewport &&
      (initialViewport.x !== lastInitialViewportRef.current?.x ||
        initialViewport.y !== lastInitialViewportRef.current?.y ||
        initialViewport.zoom !== lastInitialViewportRef.current?.zoom)
    ) {
      lastInitialViewportRef.current = initialViewport;
      setViewport(initialViewport);
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
      if (pendingMoveRef.current) {
        pendingMoveRef.current.delta.x += delta.x;
        pendingMoveRef.current.delta.y += delta.y;
      } else {
        pendingMoveRef.current = { nodeIds, delta: { ...delta } };
      }
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
        // Do NOT cancel selection or start panning when clicking on the action dock or buttons
        if ((event.target as HTMLElement).closest('[role="toolbar"], .canvas-action-dock, button')) {
          return;
        }

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
            {/* Standard Idle Arrow Marker (Crisp stationary purple) */}
            <marker
              id="flow-arrow"
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <polygon points="0 1, 10 5, 0 9" fill="#8B5CF6" />
            </marker>

            {/* Running Flow Arrow Marker (Soft glowing violet) */}
            <marker
              id="flow-arrow-running"
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <polygon points="0 1, 10 5, 0 9" fill="#C084FC" />
            </marker>

            {/* Active Execution Arrow Marker (High-visibility glowing cyan) */}
            <marker
              id="flow-arrow-active"
              markerWidth="13"
              markerHeight="11"
              refX="11"
              refY="5.5"
              orient="auto"
            >
              <polygon points="0 1, 11 5.5, 0 10" fill="#38BDF8" stroke="#0E071F" strokeWidth="0.8" />
            </marker>

            {/* Selected Arrow Marker (Gold / Yellow) */}
            <marker
              id="flow-arrow-selected"
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <polygon points="0 1, 10 5, 0 9" fill="#FACC15" />
            </marker>

            {/* Completed Flow Arrow Marker (Dominant purple) */}
            <marker
              id="flow-arrow-completed"
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <polygon points="0 1, 10 5, 0 9" fill="#A855F7" />
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

            // Strictly sequential wire flow logic:
            // 1. isWireActive: THIS wire is actively transmitting data right now (activeEdgeId matches!)
            const isWireActive = edge.id === activeEdgeId;
            // 2. isWireCompleted: THIS wire has completed its transmission
            const isWireCompleted = completedEdgeIds.includes(edge.id) || (!isExecuting && sourceNode.data.status === 'success' && targetNode.data.status === 'success');

            // Restrained stroke styling:
            // - Selected: Gold (#FACC15)
            // - Active transmitting wire: Glowing Cyan Laser (#38BDF8)
            // - Completed wire: Crisp Dominant Purple (#A855F7)
            // - Idle/pending wire: Stationary Deep Purple (#7C3AED)
            const strokeColor = isSelected
              ? '#FACC15'
              : isWireActive
              ? '#38BDF8'
              : isWireCompleted
              ? '#A855F7'
              : '#7C3AED';

            const strokeWidth = isSelected ? '2.5' : isWireActive ? '2.5' : '2';

            // Dashed and moving ONLY on the wire that is actively transmitting right now!
            const isDashed = isWireActive;
            const strokeDasharray = isDashed ? '8 6' : undefined;
            const className = isDashed ? 'animate-flow-dash' : 'wire-idle';

            // Glowing light ONLY on the actively transmitting wire (or subtle ambient on completed)
            const filterStyle = isWireActive
              ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.9)) drop-shadow(0 0 12px rgba(56, 189, 248, 0.45))'
              : isWireCompleted
              ? 'drop-shadow(0 0 3px rgba(168, 85, 247, 0.4))'
              : undefined;

            const markerEnd = isSelected
              ? 'url(#flow-arrow-selected)'
              : isWireActive
              ? 'url(#flow-arrow-active)'
              : isWireCompleted
              ? 'url(#flow-arrow-completed)'
              : 'url(#flow-arrow)';

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
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />

                {/* Restrained single-wire flow: Solid when idle, moving dashed line with glowing light when executing */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  className={className}
                  markerEnd={markerEnd}
                  style={filterStyle ? { filter: filterStyle } : undefined}
                />

                {/* Optional Edge Label */}
                {edge.label && (
                  <g>
                    <rect
                      x={(sPos.x + tPos.x) / 2 - (edge.label.length * 3.2 + 8)}
                      y={(sPos.y + tPos.y) / 2 - 17}
                      width={edge.label.length * 6.4 + 16}
                      height="15"
                      fill="#0A0516"
                      stroke={isWireActive ? '#38BDF8' : '#261B42'}
                      strokeWidth="1"
                    />
                    <text
                      x={(sPos.x + tPos.x) / 2}
                      y={(sPos.y + tPos.y) / 2 - 6}
                      fill={isWireActive ? '#38BDF8' : '#C084FC'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none"
                    >
                      {edge.label}
                    </text>
                  </g>
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
        className="canvas-action-dock absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 border border-[#3B2564] bg-[#0E071F]/95 backdrop-blur-md shadow-2xl shadow-black/80 select-none"
        role="toolbar"
        aria-label="Visual Board Actions Dock"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
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
