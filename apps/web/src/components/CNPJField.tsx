import { useState } from 'react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { lookupCNPJ } from '../lib/cnpjCep';
import { maskCNPJ, validateCNPJ } from '../lib/utils';

// Receita Federal icon (simplified RFB logo)
function ReceitaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="20" height="18" rx="3" fill="#1a4d2e" />
      <path d="M6 8h3.5c1.4 0 2.5.6 2.5 1.8 0 .9-.6 1.5-1.4 1.7L12.5 14H10.8l-1.6-2.3H8v2.3H6V8zm2 1.3v1.5h1.3c.7 0 1-.3 1-.75s-.3-.75-1-.75H8z" fill="#c5a930" />
      <path d="M13.5 8H18v1.3h-2.5v1.1H18v1.2h-2.5v2.4H13.5V8z" fill="#c5a930" />
      <rect x="5" y="16" width="14" height="1.5" rx=".5" fill="#c5a930" opacity=".6" />
    </svg>
  );
}

interface Props {
  value: string;
  onChange: (cnpj: string) => void;
  onDataLoaded?: (data: any) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export default function CNPJField({ value, onChange, onDataLoaded, label, required, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: any) => {
    const masked = maskCNPJ(e.target.value);
    onChange(masked);
    const digits = e.target.value.replace(/\D/g, '');
    if (digits.length === 14) {
      setError(validateCNPJ(digits) ? '' : 'CNPJ invalido');
    } else {
      setError('');
    }
    setMsg('');
  };

  const handleLookup = async () => {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) { setError('CNPJ incompleto'); return; }
    if (!validateCNPJ(digits)) { setError('CNPJ invalido'); return; }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const data = await lookupCNPJ(digits);
      setMsg('Dados carregados da Receita Federal!');
      if (onDataLoaded) onDataLoaded(data);
      setTimeout(() => setMsg(''), 4000);
    } catch (e: any) {
      setError(e.message || 'Erro ao consultar');
    } finally { setLoading(false); }
  };

  return (
    <div className={className}>
      {label !== undefined && <label className="label">{label}{required && ' *'}</label>}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={value}
          onChange={handleChange}
          placeholder="00.000.000/0000-00"
          maxLength={18}
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={loading}
          className="px-3 py-2 bg-[#1a4d2e] text-white rounded-lg hover:bg-[#154026] flex items-center gap-1.5 text-sm disabled:opacity-50 whitespace-nowrap shadow-sm transition-colors"
          title="Buscar na Receita Federal"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ReceitaIcon size={18} />}
          <span className="hidden sm:inline">Receita Federal</span>
          <span className="sm:hidden">RF</span>
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={10} />{error}</p>}
      {msg && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={10} />{msg}</p>}
    </div>
  );
}
