import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useGPSTracking, isGPSSupported, requestGPSPermission } from '../lib/gps';
import { useWakeLock } from '../lib/pwa';

export default function TrackingPage() {
  const { user } = useAuth();
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [sendCount, setSendCount] = useState(0);
  const { isActive: wakeLockActive, request: requestWakeLock, release: releaseWakeLock } = useWakeLock();

  const { position, error: gpsError, isTracking, startTracking, stopTracking } = useGPSTracking({
    tripId: activeTrip?.id,
    driverId: driverId || undefined,
    intervalMs: 10000,
    enabled: !!activeTrip && !!driverId,
  });

  useEffect(() => {
    checkGPSPermission();
    loadActiveTrip();
  }, []);

  async function checkGPSPermission() {
    if (!isGPSSupported()) {
      setPermissionStatus('unsupported');
      return;
    }
    const status = await requestGPSPermission();
    setPermissionStatus(status);
  }

  async function loadActiveTrip() {
    try {
      setLoading(true);
      // Try to get active trip for this driver/monitor
      const trip = await api.monitors.myActiveTrip();
      setActiveTrip(trip);
      if (trip?.driverId) setDriverId(trip.driverId);
    } catch (err) {
      console.log('Nenhuma viagem ativa');
    } finally {
      setLoading(false);
    }
  }

  // Ativar Wake Lock quando rastreamento está ativo
  useEffect(() => {
    if (isTracking) requestWakeLock();
    else releaseWakeLock();
    return () => releaseWakeLock();
  }, [isTracking]);

  // Count successful sends
  useEffect(() => {
    if (position && isTracking) {
      setSendCount(c => c + 1);
    }
  }, [position, isTracking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <span className="text-2xl">📍</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rastreamento GPS</h1>
          <p className="text-gray-500">Compartilhe sua localizacao em tempo real</p>
        </div>
      </div>

      {/* GPS Status Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Status do GPS</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* GPS Support */}
          <div className={`p-4 rounded-lg ${isGPSSupported() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{isGPSSupported() ? '✅' : '❌'}</span>
              <div>
                <p className="font-medium text-sm">GPS do Dispositivo</p>
                <p className="text-xs text-gray-500">{isGPSSupported() ? 'Disponivel' : 'Nao disponivel'}</p>
              </div>
            </div>
          </div>

          {/* Permission */}
          <div className={`p-4 rounded-lg ${permissionStatus === 'granted' ? 'bg-green-50 border border-green-200' : permissionStatus === 'denied' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{permissionStatus === 'granted' ? '✅' : permissionStatus === 'denied' ? '❌' : '⚠️'}</span>
              <div>
                <p className="font-medium text-sm">Permissao GPS</p>
                <p className="text-xs text-gray-500">
                  {permissionStatus === 'granted' ? 'Concedida' : permissionStatus === 'denied' ? 'Negada' : permissionStatus === 'unsupported' ? 'Nao suportado' : 'Pendente'}
                </p>
              </div>
            </div>
          </div>

          {/* Tracking Status */}
          <div className={`p-4 rounded-lg ${isTracking ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xl ${isTracking ? 'animate-pulse' : ''}`}>{isTracking ? '🟢' : '⚪'}</span>
              <div>
                <p className="font-medium text-sm">Rastreamento</p>
                <p className="text-xs text-gray-500">{isTracking ? 'Ativo - enviando posicao' : 'Inativo'}</p>
              </div>
            </div>
          </div>

          {/* Wake Lock Status */}
          <div className={`p-4 rounded-lg ${wakeLockActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{wakeLockActive ? '📱' : '🔌'}</span>
              <div>
                <p className="font-medium text-sm">Tela Ativa</p>
                <p className="text-xs text-gray-500">{wakeLockActive ? 'Tela nao desligara automaticamente' : 'Tela pode desligar'}</p>
              </div>
            </div>
          </div>
        </div>

        {gpsError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {gpsError}
          </div>
        )}

        {!activeTrip && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">Nenhuma viagem ativa</p>
            <p className="text-yellow-600 text-sm mt-1">O rastreamento GPS sera ativado automaticamente quando uma viagem estiver em andamento.</p>
          </div>
        )}

        {activeTrip && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">Viagem ativa: {activeTrip.routeName || 'Rota #' + activeTrip.routeId}</p>
            <p className="text-blue-600 text-sm mt-1">Rastreamento GPS ativado automaticamente.</p>
          </div>
        )}
      </div>

      {/* Position Card */}
      {position && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Posicao Atual</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Latitude</p>
              <p className="font-mono text-sm font-semibold">{position.latitude.toFixed(6)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Longitude</p>
              <p className="font-mono text-sm font-semibold">{position.longitude.toFixed(6)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Velocidade</p>
              <p className="font-mono text-sm font-semibold">{position.speed ? (position.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Precisao</p>
              <p className="font-mono text-sm font-semibold">{position.accuracy ? position.accuracy.toFixed(0) + ' m' : 'N/A'}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Atualizacoes enviadas: {sendCount} | Ultima: {new Date(position.timestamp).toLocaleTimeString()}</p>
        </div>
      )}

      {/* Manual Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Controles Manuais</h2>
        <div className="flex gap-3">
          <button
            onClick={startTracking}
            disabled={isTracking || !isGPSSupported()}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Iniciar Rastreamento
          </button>
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Parar Rastreamento
          </button>
          <button
            onClick={loadActiveTrip}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Atualizar Viagem
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          O rastreamento envia sua posicao a cada 10 segundos para o servidor.
          Os pais/responsaveis poderao acompanhar a posicao do onibus em tempo real.
        </p>
      </div>
    </div>
  );
}
