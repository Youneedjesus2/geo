import React, { useEffect, useState } from 'react';
import { getScoreCategory } from '@/types/audit';

interface ScoreGaugeProps {
  score: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const category = getScoreCategory(score);

  // Simplified SVG calculations for perfect centering
  // Viewbox 0 0 100 100 center is 50,50
  const radius = 40;
  const stroke = 6;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const stepTime = Math.abs(Math.floor(duration / score));
    
    if (score === 0) {
        setDisplayScore(0);
        return;
    }

    const timer = setInterval(() => {
      start += 1;
      setDisplayScore(start);
      if (start >= score) clearInterval(timer);
    }, Math.max(stepTime, 10));

    return () => clearInterval(timer);
  }, [score]);

  // Determine color hex based on updated dark theme palette
  const getColor = (s: number) => {
    if (s >= 90) return '#34d399'; // emerald-400
    if (s >= 70) return '#facc15'; // yellow-400
    if (s >= 50) return '#fb923c'; // orange-400
    return '#f87171'; // rose-400
  };

  const strokeColor = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full">
      <div className="relative w-48 h-48">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90"
        >
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#27272a" // surfaceHighlight/zinc-800
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        
        {/* Strictly centered text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-5xl font-mono font-bold tracking-tighter ${category.color}`}>
            {displayScore}
          </span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mt-2">
            Score
          </span>
        </div>
      </div>
      
      <div className={`mt-4 font-medium text-xl tracking-tight ${category.color}`}>
        {category.label}
      </div>
    </div>
  );
};
