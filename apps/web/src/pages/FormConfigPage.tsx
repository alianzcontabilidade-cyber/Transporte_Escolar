import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Settings, Save, ToggleLeft, ToggleRight, CheckCircle, AlertCircle } from 'lucide-react';

const FORM_TYPES = [
  { key: 'student', label: 'Aluno' },
  { key: 'school', label: 'Escola' },
  { key: 'driver', label: 'Motorista' },
  { key: 'vehicle', label: 'Veículo' },
  { key: 'route', label: 'Rota' },
  { key: 'teacher', label: 'Professor' },
];

const FIELD_LABELS: Record<string, Record<string, string>> = {
  student: {
    name: 'Nome',
    cpf: 'CPF',
    rg: 'RG',
    sex: 'Sexo',
    race: 'Raça/Cor',
    birthDate: 'Data de Nascimento',
    nationality: 'Nacionalidade',
    naturalness: 'Naturalidade',
    nis: 'NIS',
    cartaoSus: 'Cartão SUS',
    certidaoNumero: 'Número da Certidão',
    address: 'Endereço',
    cep: 'CEP',
    neighborhood: 'Bairro',
    city: 'Cidade',
    state: 'Estado',
    phone: 'Telefone',
    fatherName: 'Nome do Pai',
    fatherCpf: 'CPF do Pai',
    motherName: 'Nome da Mãe',
    motherCpf: 'CPF da Mãe',
    bloodType: 'Tipo Sanguíneo',
  },
  school: {
    name: 'Nome',
    code: 'Código INEP',
    type: 'Tipo',
    cnpj: 'CNPJ',
    address: 'Endereço',
    phone: 'Telefone',
    email: 'E-mail',
    directorName: 'Nome do Diretor',
  },
  driver: {
    name: 'Nome',
    cpf: 'CPF',
    phone: 'Telefone',
    cnhNumber: 'Número da CNH',
    cnhCategory: 'Categoria da CNH',
    cnhExpiry: 'Validade da CNH',
  },
  vehicle: {
    plate: 'Placa',
    model: 'Modelo',
    year: 'Ano',
    capacity: 'Capacidade',
    type: 'Tipo',
  },
  route: {
    name: 'Nome',
    code: 'Código',
  },
  teacher: {
    name: 'Nome',
    email: 'E-mail',
    phone: 'Telefone',
  },
};

type FieldState = Record<string, boolean>;

export default function FormConfigPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('student');
  const [configs, setConfigs] = useState<Record<string, FieldState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const municipalityId = user?.municipalityId;

  useEffect(() => {
    if (!municipalityId) return;
    loadConfigs();
  }, [municipalityId]);

  async function loadConfigs() {
    if (!municipalityId) return;
    setLoading(true);
    try {
      const data = await api.formConfig.list({ municipalityId });
      const grouped: Record<string, FieldState> = {};
      for (const formType of FORM_TYPES) {
        grouped[formType.key] = {};
        const fields = FIELD_LABELS[formType.key];
        for (const fieldName of Object.keys(fields)) {
          grouped[formType.key][fieldName] = false;
        }
      }
      for (const item of data as any[]) {
        if (grouped[item.formType]) {
          grouped[item.formType][item.fieldName] = item.isRequired;
        }
      }
      setConfigs(grouped);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao carregar configurações: ' + err.message });
    } finally {
      setLoading(false);
    }
  }

  function toggleField(formType: string, fieldName: string) {
    setConfigs(prev => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [fieldName]: !prev[formType]?.[fieldName],
      },
    }));
  }

  function toggleAllFields(formType: string, value: boolean) {
    const fields = FIELD_LABELS[formType];
    const newState: FieldState = {};
    for (const fieldName of Object.keys(fields)) {
      newState[fieldName] = value;
    }
    setConfigs(prev => ({ ...prev, [formType]: newState }));
  }

  async function handleSave() {
    if (!municipalityId) return;
    setSaving(true);
    setMessage(null);
    try {
      const formType = activeTab;
      const fieldState = configs[formType] || {};
      const fields = Object.entries(fieldState).map(([fieldName, isRequired]) => ({
        fieldName,
        isRequired,
      }));
      await api.formConfig.save({ municipalityId, formType, fields });
      setMessage({ type: 'success', text: `Configuração de "${FORM_TYPES.find(f => f.key === formType)?.label}" salva com sucesso!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAll() {
    if (!municipalityId) return;
    setSaving(true);
    setMessage(null);
    try {
      for (const formType of FORM_TYPES) {
        const fieldState = configs[formType.key] || {};
        const fields = Object.entries(fieldState).map(([fieldName, isRequired]) => ({
          fieldName,
          isRequired,
        }));
        await api.formConfig.save({ municipalityId, formType: formType.key, fields });
      }
      setMessage({ type: 'success', text: 'Todas as configurações foram salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message });
    } finally {
      setSaving(false);
    }
  }

  const currentFields = FIELD_LABELS[activeTab] || {};
  const currentState = configs[activeTab] || {};
  const requiredCount = Object.values(currentState).filter(Boolean).length;
  const totalCount = Object.keys(currentFields).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2DB5B0]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Configuração de Formulários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Defina quais campos são obrigatórios em cada cadastro</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {FORM_TYPES.map(ft => (
          <button
            key={ft.key}
            onClick={() => setActiveTab(ft.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === ft.key
                ? 'bg-white dark:bg-gray-700 text-[#1B3A5C] dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-[#2DB5B0]">{requiredCount}</span> de {totalCount} campos marcados como obrigatórios
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleAllFields(activeTab, true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#2DB5B0]/10 text-[#2DB5B0] hover:bg-[#2DB5B0]/20 transition-colors font-medium"
          >
            Marcar Todos
          </button>
          <button
            onClick={() => toggleAllFields(activeTab, false)}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Desmarcar Todos
          </button>
        </div>
      </div>

      {/* Fields grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {Object.entries(currentFields).map(([fieldName, label]) => {
            const isRequired = currentState[fieldName] || false;
            return (
              <div
                key={fieldName}
                className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  isRequired ? 'bg-[#2DB5B0]/5 dark:bg-[#2DB5B0]/10' : ''
                }`}
                onClick={() => toggleField(activeTab, fieldName)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{fieldName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isRequired && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#2DB5B0]/10 text-[#2DB5B0] font-medium">
                      Obrigatório
                    </span>
                  )}
                  {isRequired ? (
                    <ToggleRight size={28} className="text-[#2DB5B0]" />
                  ) : (
                    <ToggleLeft size={28} className="text-gray-300 dark:text-gray-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save buttons */}
      <div className="flex items-center justify-between mt-6 gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2DB5B0] hover:bg-[#25a09c] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : `Salvar ${FORM_TYPES.find(f => f.key === activeTab)?.label}`}
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1B3A5C] hover:bg-[#152d47] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Todas as Abas'}
        </button>
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Como funciona:</strong> Os campos marcados como obrigatórios serão exigidos nos formulários de cadastro
          do tipo selecionado. Esta configuração se aplica apenas a esta prefeitura/secretaria.
        </p>
      </div>
    </div>
  );
}
