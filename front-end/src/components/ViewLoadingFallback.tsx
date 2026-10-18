import React from 'react';

export interface ViewLoadingFallbackProps {
  message?: string;
}

export const ViewLoadingFallback: React.FC<ViewLoadingFallbackProps> = ({
  message = 'Initializing View Module...'
}) => (
  <div className="flex-1 h-full min-h-[300px] flex items-center justify-center p-6 bg-[#080512]">
    <div className="flex items-center gap-3">
      <div className="w-4 h-4 rounded-full border-2 border-[#8B5CF6]/25 border-t-[#8B5CF6] animate-spin shrink-0" />
      <span className="text-[12px] font-mono tracking-wider text-zinc-400 uppercase select-none">
        {message}
      </span>
    </div>
  </div>
);

export default ViewLoadingFallback;
