import React, { useState } from 'react';
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
  Search,
  Plus
} from 'lucide-react';
import { NodeCategory, NodeTemplate } from './types';
import { CATEGORY_THEMES, NODE_TEMPLATES } from './constants';

interface NodePaletteProps {
  onAddNode: (template: NodeTemplate) => void;
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

const CATEGORIES: ('ALL' | NodeCategory)[] = ['ALL', 'INFRA', 'WATCHER', 'SECURITY', 'ACTION', 'STAKING'];

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | NodeCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = NODE_TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'ALL' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, template: NodeTemplate) => {
    e.dataTransfer.setData('application/dotnexus-node-template', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-72 border-r border-[#261B42] bg-[#0A0515] flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 border-b border-[#261B42]">
        <div className="text-[10px] uppercase font-mono text-[#C084FC] font-bold tracking-wider mb-2">
          Ops Node Toolbox ({NODE_TEMPLATES.length})
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter operations nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#06030D] border border-[#261B42] text-xs font-mono text-zinc-200 pl-8 pr-2 py-1.5 rounded-none focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 text-[9px] font-mono rounded-none border transition-colors ${
                selectedCategory === cat
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/30 text-white font-bold'
                  : 'border-[#261B42] bg-[#110A24] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Node Catalog List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredTemplates.map((tpl) => {
          const theme = CATEGORY_THEMES[tpl.category];
          const Icon = ICON_MAP[tpl.iconName] || Activity;

          return (
            <div
              key={tpl.kind}
              draggable
              onDragStart={(e) => handleDragStart(e, tpl)}
              className="tech-corner-accent p-2.5 border border-[#261B42] bg-[#110A24] hover:border-[#8B5CF6] hover:bg-[#160D33] transition-all cursor-grab active:cursor-grabbing group shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[8px] uppercase font-mono px-1.5 py-0.5 rounded-none border font-bold ${theme.badgeBg}`}>
                  {tpl.category}
                </span>
                <button
                  onClick={() => onAddNode(tpl)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white p-0.5 rounded-none hover:bg-[#261B42] transition-opacity"
                  title="Add to Canvas"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-none flex items-center justify-center shrink-0 border ${theme.border} ${theme.text}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="text-xs font-mono font-bold text-white truncate">{tpl.label}</div>
              </div>

              <p className="text-[10px] text-zinc-400 font-mono mt-1 line-clamp-2 leading-relaxed">
                {tpl.description}
              </p>
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="text-zinc-500 font-mono text-xs text-center py-6">
            No matching nodes found.
          </div>
        )}
      </div>

      <div className="p-2 border-t border-[#261B42] text-[10px] font-mono text-zinc-500 text-center">
        Drag & drop into canvas or click [+]
      </div>
    </div>
  );
};
