import { useState, useEffect, useCallback } from 'react';

// ============================================
// PWA INSTALL PROMPT
// ============================================
let deferredPrompt: any = null;

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt = null;
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return result.outcome === 'accepted';
  }, []);

  return { canInstall, isInstalled, install };
}

// ============================================
// NOTIFICATION SOUND & VIBRATION
// ============================================
export function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
    // Segundo tom
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1000;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // AudioContext não disponível
  }
}

export function vibrateDevice(pattern: number[] = [200, 100, 200]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function notifyUser() {
  playNotificationSound();
  vibrateDevice();
}

// ============================================
// WAKE LOCK (manter tela ligada durante rastreamento)
// ============================================
export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return false;
    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      setWakeLock(lock);
      setIsActive(true);
      lock.addEventListener('release', () => {
        setIsActive(false);
        setWakeLock(null);
      });
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const release = useCallback(() => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
      setIsActive(false);
    }
  }, [wakeLock]);

  // Re-acquire on visibility change (quando volta à tela)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLock) {
        await request();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, wakeLock, request]);

  return { isActive, request, release };
}
