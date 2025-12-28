"use client";

// Haptic feedback types
export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification';

interface HapticFeedbackOptions {
  type: HapticType;
  duration?: number;
  intensity?: number;
}

class HapticManager {
  private isSupported = false;
  private vibrationAPI: any = null;

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    if (typeof window === 'undefined') return;

    // Check for Vibration API
    this.vibrationAPI = navigator.vibrate || (navigator as any).webkitVibrate || (navigator as any).mozVibrate;
    
    // Check for iOS Haptic Feedback (iOS 10+)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const hasHapticFeedback = 'ontouchstart' in window && isIOS;
    
    // Check for Android vibration
    const isAndroid = /Android/.test(navigator.userAgent);
    const hasVibration = !!this.vibrationAPI;

    this.isSupported = hasHapticFeedback || hasVibration;
    
    console.log('Haptic feedback support:', {
      isSupported: this.isSupported,
      isIOS,
      isAndroid,
      hasVibration
    });
  }

  // Main haptic feedback method
  public feedback(type: HapticType = 'light'): void {
    if (!this.isSupported) return;

    try {
      // Try iOS Haptic Feedback first
      if (this.tryIOSHaptic(type)) return;
      
      // Fallback to Vibration API
      this.tryVibration(type);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  private tryIOSHaptic(type: HapticType): boolean {
    // iOS Haptic Feedback (requires user gesture)
    if (typeof (window as any).DeviceMotionEvent !== 'undefined') {
      try {
        // Create audio context for iOS haptic simulation
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configure based on haptic type
        const config = this.getHapticConfig(type);
        oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(config.volume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + config.duration);
        
        return true;
      } catch (error) {
        console.warn('iOS haptic simulation failed:', error);
      }
    }
    
    return false;
  }

  private tryVibration(type: HapticType): void {
    if (!this.vibrationAPI) return;

    const pattern = this.getVibrationPattern(type);
    
    try {
      if (Array.isArray(pattern)) {
        this.vibrationAPI.call(navigator, pattern);
      } else {
        this.vibrationAPI.call(navigator, pattern);
      }
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  private getHapticConfig(type: HapticType) {
    const configs = {
      light: { frequency: 200, volume: 0.1, duration: 0.05 },
      medium: { frequency: 150, volume: 0.2, duration: 0.1 },
      heavy: { frequency: 100, volume: 0.3, duration: 0.15 },
      selection: { frequency: 300, volume: 0.05, duration: 0.03 },
      impact: { frequency: 80, volume: 0.4, duration: 0.2 },
      notification: { frequency: 250, volume: 0.15, duration: 0.08 }
    };
    
    return configs[type] || configs.light;
  }

  private getVibrationPattern(type: HapticType): number | number[] {
    const patterns = {
      light: 50,
      medium: 100,
      heavy: 200,
      selection: 25,
      impact: [100, 50, 100],
      notification: [50, 50, 50, 50, 100]
    };
    
    return patterns[type] || patterns.light;
  }

  // Specific feedback methods
  public light(): void {
    this.feedback('light');
  }

  public medium(): void {
    this.feedback('medium');
  }

  public heavy(): void {
    this.feedback('heavy');
  }

  public selection(): void {
    this.feedback('selection');
  }

  public impact(): void {
    this.feedback('impact');
  }

  public notification(): void {
    this.feedback('notification');
  }

  // Check if haptic feedback is supported
  public get supported(): boolean {
    return this.isSupported;
  }
}

// Export singleton instance
export const haptics = new HapticManager();

// Convenience functions
export const vibrate = (type: HapticType = 'light') => haptics.feedback(type);
export const vibrateLight = () => haptics.light();
export const vibrateMedium = () => haptics.medium();
export const vibrateHeavy = () => haptics.heavy();
export const vibrateSelection = () => haptics.selection();
export const vibrateImpact = () => haptics.impact();
export const vibrateNotification = () => haptics.notification();
