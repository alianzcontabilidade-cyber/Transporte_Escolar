import { useState, useMemo } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '../lib/hooks';
import { api } from '../lib/api';
import { Database, Download, CheckCircle, AlertTriangle, HardDrive, RefreshCw, Shield, Clock, Filter } from 'lucide-react';

interface TableGroup {
  label: string;
  color: string;
  tables: { key: string; label: string }[];
}

const TABLE_GROUPS: TableGroup[] = [
  {
    label: 'Ensino e Alunos',
    color: 'bg-indigo-50 border-indigo-200',
    tables: [
      { key: 'schools', label: 'Escolas' },
      { key: 'students', label: 'Alunos' },
      { key: 'guardians', label: 'Respons\u00e1veis' },
      { key: 'enrollments', label: 'Matr\u00edculas' },
      { key: 'classes', label: 'Turmas' },
      { key: 'classGrades', label: 'S\u00e9ries' },
      { key: 'subjects', label: 'Disciplinas' },
      { key: 'academicYears', label: 'Anos Letivos' },
      { key: 'teachers', label: 'Professores' },
    ],
  },
  {
    label: 'Transporte',
    color: 'bg-orange-50 border-orange-200',
    tables: [
      { key: 'routes', label: 'Rotas' },
      { key: 'vehicles', label: 'Ve\u00edculos' },
      { key: 'drivers', label: 'Motoristas' },
      { key: 'monitorStaff', label: 'Monitores' },
      { key: 'fuelRecords', label: 'Combust\u00edvel' },
      { key: 'maintenanceRecords', label: 'Manuten\u00e7\u00e3o' },
      { key: 'vehicleInspections', label: 'Vistorias' },
      { key: 'contracts', label: 'Contratos' },
    ],
  },
  {
    label: 'RH e Financeiro',
    color: 'bg-green-50 border-green-200',
    tables: [
      { key: 'positions', label: 'Cargos' },
      { key: 'departments', label: 'Departamentos' },
      { key: 'staffAllocations', label: 'Aloca\u00e7\u00f5es' },
      { key: 'financialAccounts', label: 'Contas' },
      { key: 'financialTransactions', label: 'Transa\u00e7\u00f5es' },
    ],
  },
  {
    label: 'Operacional',
    color: 'bg-yellow-50 border-yellow-200',
    tables: [
      { key: 'mealMenus', label: 'Card\u00e1pios' },
      { key: 'libraryBooks', label: 'Biblioteca' },
      { key: 'assets', label: 'Patrim\u00f4nio' },
      { key: 'inventoryItems', label: 'Estoque' },
    ],
  },
  {
    label: 'Comunica\u00e7\u00e3o e Docs',
    color: 'bg-purple-50 border-purple-200',
    tables: [
      { key: 'messages', label: 'Mensagens' },
      { key: 'events', label: 'Eventos' },
      { key: 'documents', label: 'Documentos' },
      { key: 'schoolCalendar', label: 'Calend\u00e1rio' },
      { key: 'bulletins', label: 'Mural' },
      { key: 'protocols', label: 'Protocolos' },
      { key: 'quotations', label: 'Cota\u00e7\u00f5es' },
    ],
  },
];

const ALL_TABLE_KEYS = TABLE_GROUPS.flatMap(g => g.tables.map(t => t.key));

