import React, { Suspense, useState, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { Loader2 } from 'lucide-react';

interface SplineSceneProps {
  sceneUrl?: string;
  onSplineLoaded?: (splineApp: any) => void;
}

export const SplineScene: React.FC<SplineSceneProps> = ({
  sceneUrl = "https://prod.spline.design/uQMYP7ZQJi659Wch/scene.splinecode",
  onSplineLoaded
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const splineAppRef = useRef<any>(null);

  const handleLoad = (splineApp: any) => {
    splineAppRef.current = splineApp;
    setIsLoaded(true);
    if (onSplineLoaded) {
      onSplineLoaded(splineApp);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-auto">
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0813]/80 backdrop-blur-md z-10 transition-opacity">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin mb-3" />
          <div className="text-xs font-mono text-[#C084FC] tracking-wider uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            Initializing DotNexus Interactive 3D Canvas...
          </div>
        </div>
      )}

      {/* Spline Canvas with Brand-tuned Lighting Tint */}
      <Suspense fallback={null}>
        <div 
          className={`w-full h-full transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            // Brand lighting integration: subtle violet tone mapping
            filter: 'contrast(1.08) brightness(1.02)'
          }}
        >
          <Spline
            scene={sceneUrl}
            onLoad={handleLoad}
            className="w-full h-full"
          />
        </div>
      </Suspense>

      {/* Subtle Vignette & Cybernetic Scanline Overlays to bind 3D scene to dark obsidian canvas */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0B0813] via-transparent to-[#0B0813]/40 z-10" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0B0813]/60 via-transparent to-[#0B0813]/60 z-10" />
    </div>
  );
};
