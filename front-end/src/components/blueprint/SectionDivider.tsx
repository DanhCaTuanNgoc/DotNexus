import React from 'react';
import { IntersectionCrosshairs } from './CornerCrosshair';

export type SectionDividerVariant = 'hatched' | 'dots' | 'glow';

interface SectionDividerProps {
  variant?: SectionDividerVariant;
  height?: string; // e.g. 'h-12', 'h-14', 'h-16'
  label?: string; // Optional technical badge in the center
  sublabel?: string;
  className?: string;
  showCrosshairs?: boolean;
  crosshairColor?: string;
  glowColor?: string; // default violet/indigo beam
}

/**
 * Technical Spacer Strip (Section Separator) Component.
 * Bounded by continuous vertical rails (max-w-7xl mx-auto border-x border-white/[0.08])
 * and anchored with intersection corner crosshairs.
 */
export const SectionDivider: React.FC<SectionDividerProps> = ({
  variant = 'hatched',
  height = 'h-14',
  label,
  sublabel,
  className = '',
  showCrosshairs = true,
  crosshairColor = 'text-zinc-500',
  glowColor = 'via-[#8B5CF6]/50',
}) => {
  return (
    <div className={`w-full border-b border-white/[0.08] bg-[#06040A] relative overflow-hidden select-none ${className}`}>
      {/* Central Rail Container */}
      <div className={`max-w-7xl mx-auto border-x border-white/[0.08] relative ${height} flex items-center justify-center`}>
        {/* Intersection Crosshairs on horizontal/vertical boundary */}
        {showCrosshairs && <IntersectionCrosshairs color={crosshairColor} />}

        {/* Variant 1: Hatched (45-degree diagonal repeating gradient) */}
        {variant === 'hatched' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.03) 0px,
                rgba(255, 255, 255, 0.03) 1px,
                transparent 1px,
                transparent 10px
              )`,
            }}
          />
        )}

        {/* Variant 2: Dots (Subtle radial-gradient dot matrix spaced 12px) */}
        {variant === 'dots' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
              backgroundSize: '12px 12px',
            }}
          />
        )}

        {/* Variant 3: Glow (Centered horizontal 1px gradient beam) */}
        {variant === 'glow' && (
          <>
            {/* Top gradient glow beam */}
            <div
              className={`absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent ${glowColor} to-transparent pointer-events-none z-10`}
            />
            {/* Subtle soft ambient glow wash in the spacer */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none" />
          </>
        )}

        {/* Optional Technical Center Badge */}
        {label && (
          <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-none border border-white/[0.08] bg-[#0B0813]/90 text-[10px] font-mono tracking-widest text-zinc-400 uppercase shadow-inner">
            <span className="text-[#8B5CF6] font-bold">//</span>
            <span className="text-zinc-200 font-semibold">{label}</span>
            {sublabel && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">{sublabel}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