export default function DataBackupPage() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set(ALL_TABLE_KEYS));
  const [showFilter, setShowFilter] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(() => localStorage.getItem('netescol_last_backup'));

  const { data: stats, loading: loadingStats, refetch } = useQuery(
    () => api.backup.stats({ municipalityId: mid }),
    [mid]
  );

  const totalRecords = useMemo(() => {
    if (!stats) return 0;
    return Object.values(stats as Record<string, number>).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
  }, [stats]);

  const selectedCount = useMemo(() => {
    if (!stats) return 0;
    return Array.from(selectedTables).reduce((sum, key) => {
      return sum + (typeof (stats as any)?.[key] === 'number' ? (stats as any)[key] : 0);
    }, 0);
  }, [stats, selectedTables]);

  const toggleTable = (key: string) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleGroup = (group: TableGroup) => {
    const groupKeys = group.tables.map(t => t.key);
    const allSelected = groupKeys.every(k => selectedTables.has(k));
    setSelectedTables(prev => {
      const next = new Set(prev);
      groupKeys.forEach(k => allSelected ? next.delete(k) : next.add(k));
      return next;
    });
  };

  const selectAll = () => setSelectedTables(new Set(ALL_TABLE_KEYS));
  const selectNone = () => setSelectedTables(new Set());

  const exportBackup = async () => {
    if (selectedTables.size === 0) {
      setExportMsg('Selecione pelo menos uma tabela para exportar.');
      return;
    }
    setExporting(true);
    setExportMsg('');
    try {
      const tables = selectedTables.size === ALL_TABLE_KEYS.length ? undefined : Array.from(selectedTables);
      const data = await api.backup.exportAll({ municipalityId: mid, tables });
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const date = new Date().toISOString().split('T')[0];
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `backup_netescol_${date}.json`;
      a.click();
      URL.revokeObjectURL(a.href);

      const now = new Date().toISOString();
      localStorage.setItem('netescol_last_backup', now);
      setLastBackup(now);

      const meta = (data as any)?._metadata;
      setExportMsg(`Backup exportado com sucesso! ${meta?.tableCount || ''} tabelas, ${meta?.totalRecords || ''} registros.`);
    } catch (e: any) {
      setExportMsg('Erro ao exportar: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' \u00e0s ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Cabe\u00e7alho */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Database size={20} className="text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Backup de Dados</h1>
            <p className="text-gray-500">Exporte seus dados em formato JSON para seguran\u00e7a</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter size={16} /> {showFilter ? 'Ocultar Filtros' : 'Filtrar Tabelas'}
          </button>
          <button
            onClick={exportBackup}
            disabled={exporting || selectedTables.size === 0}
            className="btn-primary flex items-center gap-2"
          >
            <HardDrive size={16} />
            {exporting ? 'Exportando...' : `Exportar Backup (${selectedTables.size} tabelas)`}
          </button>
        </div>
      </div>

      {/* Mensagem de feedback */}
      {exportMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${exportMsg.includes('Erro') || exportMsg.includes('Selecione') ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
          {exportMsg.includes('Erro') || exportMsg.includes('Selecione') ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {exportMsg}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <Database size={24} className="text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total de Registros</p>
              <p className="text-2xl font-bold text-blue-800">
                {loadingStats ? '...' : totalRecords.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <Shield size={24} className="text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Selecionados p/ Backup</p>
              <p className="text-2xl font-bold text-green-800">
                {loadingStats ? '...' : selectedCount.toLocaleString('pt-BR')} registros
              </p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-purple-600" />
            <div>
              <p className="text-sm text-purple-600 font-medium">\u00daltimo Backup</p>
              <p className="text-lg font-bold text-purple-800">
                {lastBackup ? formatDate(lastBackup) : 'Nenhum realizado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtro de tabelas */}
      {showFilter && (
        <div className="card mb-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Filter size={18} /> Selecione as tabelas para incluir no backup
            </h2>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200">
                Selecionar Tudo
              </button>
              <button onClick={selectNone} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                Limpar Sele\u00e7\u00e3o
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {TABLE_GROUPS.map(group => {
              const groupKeys = group.tables.map(t => t.key);
              const allChecked = groupKeys.every(k => selectedTables.has(k));
              const someChecked = groupKeys.some(k => selectedTables.has(k));
              return (
                <div key={group.label} className={`rounded-lg border p-3 ${group.color}`}>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={() => toggleGroup(group)}
                      className="rounded"
                    />
                    <span className="font-semibold text-gray-800 text-sm">{group.label}</span>
                  </label>
                  <div className="space-y-1 ml-5">
                    {group.tables.map(t => (
                      <label key={t.key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={selectedTables.has(t.key)}
                          onChange={() => toggleTable(t.key)}
                          className="rounded"
                        />
                        <span>{t.label}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {(stats as any)?.[t.key] ?? '-'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contagens por tabela */}
      <div className="card border mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Database size={18} /> Registros por Tabela
          </h2>
          <button onClick={() => refetch()} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {loadingStats ? (
          <div className="text-center py-8 text-gray-400">Carregando estat\u00edsticas...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {TABLE_GROUPS.flatMap(g => g.tables).map(t => {
              const count = (stats as any)?.[t.key] ?? 0;
              return (
                <div key={t.key} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-sm text-gray-700">{t.label}</span>
                  <span className={`text-sm font-semibold ${count > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                    {count.toLocaleString('pt-BR')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recomenda\u00e7\u00f5es */}
      <div className="card bg-blue-50 border-blue-200 border">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <AlertTriangle size={16} /> Recomenda\u00e7\u00f5es de Backup
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Fa\u00e7a backup regularmente (pelo menos 1x por semana)</li>
          <li>Guarde os arquivos em local seguro (nuvem ou HD externo)</li>
          <li>O backup exporta todos os dados em formato JSON, leg\u00edvel e completo</li>
          <li>Use o filtro para selecionar apenas as tabelas desejadas</li>
          <li>Para restaurar dados, entre em contato com o suporte t\u00e9cnico</li>
        </ul>
      </div>
    </div>
  );
}
