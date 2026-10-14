import React, { Suspense, useState } from 'react';
import Spline from '@splinetool/react-spline';
import { Loader2 } from 'lucide-react';

interface SplineSceneProps {
  sceneUrl?: string;
}

export const SplineScene: React.FC<SplineSceneProps> = ({
  sceneUrl = "https://prod.spline.design/uQMYP7ZQJi659Wch/scene.splinecode"
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-auto">
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0813]/60 backdrop-blur-sm z-10 transition-opacity">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin mb-3" />
          <span className="text-xs font-mono text-[#C084FC] tracking-wider uppercase">
            Loading Spline 3D Interactive Scene...
          </span>
        </div>
      )}

      {/* Spline Canvas */}
      <Suspense fallback={null}>
        <div className={`w-full h-full transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <Spline
            scene={sceneUrl}
            onLoad={() => setIsLoaded(true)}
            className="w-full h-full"
          />
        </div>
      </Suspense>
    </div>
  );
};
