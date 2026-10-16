import React, { useState, useEffect } from 'react';
import { X, Edit3, Check } from 'lucide-react';

export interface RenameWorkflowModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export const RenameWorkflowModal: React.FC<RenameWorkflowModalProps> = ({
  isOpen,
  currentName,
  onClose,
  onRename,
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onRename(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div 
        className="relative w-full max-w-md border border-[#2D1F52] bg-[#0E071F] p-5 shadow-2xl text-[#E2E8F0] font-mono space-y-4 tech-corner-accent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#261B42] pb-2.5">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#C084FC]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Rename Canvas Workflow
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-[#1A1033] border border-transparent hover:border-[#3B2564] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">
              Workflow Name:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#06030D] border border-[#261B42] focus:border-[#8B5CF6] text-white px-3 py-2 text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-mono border border-[#261B42] hover:border-zinc-500 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold border border-[#8B5CF6] bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all shadow-md shadow-[#8B5CF6]/30 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
