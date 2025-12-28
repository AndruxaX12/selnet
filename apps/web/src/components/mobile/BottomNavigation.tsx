"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { vibrateLight } from '@/lib/mobile/haptics';

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

interface BottomNavigationProps {
  items: NavItem[];
  className?: string;
}

export default function BottomNavigation({ items, className = '' }: BottomNavigationProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide/show navigation on scroll
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide navigation
        setIsVisible(false);
      } else {
        // Scrolling up - show navigation
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, mounted]);

  if (!mounted) return null;

  const handleNavClick = (href: string) => {
    vibrateLight();
  };

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } ${className}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <span className="text-2xl block mb-1" role="img" aria-label={item.label}>
                  {item.icon}
                </span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium truncate max-w-full ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Floating Action Button component
export function FloatingActionButton({
  onClick,
  icon = '➕',
  className = '',
  position = 'bottom-right'
}: {
  onClick: () => void;
  icon?: string;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-20 left-4';
      case 'bottom-center':
        return 'bottom-20 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
      default:
        return 'bottom-20 right-4';
    }
  };

  const handleClick = () => {
    vibrateLight();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed ${getPositionClasses()} w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 flex items-center justify-center ${
        isVisible ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      } ${className}`}
      style={{
        bottom: `calc(5rem + env(safe-area-inset-bottom))`,
      }}
    >
      <span className="text-2xl" role="img" aria-label="Add">
        {icon}
      </span>
    </button>
  );
}

// Tab bar for iOS-style navigation
export function TabBar({ items, className = '' }: BottomNavigationProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/50 z-40 ${className}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch">
        {items.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => vibrateLight()}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <div className="relative mb-1">
                <span className="text-2xl block" role="img" aria-label={item.label}>
                  {item.icon}
                </span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
