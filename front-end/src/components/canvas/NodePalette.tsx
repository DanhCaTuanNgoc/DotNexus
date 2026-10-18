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
import { storage } from '../../services/storage';

interface NodePaletteProps {
  onAddNode: (template: NodeTemplate) => void;
  onClose?: () => void;
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

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode, onClose }) => {
  const [selectedCategory, setSelectedCategoryState] = useState<'ALL' | NodeCategory>(
    () => storage.getPaletteCategory('ALL') as 'ALL' | NodeCategory
  );
  const [searchQuery, setSearchQuery] = useState('');

  const setSelectedCategory = (cat: 'ALL' | NodeCategory) => {
    setSelectedCategoryState(cat);
    storage.setPaletteCategory(cat);
  };

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
    <div className="w-72 h-full max-h-full border-r border-[#1C142E] bg-[#08050F] flex flex-col shrink-0 select-none overflow-hidden">
      <div className="p-2.5 border-b border-[#1C142E] shrink-0">
        <div className="text-[10px] uppercase font-mono text-[#C084FC] font-bold tracking-wider mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>Ops Node Toolbox</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#0E091B] border border-[#2E1F4A] text-zinc-300">
              {NODE_TEMPLATES.length}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden text-zinc-400 hover:text-white p-0.5 text-xs font-mono"
              title="Close Toolbox"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter operations nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#06040A] border border-[#1C142E] text-xs font-mono text-zinc-200 pl-8 pr-2 py-1.5 focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 text-[9px] font-mono border transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'border-[#8B5CF6] bg-[#110C1E] text-white font-bold'
                  : 'border-[#1C142E] bg-[#06040A] text-zinc-400 hover:text-zinc-200 hover:border-[#2E1F4A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Node Catalog List - Constrained internal scroll container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 overscroll-contain">
        {filteredTemplates.map((tpl) => {
          const theme = CATEGORY_THEMES[tpl.category];
          const Icon = ICON_MAP[tpl.iconName] || Activity;

          return (
            <div
              key={tpl.kind}
              draggable
              onDragStart={(e) => handleDragStart(e, tpl)}
              className="tech-corner-accent p-2 border border-[#261B42] bg-[#110A24] hover:border-[#8B5CF6] hover:bg-[#160D33] transition-all cursor-grab active:cursor-grabbing group shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[8px] uppercase font-mono px-1.5 py-0.2 rounded-none border font-bold ${theme.badgeBg}`}>
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

      <div className="p-1.5 border-t border-[#261B42] text-[9px] font-mono text-zinc-500 text-center shrink-0 bg-[#06030D]">
        Drag & drop into canvas or click [+]
      </div>
    </div>
  );
};
