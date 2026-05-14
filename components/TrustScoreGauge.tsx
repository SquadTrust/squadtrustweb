'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TrustScoreGaugeProps {
  score: number; // 0-1000
}

export function TrustScoreGauge({ score }: TrustScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score from 0 to target score on mount
  useEffect(() => {
    const duration = 1500; // 1.5s
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedScore(Math.floor(score * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  // Determine color based on score
  let color = '#EF4444'; // Red
  if (animatedScore >= 400 && animatedScore < 700) {
    color = '#E8A317'; // Yellow/Gold
  } else if (animatedScore >= 700) {
    color = '#10B981'; // Green
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Use a semicircle + a bit more, say 270 degrees total
  const offset = circumference - (animatedScore / 1000) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center justify-center relative w-48 h-48">
      <svg className="w-full h-full transform -rotate-[135deg]" viewBox="0 0 140 140">
        {/* Background track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="transparent"
          stroke="#E5E7EB"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />
        
        {/* Progress track */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <span className="text-3xl font-bold" style={{ color }}>{animatedScore}</span>
        <span className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-medium">Trust Score</span>
      </div>
    </div>
  );
}
