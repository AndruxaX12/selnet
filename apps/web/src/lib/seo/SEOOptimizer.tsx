"use client";
import Head from 'next/head';
import { usePathname } from 'next/navigation';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  alternateLocales?: string[];
}

export default function SEOOptimizer({
  title = 'СелНет - Гражданска платформа за сигнали и събития',
  description = 'Гражданска платформа за подаване на сигнали, организиране на събития и подобряване на живота в населените места в България.',
  keywords = ['селнет', 'сигнали', 'събития', 'гражданска платформа', 'българия', 'община', 'село', 'град'],
  image = '/og-image.jpg',
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = [],
  locale = 'bg_BG',
  alternateLocales = ['en_US']
}: SEOProps) {
  const pathname = usePathname();
  const currentUrl = url || `https://selnet.bg${pathname}`;
  const fullTitle = title.includes('СелНет') ? title : `${title} | СелНет`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author || 'СелНет Екип'} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Bulgarian" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="СелНет" />
      <meta property="og:locale" content={locale} />
      {alternateLocales.map(altLocale => (
        <meta key={altLocale} property="og:locale:alternate" content={altLocale} />
      ))}
      
      {/* Article specific */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@selnet_bg" />
      <meta name="twitter:creator" content="@selnet_bg" />
      
      {/* Additional SEO */}
      <meta name="theme-color" content="#111111" />
      <meta name="msapplication-TileColor" content="#111111" />
      <meta name="application-name" content="СелНет" />
      <meta name="apple-mobile-web-app-title" content="СелНет" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "СелНет",
            "description": description,
            "url": currentUrl,
            "applicationCategory": "GovernmentApplication",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "BGN"
            },
            "author": {
              "@type": "Organization",
              "name": "СелНет Екип"
            },
            "inLanguage": "bg",
            "isAccessibleForFree": true,
            "browserRequirements": "Requires JavaScript. Requires HTML5.",
            "softwareVersion": "2.0.0",
            "datePublished": "2025-01-01",
            "dateModified": new Date().toISOString().split('T')[0]
          })
        }}
      />
    </Head>
  );
}

// Accessibility utilities
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Прескочи към основното съдържание
      </a>
      
      {/* Accessibility announcements */}
      <div
        id="accessibility-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {children}
    </div>
  );
}

// Announce changes to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcer = document.getElementById('accessibility-announcements');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
}

// Focus management
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }
    
    if (e.key === 'Escape') {
      element.dispatchEvent(new CustomEvent('escape'));
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  firstFocusable?.focus();
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Color contrast checker
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
} {
  const getLuminance = (color: string): number => {
    // Simple luminance calculation (simplified)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  let level: 'AA' | 'AAA' | 'fail' = 'fail';
  if (ratio >= 7) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  
  return { ratio, level };
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  items: HTMLElement[],
  orientation: 'horizontal' | 'vertical' = 'vertical'
) {
  const handleKeyDown = (e: KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          nextIndex = (currentIndex + 1) % items.length;
          e.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          e.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          nextIndex = (currentIndex + 1) % items.length;
          e.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          e.preventDefault();
        }
        break;
      case 'Home':
        nextIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        nextIndex = items.length - 1;
        e.preventDefault();
        break;
    }
    
    if (nextIndex !== currentIndex) {
      items[nextIndex]?.focus();
    }
  };
  
  return handleKeyDown;
}

// ARIA live region manager
class LiveRegionManager {
  private regions: Map<string, HTMLElement> = new Map();
  
  createRegion(id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
    if (this.regions.has(id)) {
      return this.regions.get(id)!;
    }
    
    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    
    this.regions.set(id, region);
    return region;
  }
  
  announce(id: string, message: string, priority: 'polite' | 'assertive' = 'polite') {
    let region = this.regions.get(id);
    if (!region) {
      region = this.createRegion(id, priority);
    }
    
    region.setAttribute('aria-live', priority);
    region.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      region!.textContent = '';
    }, 1000);
  }
  
  cleanup() {
    this.regions.forEach(region => {
      region.remove();
    });
    this.regions.clear();
  }
}

export const liveRegionManager = new LiveRegionManager();
