import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  timestamp: number;
}

interface UseGPSTrackingOptions {
  tripId?: number;
  driverId?: number;
  intervalMs?: number;
  enabled?: boolean;
}

export function useGPSTracking({ tripId, driverId, intervalMs = 10000, enabled = false }: UseGPSTrackingOptions) {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPositionRef = useRef<GPSPosition | null>(null);

  const sendLocation = useCallback(async (pos: GPSPosition) => {
    if (!tripId || !driverId) return;
    try {
      await api.trips.updateLocation({
        tripId,
        driverId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        speed: pos.speed || 0,
        heading: pos.heading || 0,
      });
    } catch (err) {
      console.error('Erro ao enviar localizacao:', err);
    }
  }, [tripId, driverId]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('GPS nao disponivel neste dispositivo');
      return;
    }

    setError(null);
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (geoPos) => {
        const newPos: GPSPosition = {
          latitude: geoPos.coords.latitude,
          longitude: geoPos.coords.longitude,
          speed: geoPos.coords.speed,
          heading: geoPos.coords.heading,
          accuracy: geoPos.coords.accuracy,
          timestamp: geoPos.timestamp,
        };
        setPosition(newPos);
        lastPositionRef.current = newPos;
      },
      (geoErr) => {
        switch (geoErr.code) {
          case geoErr.PERMISSION_DENIED:
            setError('Permissao de GPS negada. Habilite nas configuracoes do navegador.');
            break;
          case geoErr.POSITION_UNAVAILABLE:
            setError('Posicao GPS indisponivel.');
            break;
          case geoErr.TIMEOUT:
            setError('Tempo esgotado ao obter GPS.');
            break;
          default:
            setError('Erro ao obter GPS: ' + geoErr.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    // Periodic send to backend
    sendIntervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendLocation(lastPositionRef.current);
      }
    }, intervalMs);
  }, [intervalMs, sendLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendIntervalRef.current !== null) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (enabled && tripId && driverId) {
      startTracking();
    }
    return () => stopTracking();
  }, [enabled, tripId, driverId, startTracking, stopTracking]);

  return { position, error, isTracking, startTracking, stopTracking };
}

// Hook to poll active vehicle locations (for parents/admins)
export function useVehicleLocations(municipalityId: number | null, enabled = true, pollIntervalMs = 10000) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!municipalityId) return;
    try {
      setLoading(true);
      const data = await api.location.getActiveVehicles({ municipalityId });
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar localizacoes:', err);
    } finally {
      setLoading(false);
    }
  }, [municipalityId]);

  useEffect(() => {
    if (!enabled || !municipalityId) return;
    fetchLocations();
    const interval = setInterval(fetchLocations, pollIntervalMs);
    return () => clearInterval(interval);
  }, [enabled, municipalityId, pollIntervalMs, fetchLocations]);

  return { vehicles, loading, refresh: fetchLocations };
}

// Check if GPS is supported
export function isGPSSupported(): boolean {
  return 'geolocation' in navigator;
}

// Request GPS permission
export async function requestGPSPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.permissions) return 'prompt';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    return 'prompt';
  }
}
