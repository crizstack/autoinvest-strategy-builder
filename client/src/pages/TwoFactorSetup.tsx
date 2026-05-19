import { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface TwoFactorSetupPageProps {
  onComplete?: () => void;
}

export default function TwoFactorSetupPage({ onComplete }: TwoFactorSetupPageProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'backup' | 'complete'>('intro');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Mock QR code URL
  const qrCodeUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const mockBackupCodes = [
    'A1B2-C3D4-E5F6',
    'G7H8-I9J0-K1L2',
    'M3N4-O5P6-Q7R8',
    'S9T0-U1V2-W3X4',
    'Y5Z6-A7B8-C9D0',
  ];

  const handleVerify = () => {
    if (verificationCode.length !== 6) {
      toast.error('Código deve ter 6 dígitos');
      return;
    }
    setBackupCodes(mockBackupCodes);
    setStep('backup');
  };

  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    setStep('complete');
    onComplete?.();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Autenticação de Dois Fatores</h1>
          <p className="text-slate-400">Adicione uma camada extra de segurança à sua conta</p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex gap-2">
          {['intro', 'qr', 'verify', 'backup', 'complete'].map((s, idx) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                ['intro', 'qr', 'verify', 'backup', 'complete'].indexOf(step) >= idx
                  ? 'bg-green-600'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <Card className="p-8 bg-slate-900/50 border-slate-800">
          {step === 'intro' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">O que é 2FA?</h2>
                <p className="text-slate-400 mb-4">
                  A autenticação de dois fatores adiciona uma camada extra de segurança exigindo um código além da sua senha.
                </p>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Protege contra roubo de senha
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Acesso seguro mesmo se a senha vazar
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400" />
                    Códigos de backup para recuperação
                  </li>
                </ul>
              </div>

              <Button onClick={() => setStep('qr')} className="w-full">
                Começar Setup
              </Button>
            </div>
          )}

          {step === 'qr' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Escanear Código QR</h2>
                <p className="text-slate-400 mb-4">
                  Use um aplicativo de autenticação como Google Authenticator, Microsoft Authenticator ou Authy
                </p>
              </div>

              <div className="flex justify-center p-8 bg-white rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Ou insira manualmente:</p>
                <code className="text-sm text-green-400 font-mono break-all">
                  JBSWY3DPEBLW64TMMQ======
                </code>
              </div>

              <Button onClick={() => setStep('verify')} className="w-full">
                Próximo
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Verificar Código</h2>
                <p className="text-slate-400 mb-4">
                  Digite o código de 6 dígitos do seu aplicativo de autenticação
                </p>
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">Código de Verificação</Label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono bg-slate-950 border-slate-800"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setStep('qr')}
                  variant="outline"
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={verificationCode.length !== 6}
                  className="flex-1"
                >
                  Verificar
                </Button>
              </div>
            </div>
          )}

          {step === 'backup' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-300">
                  <p className="font-semibold mb-1">Salve seus códigos de backup</p>
                  <p>Você precisará deles se perder acesso ao seu aplicativo de autenticação</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-sm">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="text-slate-300 py-1">
                    {code}
                  </div>
                ))}
              </div>

              <Button
                onClick={handleCopyBackupCodes}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Códigos
                  </>
                )}
              </Button>

              <Button onClick={handleComplete} className="w-full">
                Concluir Setup
              </Button>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">2FA Ativado com Sucesso!</h2>
                <p className="text-slate-400">
                  Sua conta agora está protegida com autenticação de dois fatores
                </p>
              </div>

              <Button onClick={() => window.location.href = '/settings'} className="w-full">
                Voltar para Configurações
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
