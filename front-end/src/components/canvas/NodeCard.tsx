import React, { memo, PointerEvent } from 'react';
import { 
  Server, 
  Cpu, 
  RadioTower, 
  Globe, 
  Activity, 
  Gauge, 
  ShieldAlert, 
  Clock, 
  Lock, 
  Shield, 
  ShieldCheck, 
  Key, 
  ArrowRightCircle, 
  AlertOctagon, 
  Bell, 
  RefreshCw, 
  TrendingUp, 
  Zap, 
  FileCode2, 
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { CanvasNode, FlowHandleId } from './types';
import { CATEGORY_THEMES, NODE_HEIGHT, NODE_WIDTH } from './constants';

interface NodeCardProps {
  node: CanvasNode;
  selected: boolean;
  hasViolation?: boolean;
  isConnectable?: boolean;
  onHandlePointerDown: (e: PointerEvent<HTMLButtonElement>, nodeId: string, handle: FlowHandleId) => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Server,
  Cpu,
  RadioTower,
  Globe,
  Activity,
  Gauge,
  ShieldAlert,
  Clock,
  Lock,
  Shield,
  ShieldCheck,
  Key,
  ArrowRightCircle,
  AlertOctagon,
  Bell,
  RefreshCw,
  TrendingUp,
  Zap,
  FileCode2,
  FileText,
};

const KIND_TO_ICON: Record<string, React.FC<any>> = {
  ws_substrate: Server,
  evm_rpc: Cpu,
  standby_node: RadioTower,
  p2p_sensor: Globe,
  heartbeat_daemon: Activity,
  desync_detector: Gauge,
  rpc_spam_filter: ShieldAlert,
  era_scanner: Clock,
  mutex_lock: Lock,
  rpc_rate_limiter: Shield,
  safe_gate: ShieldCheck,
  rotate_keys: Key,
  promote_standby: ArrowRightCircle,
  emergency_chill: AlertOctagon,
  discord_alert: Bell,
  restart_node: RefreshCw,
  compound_yield: TrendingUp,
  top_16_filter: Zap,
  export_cli: FileCode2,
  incident_report: FileText,
  chaos_evm_lag: Clock,
  chaos_heartbeat_cut: AlertTriangle,
  chaos_rpc_ddos: ShieldAlert,
};

const HANDLES: FlowHandleId[] = ['left', 'right', 'top', 'bottom'];

export const NodeCard = memo(function NodeCard({
  node,
  selected,
  hasViolation,
  isConnectable = false,
  onHandlePointerDown,
}: NodeCardProps) {
  const theme = CATEGORY_THEMES[node.data.category] || CATEGORY_THEMES.INFRA;
  const iconName = (node.data as any).iconName;
  const IconComponent =
    KIND_TO_ICON[node.data.kind] ||
    (iconName ? ICON_MAP[iconName] : null) ||
    ICON_MAP[node.data.kind] ||
    Activity;

  return (
    <div
      data-node-id={node.id}
      style={{
        width: `${NODE_WIDTH}px`,
        height: `${NODE_HEIGHT}px`,
      }}
      className={`tech-corner-accent relative select-none p-3.5 rounded-none border transition-colors duration-150 group ${
        hasViolation
          ? 'border-rose-500 bg-[#1F0712] shadow-lg shadow-rose-950/80 animate-pulse'
          : node.data.status === 'running'
          ? 'border-[#38BDF8] bg-[#0A192F] shadow-xl shadow-[#38BDF8]/40 ring-2 ring-[#38BDF8] ring-offset-1 ring-offset-[#06030D]'
          : selected
          ? 'border-[#C084FC] bg-[#160D33] shadow-lg shadow-[#8B5CF6]/30 ring-1 ring-[#C084FC]'
          : `${theme.border} ${theme.bg} hover:border-[#8B5CF6] hover:shadow-md`
      }`}
    >
      {/* 4 Port Handles for Wiring (Hidden by default, shown when Flow Connect is ON) */}
      {isConnectable && HANDLES.map((handle) => (
        <button
          key={handle}
          type="button"
          data-node-id={node.id}
          data-flow-handle={handle}
          title={`Drag to connect from ${handle} port`}
          onPointerDown={(e) => onHandlePointerDown(e, node.id, handle)}
          className={`portal-node__handle portal-node__handle--${handle} transition-transform hover:scale-125 animate-in fade-in duration-100`}
        >
          <span className="block w-1.5 h-1.5 bg-[#8B5CF6] mx-auto my-auto pointer-events-none" />
        </button>
      ))}

      {/* Header with Category Badge & Status Indicator */}
      <div className="flex items-center justify-between mb-2 pointer-events-none">
        <span
          className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-none border font-bold ${
            hasViolation ? 'border-rose-500 text-rose-400 bg-rose-950/60' : theme.badgeBg
          }`}
        >
          {hasViolation ? 'SAFETY VIOLATION' : node.data.category}
        </span>

        {/* Live Status LED */}
        <div className="flex items-center gap-1.5">
          {node.data.status === 'running' ? (
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#8B5CF6] font-bold">
              <Loader2 className="w-3 h-3 animate-spin text-[#C084FC]" />
              RUNNING
            </span>
          ) : node.data.status === 'success' ? (
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#10B981] font-bold">
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              READY
            </span>
          ) : node.data.status === 'error' || hasViolation ? (
            <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 font-bold">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              ALERT
            </span>
          ) : (
            <span className="w-2 h-2 rounded-none bg-[#8B5CF6]/50 group-hover:bg-[#C084FC]" />
          )}
        </div>
      </div>

      {/* Node Title with Icon */}
      <div className="flex items-center gap-2 mb-1.5 pointer-events-none">
        <div
          className={`w-5 h-5 rounded-none flex items-center justify-center shrink-0 border ${
            hasViolation ? 'border-rose-500 text-rose-400 bg-rose-950/50' : `${theme.border} ${theme.text}`
          }`}
        >
          <IconComponent className="w-3 h-3" />
        </div>
        <div className="text-xs font-mono font-bold text-white truncate" title={node.data.label}>
          {node.data.label}
        </div>
      </div>

      {/* Compact Config Attributes */}
      <div className="p-2 rounded-none bg-[#06030D]/90 border border-[#261B42]/60 text-[10px] font-mono text-zinc-400 space-y-0.5 overflow-hidden max-h-[62px] pointer-events-none">
        {Object.entries(node.data.config || {})
          .slice(0, 2)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between items-center gap-2">
              <span className="text-zinc-500 truncate capitalize">{k}:</span>
              <span className="text-zinc-200 truncate font-semibold tabular-nums">{String(v)}</span>
            </div>
          ))}
        {Object.keys(node.data.config || {}).length === 0 && (
          <div className="text-zinc-600 italic truncate">{node.data.description}</div>
        )}
      </div>
    </div>
  );
});
