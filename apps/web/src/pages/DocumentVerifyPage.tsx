import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Shield, Clock, User, Building } from 'lucide-react';

export default function DocumentVerifyPage() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    const API_URL = import.meta.env.VITE_API_URL || '';
    fetch(`${API_URL}/api/documents/verify/${code}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Erro ao verificar documento'); setLoading(false); });
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center ${data?.valid ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            {data?.valid ? <CheckCircle size={48} className="text-white" /> : <XCircle size={48} className="text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {data?.valid ? 'Documento Autêntico' : 'Documento Não Encontrado'}
          </h1>
          <p className="text-white/80 mt-1 text-sm">
            {data?.valid ? 'Este documento foi emitido pelo sistema NetEscol' : data?.message || 'O código informado não corresponde a nenhum documento'}
          </p>
        </div>

        {/* Content */}
        {data?.valid && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield size={20} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Código de Verificação</p>
                <p className="font-mono font-bold text-blue-700">{data.code}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText size={20} className="text-indigo-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Documento</p>
                <p className="font-semibold text-gray-800">{data.title}</p>
                <p className="text-xs text-gray-400">{data.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building size={20} className="text-teal-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Município</p>
                <p className="font-semibold text-gray-800">{data.municipality}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User size={20} className="text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Emitido por</p>
                <p className="font-semibold text-gray-800">{data.generatedBy}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock size={20} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Data de Emissão</p>
                <p className="font-semibold text-gray-800">
                  {data.generatedAt ? new Date(data.generatedAt).toLocaleString('pt-BR') : '--'}
                </p>
              </div>
            </div>

            <div className="text-center pt-2 border-t">
              <p className="text-[10px] text-gray-400">
                Hash SHA-256: {data.pdfHash?.substring(0, 16)}...{data.pdfHash?.substring(48)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Verificação conforme Lei nº 14.063/2020 (assinatura eletrônica)
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center border-t">
          <p className="text-xs text-gray-500">
            <b className="text-teal-600">NetEscol</b> - Sistema de Gestão Escolar Municipal
          </p>
        </div>
      </div>
    </div>
  );
}
