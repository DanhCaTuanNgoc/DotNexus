import React, { useRef, useState } from 'react';

interface ZeroGapGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: string; // e.g. 'grid-cols-1 md:grid-cols-3'
}

/**
 * Zero-Gap Shared-Border Grid Container.
 * All internal cells share 1px border lines without double border stacking or gaps.
 */
export const ZeroGapGrid: React.FC<ZeroGapGridProps> = ({
  children,
  className = '',
  columns = 'grid-cols-1 md:grid-cols-3',
}) => {
  return (
    <div
      className={`grid ${columns} divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border border-white/[0.08] bg-[#07040E] ${className}`}
    >
      {children}
    </div>
  );
};

interface ZeroGapCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  spotlightColor?: string;
  showTicks?: boolean;
}

/**
 * Tactical Zero-Gap Bento Card.
 * Adheres to Craft Floor standards: rounded-none, cursor-following spotlight,
 * subtle 1px border interaction, and engineering tick marks.
 */
export const ZeroGapCard: React.FC<ZeroGapCardProps> = ({
  children,
  className = '',
  onClick,
  spotlightColor = 'rgba(139, 92, 246, 0.12)',
  showTicks = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      ref={cardRef}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative p-6 bg-[#090516]/80 hover:bg-white/[0.02] transition-colors duration-150 flex flex-col justify-between overflow-hidden group ${
        onClick ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-inset' : ''
      } ${className}`}
    >
      {/* Corner Technical Tick Marks (+) */}
      {showTicks && (
        <>
          <span className="pointer-events-none absolute top-1.5 left-2 font-mono text-[9px] text-zinc-600 group-hover:text-[#8B5CF6]/80 transition-colors select-none z-20">
            +
          </span>
          <span className="pointer-events-none absolute top-1.5 right-2 font-mono text-[9px] text-zinc-600 group-hover:text-[#8B5CF6]/80 transition-colors select-none z-20">
            +
          </span>
          <span className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-[9px] text-zinc-600 group-hover:text-[#8B5CF6]/80 transition-colors select-none z-20">
            +
          </span>
          <span className="pointer-events-none absolute bottom-1.5 right-2 font-mono text-[9px] text-zinc-600 group-hover:text-[#8B5CF6]/80 transition-colors select-none z-20">
            +
          </span>
        </>
      )}

      {/* Top Hairline Active Reflection Accent */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] group-hover:via-[#8B5CF6]/40 to-transparent transition-all z-20" />

      {/* Cursor Radial Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-200 z-10"
        style={{
          opacity,
          background: `radial-gradient(350px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 h-full flex flex-col justify-between space-y-4">
        {children}
      </div>
    </div>
  );
};
