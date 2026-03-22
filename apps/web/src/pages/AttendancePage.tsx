import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { QrCode, CheckCircle, XCircle, User, Bus, Search, Camera, X, Clock, Users, TrendingUp } from 'lucide-react';
import jsQR from 'jsqr';

function QRScanner({ onScan, onClose }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [manual, setManual] = useState('');
  const [scanning, setScanning] = useState(false);

  const scanFrame = useCallback(() => {
    if (!scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) { requestAnimationFrame(scanFrame); return; }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    if (code && code.data) {
      scanningRef.current = false;
      // Vibrar para feedback
      if (navigator.vibrate) navigator.vibrate(200);
      onScan(code.data.trim());
      return;
    }
    requestAnimationFrame(scanFrame);
  }, [onScan]);

  useEffect(() => {
    let stream: MediaStream;
    scanningRef.current = true;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
          setScanning(true);
          setHasCamera(true);
          // Iniciar scanning após video carregar
          videoRef.current.onloadeddata = () => requestAnimationFrame(scanFrame);
        }
      })
      .catch(() => setHasCamera(false));
    return () => {
      scanningRef.current = false;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [scanFrame]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2"><Camera size={18}/> Escanear QR Code</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18}/></button>
        </div>
        <div className="p-4">
          {hasCamera ? (
            <div className="relative bg-black rounded-xl overflow-hidden aspect-square mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white/60 rounded-xl" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }}>
                  {scanning && <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse"/>}
                </div>
              </div>
              <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70">
                {scanning ? 'Escaneando... aponte para o QR Code' : 'Iniciando câmera...'}
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl aspect-square mb-4 flex flex-col items-center justify-center gap-2">
              <Camera size={40} className="text-gray-300"/>
              <p className="text-sm text-gray-500">Câmera não disponível</p>
              <p className="text-xs text-gray-400">Use o campo abaixo para digitar a matrícula</p>
            </div>
          )}
          <div>
            <label className="label">Ou digite a matrícula manualmente</label>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Matrícula do aluno" value={manual} onChange={e => setManual(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && manual && onScan(manual)} autoFocus={!hasCamera} />
              <button onClick={() => manual && onScan(manual)} className="btn-primary px-4">OK</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { user } = useAuth();
  const municipalityId = user?.municipalityId || 0;
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'register'|'history'|'summary'>('register');
  const { data: students } = useQuery(() => api.students.list({ municipalityId }), [municipalityId]);
  const [records, setRecords] = useState<any[]>([]);
  const { data: activeTrips } = useQuery(() => api.trips.listActive({ municipalityId }), [municipalityId]);
  const { data: tripHistory } = useQuery(() => api.trips.history({ municipalityId, limit: 50 }), [municipalityId]);

  const allStudents = (students as any) || [];
  const allTrips = (activeTrips as any) || [];
  const allHistory = (tripHistory as any) || [];
  const filtered = allStudents.filter((s: any) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) || (s.enrollment || '').includes(search)
  );

  const registerAttendance = async (studentId: number, type: 'boarding' | 'alighting') => {
    const student = allStudents.find((s: any) => s.id === studentId);
    const record = { id: Date.now(), studentId, studentName: student?.name, enrollment: student?.enrollment, type, time: new Date(), routeName: 'Rota Principal' };
    setRecords(r => [record, ...r]);
    setScanResult({ ...record, student });
    setTimeout(() => setScanResult(null), 3000);

    // Persistir no backend se houver viagem ativa
    if (allTrips.length > 0) {
      const trip = allTrips[0];
      try {
        // Buscar stopId do aluno na rota da viagem
        const routeId = trip.trip?.routeId || trip.route?.id;
        let stopId = 1; // fallback
        if (routeId) {
          try {
            const stopsData = await api.stops.listByRoute({ routeId });
            if (Array.isArray(stopsData)) {
              // Encontrar a parada onde o aluno esta vinculado
              const studentStop = stopsData.find((s: any) =>
                s.students?.some((st: any) => st.id === studentId)
              );
              if (studentStop) stopId = studentStop.id;
              else if (stopsData.length > 0) stopId = stopsData[0].id;
            }
          } catch { /* usar stopId padrao */ }
        }
        if (type === 'boarding') {
          await api.monitors.boardStudent({ tripId: trip.trip?.id, studentId, stopId });
        } else {
          await api.monitors.dropStudent({ tripId: trip.trip?.id, studentId, stopId });
        }
      } catch (e) {
        /* erro ao persistir frequência - registro mantido localmente */
      }
    }
  };

  const handleScan = (code: string) => {
    setShowScanner(false);
    // Tentar parsear JSON legado (QR antigos com {id, name, enrollment})
    let searchCode = code;
    try {
      const parsed = JSON.parse(code);
      if (parsed.enrollment) searchCode = parsed.enrollment;
      else if (parsed.id) searchCode = String(parsed.id);
    } catch { /* não é JSON, usar como string direta */ }
    const student = allStudents.find((s: any) => s.enrollment === searchCode || String(s.id) === searchCode);
    if (student) { registerAttendance(student.id, 'boarding'); }
    else { setScanResult({ error: true, code: searchCode }); setTimeout(() => setScanResult(null), 3000); }
  };

  const todayRecords = records.filter(r => new Date(r.time).toDateString() === new Date().toDateString());
  const boardings = todayRecords.filter(r => r.type === 'boarding').length;
  const alightings = todayRecords.filter(r => r.type === 'alighting').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-2xl font-bold text-gray-900">Frequência</h1><p className="text-gray-500">Controle de embarque e desembarque</p></div>
        <button onClick={() => setShowScanner(true)} className="btn-primary flex items-center gap-2"><QrCode size={16}/> Escanear QR Code</button>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card text-center"><CheckCircle size={24} className="text-green-500 mx-auto mb-1"/><p className="text-2xl font-bold">{boardings}</p><p className="text-sm text-gray-500">Embarcaram</p></div>
        <div className="card text-center"><XCircle size={24} className="text-red-400 mx-auto mb-1"/><p className="text-2xl font-bold">{alightings}</p><p className="text-sm text-gray-500">Desembarcaram</p></div>
        <div className="card text-center"><TrendingUp size={24} className="text-primary-500 mx-auto mb-1"/><p className="text-2xl font-bold">{allStudents.length > 0 ? Math.round((boardings/allStudents.length)*100) : 0}%</p><p className="text-sm text-gray-500">Presença</p></div>
      </div>

      {/* Toast de resultado */}
      {scanResult && (
        <div className={`fixed top-4 right-4 z-40 p-4 rounded-xl shadow-2xl transition-all ${scanResult.error ? 'bg-red-500' : 'bg-green-500'} text-white max-w-sm`}>
          {scanResult.error ? (
            <div className="flex items-center gap-3"><XCircle size={20}/><div><p className="font-semibold">Aluno não encontrado</p><p className="text-sm opacity-90">Código: {scanResult.code}</p></div></div>
          ) : (
            <div className="flex items-center gap-3"><CheckCircle size={20}/><div><p className="font-semibold">{scanResult.type === 'boarding' ? 'Embarcou' : 'Desembarcou'}</p><p className="text-sm opacity-90">{scanResult.studentName}</p></div></div>
          )}
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {[['register','Registrar',User],['history','Histórico',Clock],['summary','Resumo',Users]].map(([id,label,Icon]: any) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===id?'bg-white shadow text-primary-600':'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={14}/> {label}
          </button>
        ))}
      </div>

      {tab === 'register' && (
        <div>
          <div className="relative mb-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Buscar aluno por nome ou matrícula..." value={search} onChange={e => setSearch(e.target.value)}/></div>
          <div className="grid gap-2">
            {filtered.map((s: any) => {
              const lastRecord = records.filter(r => r.studentId === s.id)[0];
              const isBoarded = lastRecord?.type === 'boarding';
              return (
                <div key={s.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 flex-shrink-0">{s.name?.[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <div className="flex gap-2 mt-0.5">
                      {s.enrollment && <span className="text-xs text-gray-400">Mat. {s.enrollment}</span>}
                      {s.grade && <span className="text-xs text-gray-400">{s.grade}</span>}
                      {lastRecord && <span className={`text-xs flex items-center gap-1 ${isBoarded?'text-green-600':'text-red-500'}`}><Clock size={10}/> {new Date(lastRecord.time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => registerAttendance(s.id, 'boarding')} className={`p-2 rounded-lg text-sm transition-all ${isBoarded?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'}`} title="Embarque"><CheckCircle size={16}/></button>
                    <button onClick={() => registerAttendance(s.id, 'alighting')} className="p-2 rounded-lg text-sm bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all" title="Desembarque"><XCircle size={16}/></button>
                  </div>
                </div>
              );
            })}
            {!filtered.length && <div className="card text-center py-12"><Users size={40} className="text-gray-200 mx-auto mb-3"/><p className="text-gray-500">Nenhum aluno encontrado</p></div>}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>{['Aluno','Matrícula','Tipo','Horário','Rota'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">{r.studentName}</td>
                  <td className="px-5 py-3 text-gray-500">{r.enrollment || '—'}</td>
                  <td className="px-5 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${r.type==='boarding'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{r.type==='boarding'?'Embarque':'Desembarque'}</span></td>
                  <td className="px-5 py-3 text-gray-500">{new Date(r.time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</td>
                  <td className="px-5 py-3 text-gray-500">{r.routeName}</td>
                </tr>
              ))}
              {!records.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Nenhum registro hoje</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'summary' && (
        <div className="grid gap-4">
          <div className="card"><h3 className="font-semibold text-gray-800 mb-3">Resumo por turno</h3>
            {['Manhã','Tarde','Noite'].map(turno => (
              <div key={turno} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm text-gray-700">{turno}</span>
                <div className="flex gap-4">
                  <span className="text-sm text-green-600">{allStudents.filter((s: any) => ({ morning:'Manhã',afternoon:'Tarde',evening:'Noite' }[s.shift as string]===turno)).length} alunos</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card"><h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Bus size={16}/> Gerar QR Codes</h3>
            <p className="text-sm text-gray-500 mb-3">Gere QR Codes individuais para cada aluno para facilitar o registro de presença.</p>
            <button onClick={() => { import('../lib/qrcode').then(m => m.printStudentQRCodes(allStudents, window.location.origin)); }} className="btn-secondary flex items-center gap-2 text-sm"><QrCode size={14}/> Gerar QR Codes de todos os alunos</button>
          </div>
        </div>
      )}

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
