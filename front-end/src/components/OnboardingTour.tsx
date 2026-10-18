import React, { useEffect, useState, useCallback } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  ShieldCheck,
  Activity,
  Workflow
} from 'lucide-react';
import { TabType } from '../services/storage';

export interface TourStep {
  targetSelector?: string;
  tab?: TabType;
  stepCode: string;
  title: string;
  subtitle: string;
  description: string;
  actionHint: string;
  badge: string;
  accentColor: string;
  icon: React.ElementType;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="header-telemetry"]',
    stepCode: '01/05',
    title: 'DUAL-VM PROTOCOL TELEMETRY',
    subtitle: 'WASM & EVM REAL-TIME PARITY',
    description:
      'DotNexus operates on Portaldot V3.0 dual-engine infrastructure. This status rail displays live block numbers, finalized blocks, and the real-time block delta between Substrate WASM (:9944) and Frontier EVM (:8545).',
    actionHint: 'Maintains zero desync tolerance (&le; 2 blocks).',
    badge: 'PARITY BUS',
    accentColor: '#8B5CF6',
    icon: Activity
  },
  {
    targetSelector: '[data-tour="sidebar-navigation"]',
    stepCode: '02/05',
    title: 'OPERATIONAL COMMAND MODULES',
    subtitle: '5 SPECIALIZED CONTROL PLANES',
    description:
      'Navigate seamlessly across 5 core stations: Dual-Engine telemetry, Equivocation Guard (Dead Man\'s Switch), NPoS Validator Yield, P2P RPC Shield, and the Visual DAG Automation Canvas.',
    actionHint: 'Select any module to focus on its real-time subsystem.',
    badge: 'DISPATCHER',
    accentColor: '#38BDF8',
    icon: Layers
  },
  {
    targetSelector: '[data-tour="dual-engine-view"]',
    tab: 'dual-vm',
    stepCode: '03/05',
    title: 'DUAL-STREAM PIPELINE & HEURISTICS',
    subtitle: 'BABE SLOT TICKER & CAUSAL LAG INDEX',
    description:
      'Inspect synchronized block authoring (Alice authority), 6.0s BABE slot cycle, and the 3-vector Causal Lag Index (CLI) that isolates Frontier mapping sync delays vs EVM gas congestion.',
    actionHint: 'Use the 3 sub-tabs to switch between Stream, Diagnostics, and Tools.',
    badge: 'PIPELINE',
    accentColor: '#E6007A',
    icon: Sparkles
  },
  {
    tab: 'slashing',
    stepCode: '04/05',
    title: 'ANTI-EQUIVOCATION & DEAD MAN\'S SWITCH',
    subtitle: 'STRICT ATOMIC LEASE MUTEX',
    description:
      'Protects your validator from catastrophic 100% token slashing. If the primary node stalls or misses heartbeats for > 10.0s, the atomic mutex locks and isolates the keystore before failover.',
    actionHint: 'Eliminates double-signing risks on the network.',
    badge: 'SLASH ZERO',
    accentColor: '#10B981',
    icon: ShieldCheck
  },
  {
    tab: 'canvas',
    stepCode: '05/05',
    title: 'AUTONOMOUS RUNBOOK CANVAS',
    subtitle: 'VISUAL DAG SECURITY ORCHESTRATION',
    description:
      'Compose automated node recovery recipes by connecting Triggers, Filters, and Remediation Actions. Deploy reactive playbooks to auto-rotate session keys or shed malicious RPC loads.',
    actionHint: 'Click Quick Templates to test pre-built security automations.',
    badge: 'WORKFLOW DAG',
    accentColor: '#F59E0B',
    icon: Workflow
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabType) => void;
  currentTab: TabType;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Keyboard navigation: Escape to skip, Right/Enter to next, Left to prev
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          handleNext();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          handlePrev();
        }
      }
    },
    [isOpen, currentStepIndex, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const step = TOUR_STEPS[currentStepIndex];

  // If the step prescribes a tab switch, switch smoothly
  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = TOUR_STEPS[nextIdx];
      if (nextStep.tab) {
        onNavigateTab(nextStep.tab);
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = TOUR_STEPS[prevIdx];
      if (prevStep.tab) {
        onNavigateTab(prevStep.tab);
      }
    }
  };

  if (!isOpen) return null;

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      {/* Outer Click to Dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Cyber Defense Briefing Card */}
      <div className="relative w-full max-w-xl bg-[#0E091B] border border-[#3E2568] shadow-[0_0_50px_rgba(139,92,246,0.25)] font-mono z-10 overflow-hidden">
        {/* Top Header Rail */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#261B42] bg-[#140D26]">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#8B5CF6] animate-spin" style={{ animationDuration: '10s' }} />
            <span className="text-xs font-bold text-white tracking-widest uppercase">
              MISSION BRIEFING // DOTNEXUS V3.0
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 bg-[#080512] px-2 py-0.5 border border-[#261B42]">
              {step.stepCode}
            </span>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white hover:bg-[#261B42] transition-colors cursor-pointer"
              title="Skip Tour [Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 border flex items-center justify-center shrink-0"
              style={{
                borderColor: `${step.accentColor}60`,
                backgroundColor: `${step.accentColor}15`
              }}
            >
              <Icon className="w-5 h-5" style={{ color: step.accentColor }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold px-1.5 py-0.2 border tracking-wider uppercase"
                  style={{
                    color: step.accentColor,
                    borderColor: `${step.accentColor}50`,
                    backgroundColor: `${step.accentColor}10`
                  }}
                >
                  {step.badge}
                </span>
                <span className="text-[11px] text-zinc-400 tracking-wider">
                  {step.subtitle}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide mt-0.5">
                {step.title}
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-[#080512] p-3.5 border border-[#201538]">
            {step.description}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-[#C084FC] bg-[#160D2D]/60 px-3 py-2 border border-[#2B1B47]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#10B981]" />
            <span>{step.actionHint}</span>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-[#201538] bg-[#0A0614]">
          {/* Step Indicators Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  const target = TOUR_STEPS[idx];
                  if (target.tab) onNavigateTab(target.tab);
                }}
                className={`w-2 h-2 transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-[#8B5CF6]'
                    : 'bg-zinc-700 hover:bg-zinc-500'
                }`}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Skip Tour
            </button>

            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#180E30] hover:bg-[#261B42] border border-[#3E2568] text-zinc-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] cursor-pointer"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Start Operating' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
