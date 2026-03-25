import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { UserCheck, ChevronDown, ChevronUp } from 'lucide-react';

export interface Signatory {
  id: string;
  name: string;
  role: string;
  cpf?: string;
  decree?: string;
  source: 'prefeito' | 'secretario' | 'responsavel' | 'diretor';
}

interface Props {
  selected: Signatory[];
  onChange: (signatories: Signatory[]) => void;
  maxSignatories?: number;
}

// Cache to avoid re-fetching
let cachedSignatories: Signatory[] | null = null;
let cachedMid: number | null = null;

export function useAvailableSignatories() {
  const { user } = useAuth();
  const mid = user?.municipalityId || 0;
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mid) { setLoading(false); return; }
    if (cachedMid === mid && cachedSignatories) {
      setSignatories(cachedSignatories);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result: Signatory[] = [];

    // Load municipality data from DATABASE (not localStorage)
    api.municipalities.getById({ id: mid }).then(async (m: any) => {
      if (m) {
        // Prefeito
        if (m.prefeitoName) {
          result.push({
            id: 'prefeito',
            name: m.prefeitoName,
            role: m.prefeitoCargo || 'Prefeito(a) Municipal',
            cpf: m.prefeitoCpf || '',
            source: 'prefeito',
          });
        }
        // Secretário(a) de Educação
        if (m.secretarioName) {
          result.push({
            id: 'secretario',
            name: m.secretarioName,
            role: m.secretarioCargo || 'Secretário(a) de Educação',
            cpf: m.secretarioCpf || '',
            decree: m.secretarioDecreto || '',
            source: 'secretario',
          });
        }
      }

      // Load responsáveis from DATABASE
      try {
        const responsibles = await api.municipalities.listResponsibles({ municipalityId: mid });
        if (Array.isArray(responsibles)) {
          responsibles.forEach((r: any) => {
            result.push({
              id: 'resp_' + r.id,
              name: r.name,
              role: r.role,
              cpf: r.cpf || '',
              decree: r.decree || '',
              source: 'responsavel',
            });
          });
        }
      } catch {}

      // Load school directors
      try {
        const schools = await api.schools.list({ municipalityId: mid });
        if (Array.isArray(schools)) {
          schools.forEach((s: any) => {
            if (s.directorName) {
              result.push({
                id: 'dir_' + s.id,
                name: s.directorName,
                role: 'Diretor(a) - ' + s.name,
                source: 'diretor',
              });
            }
          });
        }
      } catch {}

      cachedSignatories = result;
      cachedMid = mid;
      setSignatories(result);
      setLoading(false);
    }).catch(() => {
      cachedSignatories = result;
      cachedMid = mid;
      setSignatories(result);
      setLoading(false);
    });
  }, [mid]);

  return { signatories, loading };
}

// Force cache refresh (call after saving municipality data)
export function invalidateSignatoriesCache() {
  cachedSignatories = null;
  cachedMid = null;
}

const SOURCE_COLORS: Record<string, string> = {
  prefeito: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  secretario: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  responsavel: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  diretor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const SOURCE_LABELS: Record<string, string> = {
  prefeito: 'Prefeitura',
  secretario: 'Sec. Educacao',
  responsavel: 'Responsável',
  diretor: 'Escola',
};

export default function ReportSignatureSelector({ selected, onChange, maxSignatories = 5 }: Props) {
  const { signatories, loading } = useAvailableSignatories();
  const [expanded, setExpanded] = useState(false);

  const toggle = (sig: Signatory) => {
    const exists = selected.find(s => s.id === sig.id);
    if (exists) {
      onChange(selected.filter(s => s.id !== sig.id));
    } else if (selected.length < maxSignatories) {
      onChange([...selected, sig]);
    }
  };

  if (loading) return null;
  if (signatories.length === 0) return (
    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
      Nenhum responsavel cadastrado. Cadastre no menu <b>Cadastro da Prefeitura</b> para habilitar assinaturas nos relatorios.
    </div>
  );

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <UserCheck size={16} className="text-accent-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Assinaturas do Relatório
          </span>
          {selected.length > 0 && (
            <span className="text-xs bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400 px-2 py-0.5 rounded-full">
              {selected.length} selecionado(s)
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Selected preview (always visible) */}
      {selected.length > 0 && !expanded && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-600 flex flex-wrap gap-1.5">
          {selected.map(s => (
            <span key={s.id} className="text-xs bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 px-2 py-1 rounded-full">
              {s.name} <span className="text-accent-400">({s.role})</span>
            </span>
          ))}
        </div>
      )}

      {/* Expanded list */}
      {expanded && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-600 space-y-1 max-h-64 overflow-y-auto">
          {signatories.map(sig => {
            const isSelected = selected.some(s => s.id === sig.id);
            return (
              <label
                key={sig.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(sig)}
                  className="rounded text-accent-500 focus:ring-accent-400"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{sig.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sig.role}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${SOURCE_COLORS[sig.source] || ''}`}>
                  {SOURCE_LABELS[sig.source] || sig.source}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Generate HTML for signatures in printed reports
export function generateSignaturesHTML(signatories: Signatory[]): string {
  if (signatories.length === 0) return '';

  const cols = Math.min(signatories.length, 3);
  const gridStyle = signatories.length <= 3
    ? `display:flex;justify-content:space-around;flex-wrap:wrap;gap:30px`
    : `display:grid;grid-template-columns:repeat(${cols},1fr);gap:30px`;

  const sigs = signatories.map(s => `
    <div style="text-align:center;min-width:200px;margin-top:60px">
      <div style="border-top:2px solid #333;padding-top:10px;margin:0 5px">
        <p style="font-size:12px;font-weight:bold;margin:0;color:#1B3A5C">${s.name}</p>
        <p style="font-size:10px;color:#555;margin:3px 0 0">${s.role}</p>
        ${s.cpf ? '<p style="font-size:9px;color:#888;margin:2px 0 0">CPF: ' + s.cpf + '</p>' : ''}
        ${s.decree ? '<p style="font-size:9px;color:#888;margin:1px 0 0">' + s.decree + '</p>' : ''}
      </div>
    </div>
  `).join('');

  return `<div style="${gridStyle};margin-top:40px;page-break-inside:avoid">${sigs}</div>`;
}
