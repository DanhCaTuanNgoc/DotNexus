import React, { Suspense, useState, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { ArrowRight, Loader2, Zap, Server, ChevronRight } from 'lucide-react';

interface SplineLandingPageProps {
  onLaunchApp: () => void;
}

export const SplineLandingPage: React.FC<SplineLandingPageProps> = ({ onLaunchApp }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const splineRef = useRef<any>(null);

  const handleSplineLoad = (splineApp: any) => {
    splineRef.current = splineApp;
    setIsLoaded(true);
    console.log("Spline 100% Native UI Loaded successfully:", splineApp);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Loading Screen while Spline 3D Scene downloads */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50 transition-opacity duration-500">
          <div className="relative mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] animate-pulse">
              <Zap className="w-6 h-6 fill-[#8B5CF6]" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-mono text-zinc-300">
            <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />
            <span>Nạp Không Gian 3D Spline...</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 mt-2">
            Portaldot Network V3.0 • DotNexus Experience
          </span>
        </div>
      )}

      {/* 100% Native Spline 3D Scene Container (Takes full viewport with full pointer interactivity) */}
      <div className="w-full h-full relative z-0">
        <Suspense fallback={null}>
          <Spline
            scene="https://prod.spline.design/uQMYP7ZQJi659Wch/scene.splinecode"
            onLoad={handleSplineLoad}
            className="w-full h-full"
          />
        </Suspense>
      </div>

      {/* Sleek Floating Gateway HUD Bar: Seamless portal to DotNexus Control Center */}
      <div className="absolute bottom-6 left-6 right-6 z-40 flex items-center justify-between pointer-events-none">
        {/* Left Telemetry Pill */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl border border-[#2D1F52]/80 bg-[#0B0813]/85 backdrop-blur-md shadow-2xl font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
            <span className="text-white font-bold tracking-wide">PORTALDOT V3.0</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400">
            <span>SS58: 42</span>
            <span>•</span>
            <span>WASM :9944</span>
            <span>•</span>
            <span>EVM :8545</span>
          </div>
        </div>

        {/* Right CTA Button to Control Center Console */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={onLaunchApp}
            className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-mono text-xs font-bold transition-all shadow-2xl shadow-[#8B5CF6]/40 hover:scale-105 cursor-pointer border border-[#C084FC]/30"
          >
            <Server className="w-4 h-4 text-white" />
            <span>Vào Control Center</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
