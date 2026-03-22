import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

// ============================================
// GEOLOCATION
// ============================================
export async function getCurrentPosition(): Promise<{lat: number; lng: number; accuracy: number}> {
  if (isNative) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
  }
  // Web fallback
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => reject(err),
      { enableHighAccuracy: true }
    );
  });
}

export async function watchPosition(callback: (pos: {lat: number; lng: number; accuracy: number}) => void): Promise<string> {
  if (isNative) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const id = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos) => {
      if (pos) callback({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
    });
    return id;
  }
  // Web fallback
  const id = navigator.geolocation.watchPosition(
    pos => callback({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
    () => {},
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
  return String(id);
}

export async function clearWatch(id: string): Promise<void> {
  if (isNative) {
    const { Geolocation } = await import('@capacitor/geolocation');
    await Geolocation.clearWatch({ id });
  } else {
    navigator.geolocation.clearWatch(parseInt(id));
  }
}

// ============================================
// HAPTICS (vibration feedback)
// ============================================
export async function vibrate(duration: number = 200): Promise<void> {
  if (isNative) {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } else if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

// ============================================
// NETWORK STATUS
// ============================================
export async function isOnline(): Promise<boolean> {
  if (isNative) {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return status.connected;
  }
  return navigator.onLine;
}

export async function onNetworkChange(callback: (connected: boolean) => void): Promise<void> {
  if (isNative) {
    const { Network } = await import('@capacitor/network');
    Network.addListener('networkStatusChange', (status) => callback(status.connected));
  } else {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}

// ============================================
// LOCAL STORAGE (Preferences for native)
// ============================================
export async function setPreference(key: string, value: string): Promise<void> {
  if (isNative) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

export async function getPreference(key: string): Promise<string | null> {
  if (isNative) {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}
