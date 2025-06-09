'use client';

import { useState, useEffect, useRef } from 'react';

interface CounterAnimationProps {
  end: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export function CounterAnimation({ 
  end, 
  duration = 2000, 
  className = "text-3xl font-bold text-gray-100",
  prefix = "",
  suffix = "",
  delay = 0
}: CounterAnimationProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Reset counter when end value changes
    countRef.current = 0;
    setCount(0);
    
    // Skip animation for zero values
    if (end === 0) {
      setCount(0);
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Enhanced easing: combine easeOutExpo with a slight bounce at the end
      let easedProgress;
      if (progress < 0.9) {
        // Use easeOutExpo for most of the animation
        easedProgress = 1 - Math.pow(2, -10 * progress);
      } else {
        // Add a small bounce at the end (subtle spring effect)
        const t = (progress - 0.9) / 0.1;
        easedProgress = 0.95 + Math.sin((t * Math.PI) / 2) * 0.05;
      }
      
      const nextCount = Math.floor(easedProgress * end);
      
      if (nextCount !== countRef.current) {
        countRef.current = nextCount;
        setCount(nextCount);
      }
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at the target number
        setCount(end);
      }
    };
    
    if (delay > 0) {
      timeoutId = setTimeout(() => {
        startTimeRef.current = null;
        frameRef.current = requestAnimationFrame(animate);
      }, delay);
    } else {
      startTimeRef.current = null;
      frameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration, delay]);
  
  return (
    <div className="relative">
      <span className={`${className} inline-block transition-all`}>
        {prefix}{count.toLocaleString()}{suffix}
      </span>
    </div>
  );
}
