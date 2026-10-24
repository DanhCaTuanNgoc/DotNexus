import React from 'react';
import { CornerCrosshair } from './CornerCrosshair';

interface BlueprintSectionProps {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
  showCrosshairs?: boolean;
  crosshairColor?: string;
  borderBottom?: boolean;
  borderTop?: boolean;
  background?: string;
}

/**
 * BlueprintSection Primitive.
 * Structural landing page section framed with full-bleed horizontal dividers (100vw)
 * and locked central vertical rails (max-w-7xl mx-auto border-x border-white/[0.08]).
 * Automatically mounts crisp 9x9px (+) corner crosshairs at structural rail junctions.
 */
export const BlueprintSection: React.FC<BlueprintSectionProps> = ({
  id,
  className = '',
  containerClassName = '',
  children,
  showCrosshairs = true,
  crosshairColor = 'text-zinc-500',
  borderBottom = true,
  borderTop = false,
  background = 'bg-[#06040A]',
}) => {
  return (
    <section
      id={id}
      className={`w-full relative ${background} ${borderTop ? 'border-t border-white/[0.08]' : ''} ${
        borderBottom ? 'border-b border-white/[0.08]' : ''
      } ${className}`}
    >
      {/* Central Locked Rail Container */}
      <div className={`max-w-7xl mx-auto border-x border-white/[0.08] relative ${containerClassName}`}>
        {/* Intersection Corner Crosshairs */}
        {showCrosshairs && (
          <>
            {borderTop && (
              <>
                <CornerCrosshair position="top-left" color={crosshairColor} />
                <CornerCrosshair position="top-right" color={crosshairColor} />
              </>
            )}
            {borderBottom && (
              <>
                <CornerCrosshair position="bottom-left" color={crosshairColor} />
                <CornerCrosshair position="bottom-right" color={crosshairColor} />
              </>
            )}
          </>
        )}

        {children}
      </div>
    </section>
  );
};
