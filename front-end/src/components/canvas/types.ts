export type FlowHandleId = 'left' | 'right' | 'top' | 'bottom';
export type FlowHandleType = 'trigger' | 'telemetry' | 'security' | 'action' | 'any';
export type NodeCategory = 'INFRA' | 'WATCHER' | 'SECURITY' | 'ACTION' | 'STAKING' | 'CHAOS' | 'TREASURY';
export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

export interface CanvasNodeData {
  kind: string;
  category: NodeCategory;
  label: string;
  description: string;
  status: NodeStatus;
  config: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  lastError?: string;
}

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: CanvasNodeData;
  selected?: boolean;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: FlowHandleId;
  targetHandle?: FlowHandleId;
  label?: string;
  animated?: boolean;
  condition?: string;
  selected?: boolean;
}

export interface NodeTemplate {
  kind: string;
  category: NodeCategory;
  label: string;
  description: string;
  iconName: string;
  defaultConfig: Record<string, any>;
}

export interface SafetyIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  nodeId?: string;
  edgeId?: string;
  title: string;
  message: string;
  autoFixAvailable?: boolean;
}

export interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasWorkflow {
  id: string;
  name: string;
  description: string;
  category: NodeCategory | 'CUSTOM' | 'TELEMETRY' | 'SECURITY' | 'STAKING' | 'TREASURY';
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport?: CanvasViewport;
  isCustom?: boolean;
  status?: 'ACTIVE' | 'ARMED' | 'DRAFT';
  updatedAt: number;
}
