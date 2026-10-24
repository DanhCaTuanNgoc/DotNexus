import React from 'react';

export type CrosshairPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface CornerCrosshairProps {
  position?: CrosshairPosition;
  className?: string;
  size?: number; // default 9px
  color?: string; // default text-zinc-500
}

const positionClasses: Record<CrosshairPosition, string> = {
  'top-left': '-top-[5px] -left-[5px]',
  'top-right': '-top-[5px] -right-[5px]',
  'bottom-left': '-bottom-[5px] -left-[5px]',
  'bottom-right': '-bottom-[5px] -right-[5px]',
};

/**
 * Technical Corner Crosshair primitive.
 * Renders a crisp 9x9px (+) engineering corner anchor at grid rail intersections.
 */
export const CornerCrosshair: React.FC<CornerCrosshairProps> = ({
  position = 'top-left',
  className = '',
  size = 9,
  color = 'text-zinc-500',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 9 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none absolute z-20 ${positionClasses[position]} ${color} ${className}`}
      aria-hidden="true"
    >
      <line x1="4.5" y1="0" x2="4.5" y2="9" stroke="currentColor" strokeWidth="1" />
      <line x1="0" y1="4.5" x2="9" y2="4.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
};

interface IntersectionCrosshairsProps {
  top?: boolean;
  bottom?: boolean;
  color?: string;
  className?: string;
}

/**
 * Helper to mount crosshairs at all 4 intersection points
 * where vertical container rails meet full-bleed horizontal dividers.
 */
export const IntersectionCrosshairs: React.FC<IntersectionCrosshairsProps> = ({
  top = true,
  bottom = true,
  color = 'text-zinc-500',
  className = '',
}) => {
  return (
    <>
      {top && (
        <>
          <CornerCrosshair position="top-left" color={color} className={className} />
          <CornerCrosshair position="top-right" color={color} className={className} />
        </>
      )}
      {bottom && (
        <>
          <CornerCrosshair position="bottom-left" color={color} className={className} />
          <CornerCrosshair position="bottom-right" color={color} className={className} />
        </>
      )}
    </>
  );
};
