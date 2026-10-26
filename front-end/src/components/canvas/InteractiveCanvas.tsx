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
  readOnly?: boolean;
  allowNodeDragInReadOnly?: boolean;
  hideToolbar?: boolean;
}

export const InteractiveCanvas = React.memo(function InteractiveCanvas({
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
  readOnly = false,
  allowNodeDragInReadOnly = false,
  hideToolbar = false,
}: InteractiveCanvasProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<CanvasViewport>(
    initialViewport || { x: 30, y: 30, zoom: 0.88 }
  );
  const viewportRef = useRef<CanvasViewport>(viewport);
  viewportRef.current = viewport;

  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Throttled notification to parent so parent doesn't re-render 120 times/sec
  const lastNotifiedViewportRef = useRef(viewport);
  const notifyRafRef = useRef<number | null>(null);
  useEffect(() => {
    const curX = viewport?.x ?? 0;
    const curY = viewport?.y ?? 0;
    const curZoom = viewport?.zoom ?? 0.88;
    const lastX = lastNotifiedViewportRef.current?.x ?? 0;
    const lastY = lastNotifiedViewportRef.current?.y ?? 0;
    const lastZoom = lastNotifiedViewportRef.current?.zoom ?? 0.88;

    if (curX !== lastX || curY !== lastY || curZoom !== lastZoom) {
      lastNotifiedViewportRef.current = viewport;
      if (notifyRafRef.current === null) {
        notifyRafRef.current = window.requestAnimationFrame(() => {
          notifyRafRef.current = null;
          onViewportChange?.(viewport);
        });
      }
    }
    return () => {
      if (notifyRafRef.current !== null) {
        window.cancelAnimationFrame(notifyRafRef.current);
        notifyRafRef.current = null;
      }
    };
  }, [viewport, onViewportChange]);

  // Synchronize initialViewport ONLY on external reset/preset change, NEVER during live interaction!
  const lastInitialViewportRef = useRef(initialViewport);
  useEffect(() => {
    if (!initialViewport) return;
    if (isPanning) return; // Never snap back while user is holding mouse / panning!

    const currentVp = viewportRef.current || { x: 30, y: 30, zoom: 0.88 };
    const initX = initialViewport.x ?? 30;
    const initY = initialViewport.y ?? 30;
    const initZoom = initialViewport.zoom ?? 0.88;
    const curX = currentVp.x ?? 30;
    const curY = currentVp.y ?? 30;
    const curZoom = currentVp.zoom ?? 0.88;

    if (
      initialViewport !== lastInitialViewportRef.current &&
      (Math.abs(initX - curX) > 2 ||
        Math.abs(initY - curY) > 2 ||
        Math.abs(initZoom - curZoom) > 0.02)
    ) {
      lastInitialViewportRef.current = initialViewport;
      setViewport(initialViewport);
    }
  }, [initialViewport, isPanning]);

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
      const curVp = viewportRef.current || viewport || { x: 30, y: 30, zoom: 0.88 };
      const zoom = Number.isFinite(curVp.zoom) && curVp.zoom > 0 ? curVp.zoom : 0.88;
      const vpX = Number.isFinite(curVp.x) ? curVp.x : 0;
      const vpY = Number.isFinite(curVp.y) ? curVp.y : 0;
      return {
        x: (clientX - rect.left - vpX) / zoom,
        y: (clientY - rect.top - vpY) / zoom,
      };
    },
    [viewport]
  );

  // Smooth RAF movement flusher
  const flushMove = useCallback(() => {
    rafRef.current = null;
    const pending = pendingMoveRef.current;
    if (!pending || !pending.delta) return;
    pendingMoveRef.current = null;
    const { nodeIds, delta } = pending;
    if (Number.isFinite(delta.x) && Number.isFinite(delta.y)) {
      onMoveNodes(nodeIds, { x: delta.x, y: delta.y });
    }
  }, [onMoveNodes]);

  const scheduleMove = useCallback(
    (nodeIds: string[], delta: { x: number; y: number } | null | undefined) => {
      if (!delta || !Number.isFinite(delta.x) || !Number.isFinite(delta.y)) return;
      if (pendingMoveRef.current && pendingMoveRef.current.delta) {
        pendingMoveRef.current.delta.x += delta.x;
        pendingMoveRef.current.delta.y += delta.y;
      } else {
        pendingMoveRef.current = { nodeIds, delta: { x: delta.x, y: delta.y } };
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
      if (readOnly && !allowNodeDragInReadOnly) return;
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
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_) {}
    },
    [readOnly, allowNodeDragInReadOnly, onSelectNode]
  );

  const moveNodeDrag = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId || !drag.origin || !drag.lastDelta) return;

      const curZoom = Number.isFinite(viewport?.zoom) && viewport!.zoom > 0 ? viewport!.zoom : 0.88;
      const originX = Number.isFinite(drag.origin.x) ? drag.origin.x : event.clientX;
      const originY = Number.isFinite(drag.origin.y) ? drag.origin.y : event.clientY;

      const dx = (event.clientX - originX) / curZoom;
      const dy = (event.clientY - originY) / curZoom;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;

      const nextDelta = { x: dx, y: dy };
      const lastX = Number.isFinite(drag.lastDelta.x) ? drag.lastDelta.x : 0;
      const lastY = Number.isFinite(drag.lastDelta.y) ? drag.lastDelta.y : 0;
      const frameDelta = {
        x: nextDelta.x - lastX,
        y: nextDelta.y - lastY,
      };
      drag.lastDelta = nextDelta;
      scheduleMove(drag.nodeIds, frameDelta);
    },
    [viewport?.zoom, scheduleMove]
  );

  const stopNodeDrag = useCallback(
    (event?: PointerEvent<HTMLDivElement> | globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (event && 'pointerId' in event && drag.pointerId !== event.pointerId) return;

      if (event && 'currentTarget' in event && event.currentTarget) {
        try {
          const el = event.currentTarget as HTMLElement;
          if (el.hasPointerCapture && el.hasPointerCapture(drag.pointerId)) {
            el.releasePointerCapture(drag.pointerId);
          }
        } catch (_) {}
      }

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        flushMove();
      }
      dragRef.current = null;
    },
    [flushMove]
  );

  // Canvas Viewport Pan Handlers (Butter-smooth RAF 120fps)
  const panPendingRef = useRef<{ x: number; y: number } | null>(null);
  const panRafRef = useRef<number | null>(null);

  const startPan = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (event.button !== 0 && event.button !== 1) return;
    const curVp = viewportRef.current || { x: 30, y: 30 };
    panRef.current = {
      pointerId: event.pointerId,
      origin: { x: event.clientX, y: event.clientY },
      viewport: { x: curVp.x ?? 30, y: curVp.y ?? 30 },
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (_) {}
    setIsPanning(true);
  }, []);

  const movePan = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId || !pan.origin || !pan.viewport) return;

    panPendingRef.current = {
      x: (pan.viewport.x ?? 0) + (event.clientX - (pan.origin.x ?? event.clientX)),
      y: (pan.viewport.y ?? 0) + (event.clientY - (pan.origin.y ?? event.clientY)),
    };

    if (panRafRef.current === null) {
      panRafRef.current = window.requestAnimationFrame(() => {
        panRafRef.current = null;
        const pending = panPendingRef.current;
        if (pending && Number.isFinite(pending.x) && Number.isFinite(pending.y)) {
          const { x: targetX, y: targetY } = pending;
          setViewport((current) => {
            const cur = current || { x: 30, y: 30, zoom: 0.88 };
            return {
              ...cur,
              x: targetX,
              y: targetY,
            };
          });
        }
      });
    }
  }, []);

  const stopPan = useCallback((event?: PointerEvent<HTMLDivElement> | globalThis.PointerEvent) => {
    if (panRef.current && (!event || !('pointerId' in event) || panRef.current.pointerId === event.pointerId)) {
      if (panRafRef.current !== null) {
        window.cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
      if (panPendingRef.current) {
        const finalPos = panPendingRef.current;
        panPendingRef.current = null;
        if (Number.isFinite(finalPos.x) && Number.isFinite(finalPos.y)) {
          const { x: finalX, y: finalY } = finalPos;
          setViewport((current) => {
            const cur = current || { x: 30, y: 30, zoom: 0.88 };
            return {
              ...cur,
              x: finalX,
              y: finalY,
            };
          });
        }
      }
      if (event && 'currentTarget' in event && event.currentTarget) {
        try {
          const el = event.currentTarget as HTMLElement;
          if (el.hasPointerCapture && el.hasPointerCapture(panRef.current.pointerId)) {
            el.releasePointerCapture(panRef.current.pointerId);
          }
        } catch (_) {}
      }
      panRef.current = null;
      setIsPanning(false);
    }
  }, []);

  // Wheel handler: Ctrl + Wheel to Zoom towards pointer; Normal Wheel to Pan board
  const zoomBoard = useCallback(
    (event: globalThis.WheelEvent) => {
      if (readOnly) return;
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const deltaModeScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      const wheelDeltaX = event.deltaX * deltaModeScale;
      const wheelDeltaY = event.deltaY * deltaModeScale;

      const isZoomKey = event.ctrlKey || event.metaKey;

      if (!isZoomKey) {
        // Normal wheel scrolling pans the board vertically / horizontally (Shift + Wheel)
        event.preventDefault();
        setViewport((current) => {
          const cur = current || { x: 30, y: 30, zoom: 0.88 };
          const curX = Number.isFinite(cur.x) ? cur.x : 0;
          const curY = Number.isFinite(cur.y) ? cur.y : 0;
          return {
            ...cur,
            x: curX - (event.shiftKey ? wheelDeltaY : wheelDeltaX),
            y: curY - (event.shiftKey ? 0 : wheelDeltaY),
          };
        });
        return;
      }

      // ONLY Zoom when Ctrl or Meta key is pressed
      event.preventDefault();
      event.stopPropagation();

      const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };

      setViewport((current) => {
        const cur = current || { x: 30, y: 30, zoom: 0.88 };
        const curZoom = Number.isFinite(cur.zoom) && cur.zoom > 0 ? cur.zoom : 0.88;
        const curX = Number.isFinite(cur.x) ? cur.x : 0;
        const curY = Number.isFinite(cur.y) ? cur.y : 0;

        const nextZoom = Math.min(2.2, Math.max(0.3, curZoom - wheelDeltaY * 0.0015));
        const flow = {
          x: (pointer.x - curX) / curZoom,
          y: (pointer.y - curY) / curZoom,
        };

        return {
          zoom: Number(nextZoom.toFixed(3)),
          x: Number((pointer.x - flow.x * nextZoom).toFixed(2)),
          y: Number((pointer.y - flow.y * nextZoom).toFixed(2)),
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
      if (readOnly || !flowConnectMode) return;
      event.preventDefault();
      event.stopPropagation();
      const sourceNode = nodesById.get(nodeId);
      if (!sourceNode) return;

      setConnecting({
        source: nodeId,
        sourceHandle,
        target: getHandlePoint(sourceNode.position, sourceHandle),
      });
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

      try {
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
      } catch (err) {
        console.warn('Error during finishConnection:', err);
      } finally {
        setConnecting(null);
      }
    },
    [connecting, onConnect]
  );

  // Global safety fallback for node drag, viewport pan, and wire connection
  useEffect(() => {
    const handleGlobalPointerUp = (e: globalThis.PointerEvent) => {
      if (dragRef.current && (!e.pointerId || dragRef.current.pointerId === e.pointerId)) {
        stopNodeDrag(e);
      }
      if (panRef.current && (!e.pointerId || panRef.current.pointerId === e.pointerId)) {
        stopPan(e);
      }
      setConnecting(null);
    };

    const handleWindowBlur = () => {
      if (dragRef.current) {
        stopNodeDrag();
      }
      if (panRef.current) {
        stopPan();
      }
      setConnecting(null);
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [stopNodeDrag, stopPan]);

  // Template Drag & Drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    e.preventDefault();
    const templateData = e.dataTransfer.getData('application/dotnexus-node-template');
    if (!templateData) return;

    try {
      const template: NodeTemplate = JSON.parse(templateData);
      const worldPos = screenToFlow(e.clientX, e.clientY);
      const posX = Number.isFinite(worldPos.x) ? Math.round(worldPos.x - NODE_WIDTH / 2) : 100;
      const posY = Number.isFinite(worldPos.y) ? Math.round(worldPos.y - NODE_HEIGHT / 2) : 100;
      onDropTemplate(template, {
        x: posX,
        y: posY,
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

  const vpX = viewport?.x ?? 30;
  const vpY = viewport?.y ?? 30;
  const vpZoom = viewport?.zoom ?? 0.88;

  return (
    <div
      ref={boardRef}
      className={`flow-board ${isPanning ? 'is-panning' : ''} ${readOnly && !allowNodeDragInReadOnly ? 'is-readonly' : ''} ${readOnly && allowNodeDragInReadOnly ? 'is-readonly-drag-nodes' : ''}`}
      onPointerDown={(event) => {
        if (readOnly) return;
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
        backgroundSize: `${28 * vpZoom}px ${28 * vpZoom}px`,
        backgroundPosition: `${vpX}px ${vpY}px`,
      }}
    >

      {/* Scaled & Translated World Layer */}
      <div
        className="flow-board__world"
        style={{
          transform: `translate3d(${vpX}px, ${vpY}px, 0) scale(${vpZoom})`,
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
        {nodes.map((node) => {
          if (!node || !node.id) return null;
          const posX = Number.isFinite(node.position?.x) ? node.position.x : 0;
          const posY = Number.isFinite(node.position?.y) ? node.position.y : 0;
          return (
            <div
              key={node.id}
              className="flow-board__node"
              style={{
                transform: `translate3d(${posX}px, ${posY}px, 0)`,
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
          );
        })}
      </div>

      {/* Floating Action Dock (Floated at bottom center of visual board) */}
      {!hideToolbar && !readOnly && (
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
      )}
    </div>
  );
});
