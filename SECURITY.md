# Guia de Segurança - AutoInvest Strategy Builder

## Visão Geral

Este documento descreve as funcionalidades de segurança implementadas na plataforma AutoInvest Strategy Builder para proteger contas de usuários e dados sensíveis.

## 1. Autenticação de Dois Fatores (2FA)

### Implementação

Utilizamos **TOTP (Time-based One-Time Password)** compatível com aplicativos como:
- Google Authenticator
- Microsoft Authenticator
- Authy
- FreeOTP

### Como Funciona

1. **Setup Inicial**
   - Usuário acessa Configurações > Segurança > 2FA
   - Sistema gera um segredo TOTP único
   - QR code é exibido para escanear com o aplicativo
   - Usuário verifica inserindo um código de 6 dígitos

2. **Códigos de Backup**
   - 10 códigos de backup são gerados durante setup
   - Cada código pode ser usado uma única vez
   - Armazenados com hash SHA-256 no banco de dados
   - Usuário deve salvá-los em local seguro

3. **Login com 2FA**
   - Após inserir email/senha, usuário é solicitado a inserir código
   - Código pode ser do aplicativo TOTP ou um código de backup
   - Válido por 30 segundos (com janela de tolerância)

### Serviço: `TwoFactorService`

```typescript
// Setup 2FA
const { secret, qrCodeUrl, backupCodes } = await TwoFactorService.setup2FA(userId, email);

// Verificar código durante setup
const verified = await TwoFactorService.verify2FA(userId, code);

// Verificar código durante login
const isValid = await TwoFactorService.verifyLoginCode(userId, code);

// Desabilitar 2FA
await TwoFactorService.disable2FA(userId);

// Verificar se 2FA está ativado
const enabled = await TwoFactorService.is2FAEnabled(userId);
```

## 2. Logs de Auditoria

### Eventos Registrados

- **Autenticação**: login, logout, falha de login, 2FA verificado
- **Configurações**: alteração de email, senha, 2FA, preferências
- **Estratégias**: criação, atualização, exclusão, ativação, desativação
- **Trades**: execução, fechamento, cancelamento
- **Sessões**: criação, revogação, timeout

### Estrutura

```sql
CREATE TABLE auditLogs (
  id INT PRIMARY KEY,
  userId INT,
  action VARCHAR(255),
  resourceType VARCHAR(50),
  resourceId INT,
  details JSON,
  ipAddress VARCHAR(45),
  createdAt TIMESTAMP
);
```

### Serviço: `AuditService`

```typescript
// Log de auditoria
await AuditService.logAudit(
  userId,
  'strategy_created',
  'strategy',
  strategyId,
  { name: 'My Strategy' },
  ipAddress
);

// Log de evento de segurança
await AuditService.logSecurityEvent(
  userId,
  'login_success',
  'low',
  ipAddress,
  userAgent
);

// Obter logs do usuário
const logs = await AuditService.getUserAuditLogs(userId);
const events = await AuditService.getUserSecurityEvents(userId);

// Obter pontuação de segurança
const { score, status, recommendations } = await AuditService.getSecurityScore(userId);
```

## 3. Gerenciamento de Sessões

### Funcionalidades

- **Sessões Ativas**: Listar todas as sessões ativas do usuário
- **Revogação Remota**: Encerrar qualquer sessão de qualquer dispositivo
- **Timeout Automático**: Sessões expiram após 30 dias de inatividade
- **Detecção de Atividade Suspeita**: Alerta se múltiplas sessões de IPs diferentes

### Estrutura

```sql
CREATE TABLE userSessions (
  id INT PRIMARY KEY,
  userId INT,
  sessionToken VARCHAR(255) UNIQUE,
  ipAddress VARCHAR(45),
  userAgent VARCHAR(500),
  lastActivityAt TIMESTAMP,
  expiresAt TIMESTAMP,
  revokedAt TIMESTAMP,
  createdAt TIMESTAMP
);
```

### Serviço: `SessionService`

```typescript
// Criar sessão
const token = await SessionService.createSession(userId, ipAddress, userAgent);

// Validar sessão
const { valid, userId } = await SessionService.validateSession(token);

// Listar sessões ativas
const sessions = await SessionService.getActiveSessions(userId);

// Revogar sessão
await SessionService.revokeSession(sessionId);

// Revogar todas as outras sessões
await SessionService.revokeAllOtherSessions(userId, currentSessionId);

// Detectar atividade suspeita
const { suspicious, reason } = await SessionService.detectSuspiciousActivity(userId);
```

## 4. Confirmação para Ações Sensíveis

