"use client";
import { useState, useRef, useEffect } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [mounted, setMounted] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const maxPullDistance = 80;
  const triggerDistance = 60;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!mounted) return;
    // Only trigger if at top of page
    if (typeof window !== 'undefined' && window.scrollY > 0) return;
    
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!mounted || !isPulling || (typeof window !== 'undefined' && window.scrollY > 0)) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    // Apply resistance - slower pulling as distance increases
    const resistance = Math.min(distance * 0.5, maxPullDistance);
    setPullDistance(resistance);
    
    // Prevent default scroll behavior when pulling
    if (distance > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!mounted || !isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= triggerDistance) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  };

  // Reset states when scrolling
  useEffect(() => {
    if (!mounted) return;
    
    const handleScroll = () => {
      if (typeof window !== 'undefined' && window.scrollY > 0) {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  const getRefreshIcon = () => {
    if (isRefreshing) return "🔄";
    if (pullDistance >= triggerDistance) return "↓";
    return "⬇️";
  };

  const getRefreshText = () => {
    if (isRefreshing) return "Обновява...";
    if (pullDistance >= triggerDistance) return "Пусни за обновяване";
    return "Дръпни за обновяване";
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ${
          pullDistance > 0 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 40)}px)`,
          height: '40px'
        }}
      >
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
          <span 
            className={`text-lg transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            {getRefreshIcon()}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {getRefreshText()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  );
}
