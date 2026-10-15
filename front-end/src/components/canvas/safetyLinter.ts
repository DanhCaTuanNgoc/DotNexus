import { CanvasEdge, CanvasNode, SafetyIssue } from './types';
import { NODE_TEMPLATES } from './constants';

export function validateCanvasSafety(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): { issues: SafetyIssue[]; hasCritical: boolean; hasWarning: boolean } {
  const issues: SafetyIssue[] = [];

  // 1. Cycle Detection via Kahn's Algorithm
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    adj[n.id] = [];
  });

  edges.forEach((e) => {
    if (adj[e.source]) {
      adj[e.source].push(e.target);
    }
    if (inDegree[e.target] !== undefined) {
      inDegree[e.target] = (inDegree[e.target] || 0) + 1;
    }
  });

  const queue: string[] = [];
  Object.keys(inDegree).forEach((id) => {
    if (inDegree[id] === 0) queue.push(id);
  });

  let visitedCount = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    visitedCount++;
    (adj[curr] || []).forEach((neighbor) => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  if (visitedCount < nodes.length && nodes.length > 0) {
    issues.push({
      id: 'cycle-detected',
      severity: 'critical',
      title: 'Vòng Lặp Vô Hạn (Cycle Detected)',
      message: 'Phát hiện chu trình phụ thuộc vòng tròn giữa các node. Đồ thị DAG chỉ chấp nhận luồng một chiều!',
      autoFixAvailable: false,
    });
  }

  // 2. Anti-Equivocation Violation Check:
  // Any node that performs Standby Promotion or IP Switch MUST have a Mutex Lock upstream
  const standbyNodes = nodes.filter(
    (n) => n.data.kind === 'promote_standby' || n.data.label.toLowerCase().includes('standby')
  );

  standbyNodes.forEach((sbNode) => {
    // DFS / BFS upstream to find if mutex_lock is an ancestor
    const visited = new Set<string>();
    const upstreamQueue = [sbNode.id];
    let hasMutex = false;

    while (upstreamQueue.length > 0) {
      const currentId = upstreamQueue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const incomingEdges = edges.filter((e) => e.target === currentId);
      for (const e of incomingEdges) {
        const sourceNode = nodes.find((n) => n.id === e.source);
        if (sourceNode) {
          if (
            sourceNode.data.kind === 'mutex_lock' ||
            sourceNode.data.category === 'SECURITY' ||
            sourceNode.data.label.toLowerCase().includes('mutex') ||
            sourceNode.data.label.toLowerCase().includes('equivocation')
          ) {
            hasMutex = true;
            break;
          }
          upstreamQueue.push(sourceNode.id);
        }
      }
      if (hasMutex) break;
    }

    if (!hasMutex) {
      issues.push({
        id: `equivocation-risk-${sbNode.id}`,
        severity: 'critical',
        nodeId: sbNode.id,
        title: 'Nguy Cơ Slashing (Anti-Equivocation Violation)',
        message: `Node "${sbNode.data.label}" kích hoạt IP Standby mà không có Anti-Equivocation Mutex Lock bảo vệ! Có nguy cơ bị phạt Double-Signing 100% token POT.`,
        autoFixAvailable: true,
      });
    }
  });

  // 3. Unconditional Watcher-to-Action Check
  edges.forEach((edge) => {
    const sNode = nodes.find((n) => n.id === edge.source);
    const tNode = nodes.find((n) => n.id === edge.target);

    if (
      sNode &&
      tNode &&
      sNode.data.category === 'WATCHER' &&
      tNode.data.category === 'ACTION' &&
      !edge.label &&
      !edge.condition
    ) {
      issues.push({
        id: `unconditional-trigger-${edge.id}`,
        severity: 'warning',
        edgeId: edge.id,
        title: 'Hành Động Thiếu Điều Kiện Lọc',
        message: `Dây nối giữa "${sNode.data.label}" và "${tNode.data.label}" không có điều kiện kích hoạt. Hành động có thể chạy ngay cả khi hệ thống bình thường.`,
        autoFixAvailable: false,
      });
    }
  });

  const hasCritical = issues.some((i) => i.severity === 'critical');
  const hasWarning = issues.some((i) => i.severity === 'warning');

  return { issues, hasCritical, hasWarning };
}

// 1-Click Topology Auto-Fix: Inserts Anti-Equivocation Lock between upstream node and Standby Node
export function autoFixEquivocation(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const standbyNode = nodes.find(
    (n) => n.data.kind === 'promote_standby' || n.data.label.toLowerCase().includes('standby')
  );
  if (!standbyNode) return { nodes, edges };

  // Find incoming edge to standbyNode
  const incomingEdge = edges.find((e) => e.target === standbyNode.id);
  const upstreamNode = incomingEdge ? nodes.find((n) => n.id === incomingEdge.source) : null;

  // Template for Mutex Lock
  const mutexTpl = NODE_TEMPLATES.find((t) => t.kind === 'mutex_lock') || NODE_TEMPLATES[8];

  const newMutexId = `node-mutex-autofix-${Date.now().toString(36)}`;
  const posX = upstreamNode
    ? (upstreamNode.position.x + standbyNode.position.x) / 2
    : standbyNode.position.x - 300;
  const posY = standbyNode.position.y;

  const newMutexNode: CanvasNode = {
    id: newMutexId,
    type: mutexTpl.category.toLowerCase(),
    position: { x: Math.round(posX), y: posY },
    data: {
      kind: mutexTpl.kind,
      category: mutexTpl.category,
      label: mutexTpl.label,
      description: mutexTpl.description,
      status: 'idle',
      config: { ...mutexTpl.defaultConfig },
    },
  };

  let newEdges = [...edges];

  if (incomingEdge) {
    // Rewire incoming edge: upstream -> newMutex
    // Create new edge: newMutex -> standbyNode
    newEdges = newEdges.filter((e) => e.id !== incomingEdge.id);
    newEdges.push({
      id: `edge-${incomingEdge.source}-${newMutexId}`,
      source: incomingEdge.source,
      target: newMutexId,
      sourceHandle: 'right',
      targetHandle: 'left',
      animated: true,
      label: 'Verified Trigger',
    });
    newEdges.push({
      id: `edge-${newMutexId}-${standbyNode.id}`,
      source: newMutexId,
      target: standbyNode.id,
      sourceHandle: 'right',
      targetHandle: 'left',
      animated: true,
      label: 'Acquire Lease & Promote',
    });
  } else {
    // Direct connect newMutex -> standbyNode
    newEdges.push({
      id: `edge-${newMutexId}-${standbyNode.id}`,
      source: newMutexId,
      target: standbyNode.id,
      sourceHandle: 'right',
      targetHandle: 'left',
      animated: true,
      label: 'Acquire Lease & Promote',
    });
  }

  return {
    nodes: [...nodes, newMutexNode],
    edges: newEdges,
  };
}
