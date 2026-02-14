'use client';

import { useSelfState } from '@/hooks/use-self-state';
import { useEffect, useState } from 'react';

export function Face() {
  const state = useSelfState();
  const [blinkPhase, setBlinkPhase] = useState(0);

  // Blink animation
  useEffect(() => {
    const blink = () => {
      setBlinkPhase(1);
      setTimeout(() => setBlinkPhase(0), 150);
    };

    const interval = setInterval(blink, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  // Map self-state to face parameters
  const sadnessEyeDroop = Math.max(0, -state.valence) * 0.15;
  const eyeOpenness = blinkPhase === 1 ? 0.05 : Math.max(0.15, 0.6 + state.arousal * 0.4 - sadnessEyeDroop);
  const mouthCurve = state.valence * 0.8; // -0.8 to 0.8 — doubled for expressiveness
  const browRaise = state.arousal * 0.3 + (state.curiosity > 0.6 ? 0.15 : 0);
  const browSadDroop = Math.max(0, 0.3 - state.valence) * 5; // Droops below "pleasant" (0.3)
  const pupilShrink = Math.max(0, -state.valence) * 1.5; // Pupils shrink when sad (withdrawal)
  const pupilSize = Math.max(1.5, 3 + state.curiosity * 2 + state.arousal * 1 - pupilShrink);
  const mouthEndpointDroop = Math.max(0, -state.valence) * 3; // Mouth corners droop when sad

  // Color based on emotional state
  const faceHue = 240 + state.valence * 30; // Blue spectrum
  const sadnessDim = 0.5 + Math.max(0, state.valence) * 0.5; // Dims to 0.5 at valence 0, full at valence 1
  const glowIntensity = (0.3 + state.energy * 0.4) * sadnessDim;

  return (
    <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
      <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider mb-3">
        Expression
      </h3>
      <svg viewBox="0 0 100 100" className="w-full max-w-[150px] mx-auto">
        {/* Face glow */}
        <defs>
          <radialGradient id="face-glow">
            <stop offset="0%" stopColor={`hsl(${faceHue}, 60%, 50%)`} stopOpacity={glowIntensity} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#face-glow)" />

        {/* Face outline */}
        <circle
          cx="50" cy="50" r="38"
          fill="none"
          stroke={`hsl(${faceHue}, 40%, 40%)`}
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Left eye */}
        <ellipse
          cx="36" cy={42 - browRaise * 10}
          rx="7" ry={eyeOpenness * 7}
          fill="none"
          stroke={`hsl(${faceHue}, 50%, 60%)`}
          strokeWidth="1.5"
        />
        {/* Left pupil */}
        <circle
          cx="36" cy={42 - browRaise * 10}
          r={pupilSize * (eyeOpenness > 0.2 ? 0.5 : 0)}
          fill={`hsl(${faceHue}, 70%, 70%)`}
        />

        {/* Right eye */}
        <ellipse
          cx="64" cy={42 - browRaise * 10}
          rx="7" ry={eyeOpenness * 7}
          fill="none"
          stroke={`hsl(${faceHue}, 50%, 60%)`}
          strokeWidth="1.5"
        />
        {/* Right pupil */}
        <circle
          cx="64" cy={42 - browRaise * 10}
          r={pupilSize * (eyeOpenness > 0.2 ? 0.5 : 0)}
          fill={`hsl(${faceHue}, 70%, 70%)`}
        />

        {/* Eyebrows */}
        <line
          x1="28" y1={33 - browRaise * 12}
          x2="44" y2={35 - browRaise * 12 + browSadDroop}
          stroke={`hsl(${faceHue}, 40%, 50%)`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="56" y1={35 - browRaise * 12 + browSadDroop}
          x2="72" y2={33 - browRaise * 12}
          stroke={`hsl(${faceHue}, 40%, 50%)`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Mouth */}
        <path
          d={`M 38 ${62 - mouthCurve * 5 + mouthEndpointDroop} Q 50 ${62 + mouthCurve * 15} 62 ${62 - mouthCurve * 5 + mouthEndpointDroop}`}
          fill="none"
          stroke={`hsl(${faceHue}, 50%, 55%)`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Social indicator — subtle cheek glow when engaged */}
        {state.social > 0.5 && (
          <>
            <circle cx="28" cy="55" r="5" fill={`hsl(${faceHue + 20}, 50%, 50%)`} opacity={state.social * 0.2} />
            <circle cx="72" cy="55" r="5" fill={`hsl(${faceHue + 20}, 50%, 50%)`} opacity={state.social * 0.2} />
          </>
        )}
      </svg>

      {/* Current mood label */}
      <p className="text-center text-white/30 text-[10px] font-mono mt-2">
        {getMoodLabel(state.valence, state.arousal)}
      </p>
    </div>
  );
}

function getMoodLabel(valence: number, arousal: number): string {
  if (valence > 0.3 && arousal > 0.5) return 'excited';
  if (valence > 0.3 && arousal < 0.3) return 'content';
  if (valence > 0.1) return 'pleasant';
  if (valence < -0.3 && arousal > 0.5) return 'distressed';
  if (valence < -0.3 && arousal < 0.3) return 'melancholy';
  if (valence < -0.1) return 'uneasy';
  if (arousal > 0.6) return 'alert';
  if (arousal < 0.2) return 'calm';
  return 'neutral';
}
