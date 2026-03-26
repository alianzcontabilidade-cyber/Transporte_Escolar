import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, showSuccessToast, showErrorToast } from '../lib/hooks';
import { api } from '../lib/api';
import { MapPin, Navigation, Check, Search, Users, Loader2, AlertTriangle, CheckCircle, Filter, Crosshair, Map as MapIcon } from 'lucide-react';

interface PendingGps {
  studentId: number;
  studentName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export default function StudentGpsPage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId;

  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const confirmMapRef = useRef<any>(null);
  const confirmMapInstanceRef = useRef<any>(null);

  const [selectedSchool, setSelectedSchool] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'lista' | 'mapa'>('lista');
  const [collecting, setCollecting] = useState<number | null>(null);
  const [pendingGps, setPendingGps] = useState<PendingGps | null>(null);
  const [mapSearch, setMapSearch] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const [mapSearchBusy, setMapSearchBusy] = useState(false);

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
  const googleAutocompleteRef = useRef<any>(null);
  const googleSearchInputRef = useRef<HTMLInputElement>(null);

  // Setup Google Places Autocomplete for map search (if key available)
  useEffect(() => {
    if (!googleKey || viewMode !== 'mapa' || !googleSearchInputRef.current) return;
    const google = (window as any).google;
    if (!google?.maps?.places) return;
    if (googleAutocompleteRef.current) return; // already setup
    const ac = new google.maps.places.Autocomplete(googleSearchInputRef.current, {
      componentRestrictions: { country: 'br' }, fields: ['geometry', 'name', 'formatted_address'], types: ['establishment', 'geocode'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      const la = place.geometry.location.lat(), ln = place.geometry.location.lng();
      const L = (window as any).L;
      if (L && mapInstanceRef.current) {
        mapInstanceRef.current.setView([la, ln], 17);
        const icon = L.divIcon({ html: '<div style="background:#3b82f6;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:14px;font-weight:bold">📍</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
        const m = L.marker([la, ln], { icon }).addTo(mapInstanceRef.current).bindPopup('<b>' + (place.name || place.formatted_address || '') + '</b>').openPopup();
        markersRef.current.push(m);
      }
    });
    googleAutocompleteRef.current = ac;
  }, [viewMode, googleKey]);

  // Fallback: Nominatim search when no Google key
  const doMapSearch = (q: string) => {
    setMapSearch(q);
    if (googleKey) return; // Google handles it via Autocomplete
    if (q.length < 3) { setMapSuggestions([]); return; }
    setMapSearchBusy(true);
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q) + '&countrycodes=br&limit=6', { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'NetEscol/1.0' } })
      .then(r => r.json()).then(d => { setMapSuggestions(d); setMapSearchBusy(false); })
      .catch(() => { setMapSuggestions([]); setMapSearchBusy(false); });
  };