### Ações Protegidas

- Deletar estratégia
- Deletar trade
- Ativar/desativar 2FA
- Revogar todas as sessões
- Alterar email
- Deletar conta

### Componente: `ConfirmationDialog`

```tsx
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

<ConfirmationDialog
  isOpen={isOpen}
  title="Deletar Estratégia"
  description="Esta ação é irreversível"
  severity="critical"
  requireConfirmation={true}
  confirmationText="deletar"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

### Hook: `useConfirmation`

```tsx
const { confirm, Dialog } = useConfirmation();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Deletar Estratégia',
    description: 'Esta ação não pode ser desfeita',
    severity: 'critical',
    requireConfirmation: true,
    confirmationText: 'deletar',
  });

  if (confirmed) {
    // Perform deletion
  }
};

return (
  <>
    {Dialog}
    <button onClick={handleDelete}>Deletar</button>
  </>
);
```

## 5. Transparência de Risco

### Componente: `SecurityStatus`

Exibe:
- **Pontuação de Segurança** (0-100)
- **Status**: Crítico, Baixo, Médio, Alto
- **Status 2FA**: Ativado/Desativado
- **Recomendações**: Ações para melhorar segurança
- **Eventos Recentes**: Logins e atividades suspeitas

### Cálculo de Pontuação

- Base: 50 pontos
- 2FA ativado: +30 pontos
- Eventos críticos recentes: -20 pontos
- Muitas sessões ativas: -10 pontos

### Recomendações Automáticas

- "Ativar autenticação de dois fatores"
- "Revisar alertas de segurança recentes"
- "Revogar sessões não utilizadas"

## 6. Boas Práticas de Segurança

### Para Usuários

1. **Ativar 2FA**
   - Protege contra roubo de senha
   - Salve os códigos de backup em local seguro
   - Use um aplicativo confiável

2. **Gerenciar Sessões**
   - Revogue sessões de dispositivos não reconhecidos
   - Faça logout em dispositivos públicos
   - Monitore a atividade da conta

3. **Monitorar Auditoria**
   - Revise logs de login regularmente
   - Investigue atividades suspeitas
   - Altere senha se detectar acesso não autorizado

### Para Desenvolvedores

1. **Instrumentar Eventos**
   ```typescript
   // Sempre registre ações sensíveis
   await AuditService.logAudit(userId, 'strategy_deleted', 'strategy', strategyId);
   ```

2. **Validar Sessões**
   ```typescript
   // Valide sessão em cada requisição
   const { valid, userId } = await SessionService.validateSession(token);
   if (!valid) throw new Error('Invalid session');
   ```

3. **Usar Confirmação**
   ```typescript
   // Requeira confirmação para ações críticas
   const confirmed = await confirm({
     severity: 'critical',
     requireConfirmation: true,
   });
   ```

## 7. Eventos de Segurança

### Tipos de Eventos

| Tipo | Severidade | Descrição |
|------|-----------|-----------|
| login_success | low | Login bem-sucedido |
| login_failed | medium | Falha de login |
| login_2fa | low | 2FA verificado |
| suspicious_activity | high | Atividade suspeita detectada |
| password_changed | low | Senha alterada |
| 2fa_enabled | low | 2FA ativado |
| 2fa_disabled | medium | 2FA desativado |
| session_revoked | low | Sessão revogada |

## 8. Resposta a Incidentes

### Conta Comprometida

1. Altere a senha imediatamente
2. Ative 2FA se não estiver ativado
3. Revogue todas as sessões
4. Revise logs de auditoria
5. Contate suporte se necessário

### Atividade Suspeita

1. Revise a seção de Segurança
2. Verifique sessões ativas
3. Revogue sessões não reconhecidas
4. Altere a senha
5. Ative 2FA para proteção adicional

## 9. Conformidade e Privacidade

- Senhas são armazenadas com hash bcrypt
- Códigos de backup são armazenados com hash SHA-256
- Tokens de sessão são gerados com 256 bits de entropia
- Logs de auditoria incluem IP e User-Agent para rastreamento
- Dados de auditoria são retidos por 90 dias

## 10. Roadmap de Segurança

- [ ] Autenticação biométrica
- [ ] Detecção de anomalias com ML
- [ ] Integração com serviços de geolocalização
- [ ] Autenticação por WebAuthn/FIDO2
- [ ] Criptografia end-to-end para dados sensíveis
- [ ] Conformidade com GDPR/LGPD
- [ ] Auditoria externa de segurança

---

**Última atualização**: 2026-05-19  
**Versão**: 1.0
