import { useState } from 'react';
import { Lock, X, Check, Shield, Loader2, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { useMutation } from '../lib/hooks';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  documentId: number;
  documentTitle: string;
  verificationCode?: string;
  onSigned?: (signature: any) => void;
}

export default function SignatureModal({ open, onClose, documentId, documentTitle, verificationCode, onSigned }: SignatureModalProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [signerRole, setSignerRole] = useState('');
  const [success, setSuccess] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: sign, loading, error } = useMutation((input: any) =>
    api.documentSignatures.sign(input)
  );

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    await sign(
      {
        documentId,
        password,
        signerRole: signerRole.trim() || undefined,
      },
      {
        onSuccess: (data: any) => {
          setSuccess(data);
          onSigned?.(data);
        },
        onError: () => {
          // error is handled by useMutation
        },
      }
    );
  };

  const handleClose = () => {
    setPassword('');
    setSignerRole('');
    setSuccess(null);
    setCopied(false);
    onClose();
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Documento Assinado!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Sua assinatura eletronica foi registrada com sucesso.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Hash da Assinatura</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-700 dark:text-gray-300 break-all flex-1 font-mono bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                  {success.signatureHash || success.hash || 'Registrada'}
                </code>
                {(success.signatureHash || success.hash) && (
                  <button
                    onClick={() => copyHash(success.signatureHash || success.hash)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
                    title="Copiar hash"
                  >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Assinado por: <strong>{user?.name}</strong> em {new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700">
            <button onClick={handleClose} className="btn-primary w-full flex items-center justify-center gap-2">
              <Check size={16} /> Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Signature form
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock size={18} className="text-accent-500" />
            ASSINATURA ELETRONICA
          </h3>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Document info card */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-accent-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{documentTitle}</p>
                {verificationCode && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Codigo: <span className="font-mono font-bold text-accent-600">{verificationCode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Signer info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Assinante: <strong>{user?.name}</strong> ({user?.email})
            </p>
          </div>

          {/* Signer role (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cargo/Funcao <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <input
              type="text"
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              placeholder="Ex: Secretario de Educacao"
              className="input"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Senha de Confirmacao <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha para confirmar"
              className="input"
              required
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Legal disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
              <strong>Aviso Legal:</strong> Ao assinar, voce confirma a autenticidade deste documento conforme MP 2.200-2/2001.
              A assinatura eletronica tem validade juridica e sera vinculada ao seu usuario.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Assinando...
                </>
              ) : (
                <>
                  <Lock size={16} /> Assinar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
