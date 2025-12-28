"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { vibrateLight, vibrateSelection } from "@/lib/mobile/haptics";

interface Card {
  id: string;
  title: string;
  description: string;
  settlementLabel?: string;
  when?: string;
  href: string;
  isDemo?: boolean;
}

interface SwipeableCardsProps {
  cards: Card[];
  title: string;
  viewAllHref: string;
  isLoading?: boolean;
}

export default function SwipeableCards({ cards, title, viewAllHref, isLoading = false }: SwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Swipe threshold
    const threshold = 50;
    
    if (translateX > threshold && currentIndex > 0) {
      // Swipe right - previous card
      setCurrentIndex(currentIndex - 1);
      vibrateSelection();
    } else if (translateX < -threshold && currentIndex < cards.length - 1) {
      // Swipe left - next card
      setCurrentIndex(currentIndex + 1);
      vibrateSelection();
    }
    
    setTranslateX(0);
  };

  const handleMouseStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  };

  const handleMouseEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const threshold = 50;
    
    if (translateX > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      vibrateSelection();
    } else if (translateX < -threshold && currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      vibrateSelection();
    }
    
    setTranslateX(0);
  };

  // Auto-advance cards every 5 seconds (only if not dragging)
  useEffect(() => {
    if (isDragging || cards.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isDragging, cards.length]);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <Link href={viewAllHref} className="text-blue-600 hover:text-blue-800 text-sm">
          Виж всички →
        </Link>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="bg-gray-200 h-4 w-3/4 mb-2 rounded"></div>
              <div className="bg-gray-200 h-3 w-full mb-1 rounded"></div>
              <div className="bg-gray-200 h-3 w-2/3 rounded"></div>
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Няма данни за показване</p>
        </div>
      ) : (
        <>
          {/* Desktop - Grid layout */}
          <div className="hidden md:grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium mb-2 line-clamp-2">{card.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {card.description}
                </p>
                <div className="text-xs text-gray-500">
                  {card.when && `📅 ${card.when}`}
                  {card.settlementLabel && `📍 ${card.settlementLabel}`}
                  {card.isDemo && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">ДЕМО</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile - Swipeable cards */}
          <div className="md:hidden">
            <div 
              ref={containerRef}
              className="relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseStart}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseEnd}
              onMouseLeave={handleMouseEnd}
            >
              <div 
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(calc(-${currentIndex * 100}% + ${translateX}px))`,
                }}
              >
                {cards.map((card) => (
                  <div key={card.id} className="w-full flex-shrink-0 px-2">
                    <Link
                      href={card.href}
                      className="block border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      onClick={(e) => {
                        // Prevent navigation if dragging
                        if (Math.abs(translateX) > 10) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <h3 className="font-medium mb-2 line-clamp-2">{card.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                        {card.description}
                      </p>
                      <div className="text-xs text-gray-500 flex items-center flex-wrap gap-2">
                        {card.when && (
                          <span className="flex items-center">
                            📅 {card.when}
                          </span>
                        )}
                        {card.settlementLabel && (
                          <span className="flex items-center">
                            📍 {card.settlementLabel}
                          </span>
                        )}
                        {card.isDemo && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">ДЕМО</span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots indicator */}
            {cards.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {cards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      vibrateLight();
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    aria-label={`Покажи карта ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Swipe hint */}
            {cards.length > 1 && currentIndex === 0 && (
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">← Плъзни за повече →</p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
