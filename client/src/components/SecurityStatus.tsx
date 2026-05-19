import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc';

interface SecurityStatusProps {
  userId: number;
}

export function SecurityStatus({ userId }: SecurityStatusProps) {
  const [securityScore, setSecurityScore] = useState<{
    score: number;
    status: 'critical' | 'low' | 'medium' | 'high';
    recommendations: string[];
  } | null>(null);

  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    // Fetch security score
    const fetchSecurityScore = async () => {
      try {
        // This would be a tRPC call in real implementation
        // For now, we'll use mock data
        setSecurityScore({
          score: 65,
          status: 'medium',
          recommendations: [
            'Enable two-factor authentication',
            'Review active sessions',
          ],
        });
      } catch (error) {
        console.error('Failed to fetch security score:', error);
      }
    };

    fetchSecurityScore();
  }, [userId]);

  if (!securityScore) {
    return null;
  }

  const statusColors = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    low: 'text-red-400 bg-red-500/10 border-red-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    high: 'text-green-400 bg-green-500/10 border-green-500/30',
  };

  const statusIcons = {
    critical: AlertTriangle,
    low: AlertTriangle,
    medium: AlertCircle,
    high: CheckCircle,
  };

  const StatusIcon = statusIcons[securityScore.status];

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Status de Segurança</h3>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusColors[securityScore.status]}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {securityScore.status === 'critical' && 'Crítico'}
              {securityScore.status === 'low' && 'Baixo'}
              {securityScore.status === 'medium' && 'Médio'}
              {securityScore.status === 'high' && 'Alto'}
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Pontuação de Segurança</span>
            <span className="text-2xl font-bold text-white">{securityScore.score}/100</span>
          </div>
          <Progress value={securityScore.score} className="h-2" />
        </div>

        {/* 2FA Status */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white">Autenticação de Dois Fatores</p>
                <p className="text-xs text-slate-400">
                  {is2FAEnabled ? 'Ativado' : 'Desativado'}
                </p>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${is2FAEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </div>

        {/* Recommendations */}
        {securityScore.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">Recomendações</h4>
            <div className="space-y-2">
              {securityScore.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            Ver Logs de Auditoria
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Gerenciar Sessões
          </Button>
        </div>
      </div>
    </Card>
  );
}
