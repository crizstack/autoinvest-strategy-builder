# AutoInvest Strategy Builder - TODO

## UX/UI Melhorias

### Onboarding & Tutorial
- [x] Sistema de onboarding inicial com steps (Onboarding.tsx)
- [x] Componente Onboarding.tsx com 2 presets (Dashboard, Builder)
- [x] Persistência de onboarding completado no localStorage
- [x] Componente GuidedTutorial.tsx com highlights interativos
- [x] 3 presets de tutorial (Dashboard, Builder, Market)

### Animações & Transições
- [x] Hover animations em botões e cards
- [x] Transições suaves entre páginas
- [x] Fade-in animations para conteúdo
- [x] Arquivo animations.css com 15+ animações
- [x] Componente LoadingSkeleton.tsx

### Estados Vazios
- [x] Estados vazios inteligentes em listas
- [x] Componente EmptyState.tsx
- [x] Mensagens contextualizadas por página (6 presets)
- [x] Ícones com emojis para estados vazios (6 presets com Ícones visuais)

### Modo Compacto
- [x] Hook useCompactMode com localStorage
- [x] Arquivo compact-mode.css com estilos
- [x] Toggle de modo compacto implementado em Settings
- [x] Pré-visualização de modo compacto em Settings

### Testes
- [x] Testes para componentes de onboarding (8 testes)
- [x] Testes para EmptyState (8 testes)
- [x] Testes para LoadingSkeleton (7 testes)

## Features Anteriores (Concluídas)
- [x] Link de Educação no sidebar
- [x] Melhorias no Assistente IA (8 novas capacidades)


## Melhorias de Segurança

### Autenticação 2FA
- [x] Implementar TOTP (Time-based One-Time Password) - twoFactorService.ts
- [x] Componente QR Code para setup - TwoFactorSetup.tsx
- [x] Backup codes para recuperação - geração e validação implementadas
- [x] Página de gerenciamento de 2FA em Settings - TwoFactorSetup.tsx

### Logs de Auditoria
- [x] Tabela audit_logs no banco - criada via migração
- [x] Registrar login/logout - AuditService.logAudit()
- [x] Registrar alterações de configurações - AuditService.logAudit()
- [x] Registrar ações sensíveis (trades, estratégias) - AuditService.logAudit()
- [ ] Página de visualização de logs

### Gerenciamento de Sessões
- [x] Tabela user_sessions no banco - criada via migração
- [x] Listar sessões ativas - SessionService.getActiveSessions()
- [x] Revogar sessões remotas - SessionService.revokeSession()
- [x] Detectar login suspeito (IP/localização) - SessionService.detectSuspiciousActivity()
- [x] Timeout automático de sessão - SessionService.cleanupExpiredSessions()

### Confirmação de Ações Sensíveis
- [x] Modal de confirmação para deletar estratégias - ConfirmationDialog.tsx
- [x] Modal de confirmação para deletar trades - ConfirmationDialog.tsx
- [x] Modal de confirmação para alterar 2FA - ConfirmationDialog.tsx
- [x] Modal de confirmação para logout de outras sessões - ConfirmationDialog.tsx

### Transparência de Risco
- [x] Indicador de força de senha - SecurityStatus.tsx
- [x] Aviso de atividade suspeita - SecurityStatus.tsx
- [x] Status de segurança da conta - SecurityStatus.tsx com score 0-100
- [x] Recomendações de segurança - AuditService.getSecurityScore()
- [x] Histórico de logins recentes - AuditService.getUserSecurityEvents()

### Testes
- [x] Testes para 2FA (3 testes passando)
- [x] Testes para logs de auditoria (3 testes passando)
- [x] Testes para gerenciamento de sessões (3 testes passando)
- [x] Testes de integração (3 testes passando)
- [x] Total: 12 testes passando
- [ ] Testes para confirmação de ações
