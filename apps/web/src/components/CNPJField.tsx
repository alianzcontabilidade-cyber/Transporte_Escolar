import { useState } from 'react';
import { Search, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { lookupCNPJ } from '../lib/cnpjCep';
import { maskCNPJ, validateCNPJ } from '../lib/utils';

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
          className="px-3 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 flex items-center gap-1 text-sm disabled:opacity-50 whitespace-nowrap"
          title="Buscar na Receita Federal"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Buscar
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={10} />{error}</p>}
      {msg && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={10} />{msg}</p>}
    </div>
  );
}
