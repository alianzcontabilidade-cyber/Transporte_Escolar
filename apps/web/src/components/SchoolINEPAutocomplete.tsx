import { useState, useEffect, useRef } from 'react';
import { Loader2, BookOpen, X } from 'lucide-react';
import { searchSchoolsByMunicipality } from '../lib/inepData';

interface Props {
  value: string;
  onSelect: (school: { name: string; inepCode: string; address?: string; phone?: string }) => void;
  onChange: (value: string) => void;
  municipalityName?: string;
  placeholder?: string;
}

export default function SchoolINEPAutocomplete({ value, onSelect, onChange, municipalityName, placeholder }: Props) {
  const [schools, setSchools] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load schools when municipality name is available
  useEffect(() => {
    if (!municipalityName) return;
    setLoading(true);
    searchSchoolsByMunicipality(municipalityName)
      .then(results => {
        setSchools(results);
        setLoaded(true);
      })
      .catch(() => { setLoaded(true); })
      .finally(() => setLoading(false));
  }, [municipalityName]);

  // Filter as user types
  useEffect(() => {
    if (!value || value.length < 2 || !loaded) {
      setFiltered([]);
      return;
    }
    const q = value.toLowerCase();
    const matches = schools.filter(s =>
      s.name.toLowerCase().includes(q) || s.inepCode.includes(q)
    ).slice(0, 15);
    setFiltered(matches);
  }, [value, schools, loaded]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          className="input pr-10"
          value={value}
          onChange={e => { onChange(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (value.length >= 2 && filtered.length > 0) setIsOpen(true); }}
          placeholder={placeholder || 'Digite o nome da escola...'}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
          {loaded && schools.length > 0 && !loading && (
            <span title={schools.length + ' escolas INEP carregadas'}><BookOpen size={14} className="text-emerald-500" /></span>
          )}
        </div>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-gray-700 border-b flex items-center justify-between">
            <span>Escolas INEP ({filtered.length} resultado{filtered.length > 1 ? 's' : ''})</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
          </div>
          {filtered.map(s => (
            <button
              key={s.inepCode}
              type="button"
              onClick={() => { onSelect({ name: s.name, inepCode: s.inepCode, address: s.address, phone: s.phone }); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-accent-50 dark:hover:bg-accent-900/20 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
            >
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
              <p className="text-[11px] text-gray-400">INEP: {s.inepCode} | {s.admin} | {s.location}</p>
            </button>
          ))}
        </div>
      )}

      {isOpen && value.length >= 2 && filtered.length === 0 && loaded && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-3 text-sm text-gray-500 text-center">
          {schools.length === 0 ? 'Nenhuma escola INEP carregada para este município' : 'Nenhuma escola encontrada para "' + value + '"'}
        </div>
      )}
    </div>
  );
}
