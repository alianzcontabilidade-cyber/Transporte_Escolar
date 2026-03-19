import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Database, Download, CheckCircle, AlertTriangle, HardDrive } from 'lucide-react';

export default function DataBackupPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [exporting, setExporting] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  const { data: studentsData } = useQuery(() => api.students.list({ municipalityId: mid }), [mid]);
  const { data: schoolsData } = useQuery(() => api.schools.list({ municipalityId: mid }), [mid]);
  const { data: driversData } = useQuery(() => api.drivers.list({ municipalityId: mid }), [mid]);
  const { data: vehiclesData } = useQuery(() => api.vehicles.list({ municipalityId: mid }), [mid]);
  const { data: routesData } = useQuery(() => api.routes.list({ municipalityId: mid }), [mid]);

  const counts = {
    students: ((studentsData as any) || []).length,
    schools: ((schoolsData as any) || []).length,
    drivers: ((driversData as any) || []).length,
    vehicles: ((vehiclesData as any) || []).length,
    routes: ((routesData as any) || []).length,
  };

  const exportData = async (type: string) => {
    setExporting(type);
    setExportMsg('');
    try {
      let data: any[] = [];
      let filename = '';
      if (type === 'students') { data = (studentsData as any) || []; filename = 'backup_alunos'; }
      else if (type === 'schools') { data = (schoolsData as any) || []; filename = 'backup_escolas'; }
      else if (type === 'drivers') { data = ((driversData as any) || []).map((d: any) => d.user ? { ...d.driver, name: d.user.name, email: d.user.email, phone: d.user.phone } : d); filename = 'backup_motoristas'; }
      else if (type === 'vehicles') { data = (vehiclesData as any) || []; filename = 'backup_veiculos'; }
      else if (type === 'routes') { data = (routesData as any) || []; filename = 'backup_rotas'; }
      else if (type === 'all') {
        const all = { students: studentsData, schools: schoolsData, drivers: driversData, vehicles: vehiclesData, routes: routesData, exportDate: new Date().toISOString(), system: 'NetEscol v3.0.0' };
        const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'backup_completo_netescol_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        setExportMsg('Backup completo exportado com sucesso!');
        setExporting('');
        return;
      }

      if (data.length === 0) { setExportMsg('Nenhum dado para exportar'); setExporting(''); return; }
      const keys = Object.keys(data[0]);
      const csv = [keys.join(';'), ...data.map((r: any) => keys.map(k => '"' + String((r as any)[k] ?? '').replace(/"/g, '""') + '"').join(';'))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename + '_' + new Date().toISOString().split('T')[0] + '.csv';
      a.click();
      setExportMsg(data.length + ' registro(s) exportado(s)!');
    } catch (e: any) { setExportMsg('Erro: ' + e.message); }
    finally { setExporting(''); }
  };

  const backupItems = [
    { key: 'students', label: 'Alunos', count: counts.students, icon: '\u{1F464}', color: 'bg-indigo-50 border-indigo-200' },
    { key: 'schools', label: 'Escolas', count: counts.schools, icon: '\u{1F3EB}', color: 'bg-blue-50 border-blue-200' },
    { key: 'drivers', label: 'Motoristas', count: counts.drivers, icon: '\u{1F697}', color: 'bg-orange-50 border-orange-200' },
    { key: 'vehicles', label: 'Ve\u00edculos', count: counts.vehicles, icon: '\u{1F68C}', color: 'bg-yellow-50 border-yellow-200' },
    { key: 'routes', label: 'Rotas', count: counts.routes, icon: '\u{1F4CD}', color: 'bg-green-50 border-green-200' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><Database size={20} className="text-slate-600" /></div><div><h1 className="text-2xl font-bold text-gray-900">Backup de Dados</h1><p className="text-gray-500">Exporte seus dados para seguran\u00e7a</p></div></div>
        <button onClick={() => exportData('all')} disabled={!!exporting} className="btn-primary flex items-center gap-2"><HardDrive size={16} /> {exporting === 'all' ? 'Exportando...' : 'Backup Completo (JSON)'}</button>
      </div>

      {exportMsg && <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${exportMsg.includes('Erro') || exportMsg.includes('Nenhum') ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>{exportMsg.includes('Erro') ? <AlertTriangle size={16} /> : <CheckCircle size={16} />} {exportMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {backupItems.map(item => (
          <div key={item.key} className={`card ${item.color} border`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3"><span className="text-2xl">{item.icon}</span><div><p className="font-semibold text-gray-800">{item.label}</p><p className="text-xs text-gray-500">{item.count} registro(s)</p></div></div>
            </div>
            <button onClick={() => exportData(item.key)} disabled={!!exporting || item.count === 0} className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-gray-50 border rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-40">
              <Download size={14} /> {exporting === item.key ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        ))}
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Recomenda\u00e7\u00f5es de Backup</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Fa\u00e7a backup regularmente (pelo menos 1x por semana)</li>
          <li>Guarde os arquivos em local seguro (nuvem ou HD externo)</li>
          <li>O backup completo (JSON) inclui todos os dados do sistema</li>
          <li>Os backups individuais (CSV) podem ser abertos no Excel</li>
          <li>Em caso de problemas, entre em contato com o suporte</li>
        </ul>
      </div>
    </div>
  );
}
