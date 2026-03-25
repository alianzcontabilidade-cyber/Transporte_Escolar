import { useState, useEffect, useRef } from 'react';
import { MapPin, Crosshair, Loader2, Search } from 'lucide-react';

interface GoogleMapPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string) => void;
  height?: number;
  markerLabel?: string; // emoji or text for marker
  placeholder?: string;
  showGpsButton?: boolean;
}

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

export default function GoogleMapPicker({
  latitude, longitude, onLocationChange,
  height = 300, markerLabel = '📍', placeholder = 'Pesquise o endereço, escola ou local...',
  showGpsButton = true,
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [collectingGps, setCollectingGps] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;
    if ((window as any).google?.maps) { setLoaded(true); return; }
    if (document.getElementById('google-maps-script')) {
      // Script already loading, wait for it
      const check = setInterval(() => {
        if ((window as any).google?.maps) { setLoaded(true); clearInterval(check); }
      }, 200);
      return () => clearInterval(check);
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&language=pt-BR&region=BR`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!loaded || !mapRef.current || !GOOGLE_MAPS_KEY) return;
    const google = (window as any).google;
    if (!google?.maps) return;

    const lat = parseFloat(latitude) || -10.18;
    const lng = parseFloat(longitude) || -48.33;
    const hasCoords = latitude && longitude && parseFloat(latitude) !== 0;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: hasCoords ? 17 : 12,
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid'],
      },
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Add marker if coords exist
    if (hasCoords) {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        draggable: true,
        title: 'Localização',
      });
      markerRef.current = marker;
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) onLocationChange(pos.lat().toFixed(8), pos.lng().toFixed(8));
      });
    }

    // Click on map to set location
    map.addListener('click', (e: any) => {
      const la = e.latLng.lat().toFixed(8);
      const ln = e.latLng.lng().toFixed(8);
      onLocationChange(la, ln);
      if (markerRef.current) {
        (markerRef.current as any).setPosition(e.latLng);
      } else {
        const marker = new google.maps.Marker({
          position: e.latLng, map, draggable: true, title: 'Localização',
        });
        markerRef.current = marker;
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) onLocationChange(pos.lat().toFixed(8), pos.lng().toFixed(8));
        });
      }
    });

    // Setup Places Autocomplete
    if (searchRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
        componentRestrictions: { country: 'br' },
        fields: ['geometry', 'name', 'formatted_address'],
        types: ['establishment', 'geocode'],
      });
      autocomplete.bindTo('bounds', map);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;
        const pos = place.geometry.location;
        const la = pos.lat().toFixed(8);
        const ln = pos.lng().toFixed(8);
        onLocationChange(la, ln);
        map.setCenter(pos);
        map.setZoom(18);
        if (markerRef.current) {
          (markerRef.current as any).setPosition(pos);
        } else {
          const marker = new google.maps.Marker({
            position: pos, map, draggable: true, title: place.name || 'Local',
          });
          markerRef.current = marker;
          marker.addListener('dragend', () => {
            const p = marker.getPosition();
            if (p) onLocationChange(p.lat().toFixed(8), p.lng().toFixed(8));
          });
        }
      });
      autocompleteRef.current = autocomplete;
    }

    return () => {
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [loaded]);

  // Update marker when lat/lng changes externally
  useEffect(() => {
    if (!mapInstanceRef.current || !loaded) return;
    const google = (window as any).google;
    if (!google?.maps) return;
    const lat = parseFloat(latitude), lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0) return;
    const pos = new google.maps.LatLng(lat, lng);
    if (markerRef.current) {
      (markerRef.current as any).setPosition(pos);
    } else {
      const marker = new google.maps.Marker({ position: pos, map: mapInstanceRef.current, draggable: true });
      markerRef.current = marker;
      marker.addListener('dragend', () => {
        const p = marker.getPosition();
        if (p) onLocationChange(p.lat().toFixed(8), p.lng().toFixed(8));
      });
    }
    mapInstanceRef.current.setCenter(pos);
    if (mapInstanceRef.current.getZoom()! < 15) mapInstanceRef.current.setZoom(17);
  }, [latitude, longitude]);

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setCollectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(pos.coords.latitude.toFixed(8), pos.coords.longitude.toFixed(8));
        setCollectingGps(false);
      },
      () => setCollectingGps(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Fallback: no API key
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <p className="text-sm text-yellow-700 font-medium mb-1">Google Maps não configurado</p>
        <p className="text-xs text-yellow-600 mb-3">
          Configure a variável <code className="bg-yellow-100 px-1 rounded">VITE_GOOGLE_MAPS_KEY</code> no arquivo .env com sua API Key do Google Maps.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label text-xs">Latitude</label><input className="input text-xs" value={latitude} onChange={e => onLocationChange(e.target.value, longitude)} placeholder="-10.1234" /></div>
          <div><label className="label text-xs">Longitude</label><input className="input text-xs" value={longitude} onChange={e => onLocationChange(latitude, e.target.value)} placeholder="-48.5678" /></div>
        </div>
        {showGpsButton && (
          <button type="button" onClick={handleGps} disabled={collectingGps} className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5 mt-2">
            {collectingGps ? <Loader2 size={12} className="animate-spin" /> : <Crosshair size={12} />}
            {collectingGps ? 'Obtendo GPS...' : 'Usar GPS Atual'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search + GPS button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            className="input pl-9 text-xs"
            placeholder={placeholder}
          />
        </div>
        {showGpsButton && (
          <button type="button" onClick={handleGps} disabled={collectingGps}
            className="btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0">
            {collectingGps ? <Loader2 size={12} className="animate-spin" /> : <Crosshair size={12} />}
            {collectingGps ? 'GPS...' : 'GPS Atual'}
          </button>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full rounded-lg border border-gray-200 overflow-hidden" style={{ height }} />

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label text-xs">Latitude</label><input className="input text-xs" value={latitude} onChange={e => onLocationChange(e.target.value, longitude)} placeholder="-10.1234" /></div>
        <div><label className="label text-xs">Longitude</label><input className="input text-xs" value={longitude} onChange={e => onLocationChange(latitude, e.target.value)} placeholder="-48.5678" /></div>
      </div>

      <p className="text-xs text-gray-400">Pesquise pelo nome, clique no mapa ou use o GPS. Arraste o marcador para ajustar.</p>
    </div>
  );
}