  const goToMapPlace = (place: any) => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;
    const la = parseFloat(place.lat), ln = parseFloat(place.lon);
    mapInstanceRef.current.setView([la, ln], 17);
    const icon = L.divIcon({ html: '<div style="background:#3b82f6;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:14px;font-weight:bold">📍</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
    const m = L.marker([la, ln], { icon }).addTo(mapInstanceRef.current).bindPopup('<b>' + place.display_name.split(',').slice(0, 3).join(', ') + '</b>').openPopup();
    markersRef.current.push(m);
    setMapSearch(place.display_name.split(',').slice(0, 3).join(', '));
    setMapSuggestions([]);
  };

  const { data: studentsList, loading, refetch } = useQuery<any[]>(
    () => api.ai.studentsGpsStatus({ municipalityId, schoolId: selectedSchool || undefined }),
    [municipalityId, selectedSchool]
  );

  const { data: schoolsList } = useQuery<any[]>(
    () => api.schools.list({ municipalityId }),
    [municipalityId]
  );

  const { mutate: updateGps, loading: saving } = useMutation(api.ai.updateStudentGps);

  const students = studentsList || [];
  const schools = schoolsList || [];

  // Stats
  const totalStudents = students.length;
  const withGps = students.filter((s: any) => s.latitude && s.longitude).length;
  const withoutGps = totalStudents - withGps;
  const percentage = totalStudents > 0 ? Math.round((withGps / totalStudents) * 100) : 0;

  // Filter
  const filtered = students.filter((s: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.address || '').toLowerCase().includes(term) ||
      (s.schoolName || '').toLowerCase().includes(term)
    );
  });

  // GPS Collection
  const handleCollectGps = (student: any) => {
    if (!navigator.geolocation) {
      showErrorToast('GPS não disponível neste dispositivo');
      return;
    }
    setCollecting(student.id);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingGps({
          studentId: student.id,
          studentName: student.name,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setCollecting(null);
      },
      (err) => {
        showErrorToast('Erro ao obter GPS: ' + err.message);
        setCollecting(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Confirm GPS
  const handleConfirmGps = async () => {
    if (!pendingGps) return;
    await updateGps(
      {
        studentId: pendingGps.studentId,
        latitude: pendingGps.latitude,
        longitude: pendingGps.longitude,
      },
      {
        onSuccess: () => {
          showSuccessToast(`GPS de "${pendingGps.studentName}" salvo com sucesso!`);
          setPendingGps(null);
          refetch();
        },
      }
    );
  };

  // Load Google Maps script (for search autocomplete)
  useEffect(() => {
    if (!googleKey || (window as any).google?.maps) return;
    if (document.getElementById('google-maps-script')) return;
    const sc = document.createElement('script'); sc.id = 'google-maps-script';
    sc.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places&language=pt-BR&region=BR`;
    sc.async = true; sc.defer = true; document.head.appendChild(sc);
  }, []);

  // Load Leaflet via CDN script (same pattern as other map pages)
  const loadLeaflet = (callback: (L: any) => void) => {
    const L = (window as any).L;
    if (L) { callback(L); return; }
    if (!document.getElementById('leaflet-css-gps')) {
      const lk = document.createElement('link'); lk.id = 'leaflet-css-gps'; lk.rel = 'stylesheet';
      lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk);
    }
    const sc = document.createElement('script'); sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    sc.onload = () => callback((window as any).L);
    document.head.appendChild(sc);
  };

  // Initialize main map (Mapa view)
  useEffect(() => {
    if (viewMode !== 'mapa' || !mapRef.current) return;
    loadLeaflet((L: any) => {
      if (!mapRef.current || !L) return;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

      const map = L.map(mapRef.current, { zoomControl: true }).setView([-10.18, -48.33], 12);
      const st = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; CARTO', maxZoom: 20 });
      const sa = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      const hl = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { attribution: '&copy; Esri', maxZoom: 19 });
      const hy = L.layerGroup([L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }), hl]);
      sa.addTo(map); hl.addTo(map);
      L.control.layers({ 'Ruas': st, 'Satelite': sa, 'Hibrido': hy }, {}, { position: 'topright' }).addTo(map);
      mapInstanceRef.current = map;

      // Add student markers
      markersRef.current.forEach((m: any) => { try { m.remove(); } catch(_){} });
      markersRef.current = [];
      const studentsWithGps = students.filter((s: any) => s.latitude && s.longitude && parseFloat(String(s.latitude)) !== 0);
      const pts: number[][] = [];

      studentsWithGps.forEach((s: any) => {
        const la = parseFloat(String(s.latitude)), ln = parseFloat(String(s.longitude));
        if (isNaN(la) || isNaN(ln)) return;
        const icon = L.divIcon({
          html: `<div style="background:#16a34a;color:#fff;padding:2px 6px;border-radius:12px;font-size:10px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3);white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis">${s.name.split(' ')[0]}</div>`,
          className: '', iconAnchor: [20, 10],
        });
        const m = L.marker([la, ln], { icon }).addTo(map).bindPopup(
          `<div style="min-width:180px;font-family:Arial"><b style="color:#1e3a5f;font-size:13px">${s.name}</b><br><span style="font-size:11px;color:#555">${s.address || 'Sem endereco'}</span><br><span style="font-size:11px;color:#555">${s.grade || ''} ${s.routeName ? '| Rota: ' + s.routeName : ''}</span><br><span style="font-size:10px;color:#888">${la.toFixed(6)}, ${ln.toFixed(6)}</span></div>`
        );
        markersRef.current.push(m);
        pts.push([la, ln]);
      });

      if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40] });
      else if (pts.length === 1) map.setView(pts[0] as any, 15);

      // User position
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          if (!mapInstanceRef.current) return;
          L.circleMarker([pos.coords.latitude, pos.coords.longitude], { radius: 6, fillColor: '#dc2626', color: '#fff', weight: 2, fillOpacity: 1 })
            .addTo(mapInstanceRef.current).bindPopup('<b>Sua posicao atual</b>');
        }, () => {});
      }
      setTimeout(() => map.invalidateSize(), 200);
    });
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [viewMode, students]);

  // Confirmation mini-map
  useEffect(() => {
    if (!pendingGps) {
      if (confirmMapInstanceRef.current) { confirmMapInstanceRef.current.remove(); confirmMapInstanceRef.current = null; }
      return;
    }
    const timer = setTimeout(() => {
      const container = document.getElementById('confirm-map');
      if (!container) return;
      const L = (window as any).L;
      if (!L) return;
      if (confirmMapInstanceRef.current) { confirmMapInstanceRef.current.remove(); confirmMapInstanceRef.current = null; }
      const miniMap = L.map(container, { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([pendingGps.latitude, pendingGps.longitude], 17);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '' }).addTo(miniMap);
      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', { attribution: '' }).addTo(miniMap);
      const icon = L.divIcon({ html: '<div style="background:#dc2626;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);font-size:16px">📍</div>', className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
      L.marker([pendingGps.latitude, pendingGps.longitude], { icon }).addTo(miniMap);
      confirmMapInstanceRef.current = miniMap;
      setTimeout(() => miniMap.invalidateSize(), 100);
    }, 150);
    return () => clearTimeout(timer);
  }, [pendingGps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (confirmMapInstanceRef.current) {
        confirmMapInstanceRef.current.remove();
        confirmMapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Navigation className="w-7 h-7 text-blue-600" />
          Coleta GPS de Alunos
        </h1>
        <p className="text-gray-500 mt-1">Marque o ponto exato de cada aluno no mapa</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Alunos</p>
              <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Com GPS</p>
              <p className="text-xl font-bold text-green-600">{withGps}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Sem GPS</p>
              <p className="text-xl font-bold text-red-600">{withoutGps}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">% Coletado</p>
              <p className="text-xl font-bold text-purple-600">{percentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Progresso da coleta</span>
          <span className="text-sm font-bold text-gray-900">{withGps}/{totalStudents}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* School filter */}
          <div className="flex-1">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value ? Number(e.target.value) : '')}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Todas as Escolas</option>
                {schools.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar aluno por nome, endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('lista')}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'lista'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('mapa')}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'mapa'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Mapa
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-gray-500">Carregando alunos...</p>
        </div>
      ) : viewMode === 'lista' ? (
        /* LIST VIEW */
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Endereço</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Escola</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Série</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">GPS Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Nenhum aluno encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: any) => {
                    const hasGps = s.latitude && s.longitude;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-400 md:hidden">{s.address || '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                          {s.address || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                          {s.schoolName || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                          {s.grade || s.series || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasGps ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <Check className="w-3 h-3" />
                              Coletado
                              <span className="hidden xl:inline text-green-500 ml-1">
                                ({Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)})
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3" />
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCollectGps(s)}
                              disabled={collecting === s.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {collecting === s.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Obtendo...
                                </>
                              ) : (
                                <>
                                  <Crosshair className="w-3.5 h-3.5" />
                                  Marcar Ponto
                                </>
                              )}
                            </button>
                            {hasGps && (
                              <button
                                onClick={() => {
                                  setViewMode('mapa');
                                  // After switching to map, center on this student
                                  setTimeout(async () => {
                                    if (mapInstanceRef.current) {
                                      mapInstanceRef.current.setView([s.latitude, s.longitude], 17);
                                    }
                                  }, 500);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                              >
                                <MapIcon className="w-3.5 h-3.5" />
                                Ver no Mapa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
              Mostrando {filtered.length} de {totalStudents} alunos
            </div>
          )}
        </div>
      ) : (
        /* MAP VIEW */
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-3 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapIcon className="w-4 h-4" />
                {withGps} alunos com GPS no mapa
              </span>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> Aluno com GPS
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500 rounded-full inline-block" /> Sua posição
                </span>
              </div>
            </div>
            {/* Busca por endereço no mapa */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={googleSearchInputRef} className="input pl-9 pr-10 text-xs" placeholder="Pesquise rua, bairro, cidade, escola..." value={mapSearch} onChange={e => doMapSearch(e.target.value)} />
              {mapSearchBusy && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
              {mapSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {mapSuggestions.map((s: any, i: number) => (
                    <button key={i} type="button" onClick={() => goToMapPlace(s)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-start gap-2">
                      <MapPin size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div ref={mapRef} style={{ height: '600px', width: '100%' }} />
        </div>
      )}

      {/* Confirmation Modal */}
      {pendingGps && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Confirmar Ponto GPS
              </h3>
              <p className="text-blue-100 text-sm mt-1">{pendingGps.studentName}</p>
            </div>

            {/* Mini Map - Google Maps Static or Leaflet fallback */}
            {import.meta.env.VITE_GOOGLE_MAPS_KEY ? (
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${pendingGps.latitude},${pendingGps.longitude}&zoom=17&size=600x200&maptype=hybrid&markers=color:red%7C${pendingGps.latitude},${pendingGps.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`}
                alt="Localização" className="w-full" style={{ height: 200, objectFit: 'cover' }}
              />
            ) : (
              <div id="confirm-map" style={{ height: '200px', width: '100%' }} />
            )}

            {/* Info */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="text-sm text-gray-500">Latitude</span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  {pendingGps.latitude.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="text-sm text-gray-500">Longitude</span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  {pendingGps.longitude.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="text-sm text-gray-500">Precisão</span>
                <span className={`text-sm font-bold ${pendingGps.accuracy <= 10 ? 'text-green-600' : pendingGps.accuracy <= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {pendingGps.accuracy.toFixed(1)} metros
                </span>
              </div>
              {pendingGps.accuracy > 30 && (
                <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-700">
                    A precisão está baixa. Tente novamente em local aberto para melhor sinal GPS.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
              <button
                onClick={() => setPendingGps(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmGps}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar Ponto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
