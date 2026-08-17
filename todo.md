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
- [x] Página de visualização de logs

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
- [x] Testes para confirmação de ações


## Melhorias do Módulo Backtest

### Métricas Avançadas
- [x] Implementar cálculo de Sharpe Ratio - MetricsService.calculateSharpeRatio()
- [x] Implementar cálculo de Profit Factor - MetricsService.calculateProfitFactor()
- [x] Implementar cálculo de Drawdown Máximo - MetricsService.calculateMaxDrawdown()
- [x] Implementar cálculo de Win Rate - MetricsService.calculateWinRate()
- [x] Implementar cálculo de Fator de Recuperação - MetricsService.calculateRecoveryFactor()

### Comparações
- [x] Comparação entre múltiplas estratégias - StrategyComparison.tsx
- [x] Comparação com IBOV (índice de referência) - IBOVComparison.tsx
- [x] Tabela comparativa de métricas - StrategyComparison com ranking
- [x] Gráfico de performance relativa - IBOVComparison com LineChart

### Replay Histórico
- [x] Implementar replay passo a passo - BacktestReplay.tsx
- [x] Controles de play/pause/stop - Botões de controle
- [x] Visualização de operações em tempo real - Lista de trades
- [x] Timeline interativa - Progress bar com slider

### Gráficos Profissionais
- [x] Equity curve com Recharts - ProfessionalEquityCurve.tsx
- [x] Drawdown chart - Área chart no ProfessionalEquityCurve
- [x] Monthly returns heatmap - Bar chart de retornos mensais
- [x] Distribuição de retornos - Estatísticas em cards
- [x] Correlação com IBOV - IBOVComparison com cálculo

### Visual
- [x] Redesign da página de resultados - BacktestResults.tsx
- [x] Cards com métricas principais - Grid de 4 cards com gradientes
- [x] Tabela de operações melhorada - Tabela interativa com hover
- [x] Indicadores visuais de performance - Ícones e cores semantáticas
- [x] Exportar relatório em PDF

### Testes
- [x] Testes para cálculo de Sharpe Ratio (1 teste)
- [x] Testes para cálculo de Profit Factor (3 testes)
- [x] Testes para comparação de estratégias (1 teste)
- [x] Testes para todas as métricas (11 testes passando)


## Melhorias de Logs de Operações

### Estrutura de Dados
- [x] Criar interface TradeLog com motivo de entrada/saída - shared/types/tradeLog.ts
- [x] Adicionar campo de indicador acionado - IndicatorSignal interface
- [x] Adicionar timestamp de execução - entryTime/exitTime
- [x] Adicionar contexto de mercado (preço, volume) - TradeContext interface

### Serviço de Explicações
- [x] Criar TradeExplanationService - server/trades/tradeExplanationService.ts
- [x] Gerar explicações baseadas em indicadores - 12 indicadores suportados
- [x] Gerar explicações de saída - 5 tipos de saída
- [x] Suportar múltiplos indicadores - generateFullExplanation()

### Componentes
- [x] Componente TradeLogDetail com explicações - client/src/components/TradeLogDetail.tsx
- [x] Timeline de operações - Expandir/colapsar
- [x] Filtros por indicador/resultado - Em TradeHistory
- [x] Busca de operações - Campo de busca por símbolo

### Página de Histórico
- [x] Página de histórico de operações - client/src/pages/TradeHistory.tsx
- [x] Visualização detalhada de cada trade - TradeLogDetail expandido
- [x] Gráfico de performance por indicador - Insights section
- [x] Estatísticas por tipo de operação - Stats cards

### Testes
- [x] Testes para TradeExplanationService - 16 testes passando
- [x] Testes para geração de explicações - Todos os indicadores
- [x] Testes de componente TradeLog - Testes de integração


## Bug Fixes

- [x] Corrigir edição de triggers de preço no Strategy Builder - Sincronizar ConfigPanel com React Flow (StrategyBuilder.tsx + ConfigPanel.tsx)


## Paper Trading - Implementação Funcional

### Fase 1: Estrutura de Dados
- [x] Adicionar campos `stopLoss` e `takeProfit` ao schema paperTrades
- [x] Adicionar campos `lastPriceCheck` e `lastUnrealizedPnL` para tracking
- [x] Aplicar migração de schema com sucesso

### Fase 2: Execução Automática de Estratégias
- [x] Criar StrategyExecutorService com execução periódica
- [x] Implementar `executeActiveStrategies()` para rodar estratégias ativas
- [x] Integrar com StrategyExecutorV2 e dados de mercado
- [x] Abertura automática de trades com SL/TP calculados
- [x] Risk management automático (2% do portfolio por trade)
- [x] Strategy Execution Router com endpoints públicos
- [x] Integração ao appRouter

### Fase 3: Fechamento Automático (SL/TP)
- [x] Criar TradeMonitorService para monitoramento contínuo
- [x] Implementar verificação de Stop Loss
- [x] Implementar verificação de Take Profit
- [x] Fechamento automático quando SL/TP acionado
- [x] Cálculo de PnL não realizado
- [x] Trade Monitoring Router com endpoints
- [x] Logs estruturados de verificações

### Fase 4: Logs Operacionais
- [x] Criar TradeLoggerService com logs estruturados
- [x] Métodos para: open, close, update_pnl, sl_check, tp_check
- [x] Integração com PaperTradingEngine
- [x] Mensagens formatadas com timestamps
- [x] Logs em console (preparado para persistência futura)

### Fase 4b: PnL em Tempo Real
- [x] Criar RealtimePnLService com atualização contínua
- [x] Implementar getPositionPnLRealtime() para uma posição
- [x] Implementar getMultiplePositionsPnL() para múltiplas posições
- [x] Implementar getPortfolioPnLRealtime() para portfolio completo
- [x] Implementar getPnLChanges() para detectar mudanças
- [x] Adicionar endpoints ao paper-trading router
- [x] Integrar ao PaperTradingEngine

### Fase 5: Integração com Dashboard
- [x] Criar OpenPositionsWidget com atualização a cada 5 segundos
- [x] Integrar ao Dashboard com posições abertas em tempo real
- [x] Mostrar PnL não realizado por posição
- [x] Implementar fechamento manual de trades
- [x] Mostrar total de PnL do portfolio
- [x] Atualizar portfolio com PnL unrealized (via RealtimePnLService)
- [x] Mostrar histórico de operações (TradeHistoryWidget integrado ao Dashboard)
- [x] Integrar notificações de trades abertos/fechados (TradingNotificationService)
- [x] Atualizar gráficos com dados em tempo real (BalanceChart, ProfitabilityChart e PerformanceComparison usam dados reais do backend com refetch a cada minuto)

### Fase 5b: Notificações
- [x] Criar TradingNotificationService para eventos de trading
- [x] Notificar ao abrir trade (método notifyTradeOpened, integrado ao StrategyExecutorService)
- [x] Notificar ao fechar trade (método notifyTradeClosed, integrado ao paper-trading router)
- [x] Notificar ao acionamento de Stop Loss (método notifyStopLossHit, integrado ao TradeMonitorService)
- [x] Notificar ao acionamento de Take Profit (método notifyTakeProfitHit, integrado ao TradeMonitorService)
- [x] Notificar ao atingir metas de PnL (método notifyPnLMilestone)
- [x] Integrar com sistema de notificações existente (notifyOwner)
- [x] Integrar ao TradeMonitorService para notificar SL/TP automático

### Fase 6: Testes e Validação
- [x] Criar testes para StrategyExecutorService (6 testes)
- [x] Criar testes para TradeMonitorService (8 testes)
- [x] Criar testes para RealtimePnLService (12 testes)
- [x] Testes para TradeLoggerService (integrado em outros testes)
- [x] Testar fluxo completo de execução automática (267/267 testes passando)
- [x] Validar cálculos de SL/TP (testes de detecção de SL/TP)
- [x] Validar PnL em tempo real (testes de cálculo de PnL)


## Dashboard - Conectar aos Dados Reais

### Fase 1: Auditoria Completa
- [x] Auditoria completa de widgets (DASHBOARD_AUDIT.md criado)
- [x] Identificar dados mockados em HeatmapWidget
- [x] Identificar dados hardcoded em MarketTodayWidget
- [x] Identificar dados hardcoded em WatchlistWidget
- [x] Identificar fallbacks sintéticos em BalanceChart
- [x] Identificar fallbacks sintéticos em ProfitabilityChart
- [x] Identificar simulação de Ibovespa em PerformanceComparison

### Fase 2: KPI Cards
- [x] Remover fallback de 10000 no saldo
- [x] Adicionar refetch automático a cada 30 segundos
- [x] Adicionar loading states visuais em cada card
- [x] Mostrar "-" quando dados não disponíveis
- [x] Adicionar tratamento de erros com alert visual

### Fase 3: Gráficos
- [x] Remover série de 8 dias fake do BalanceChart
- [x] Remover 4 semanas zeradas do ProfitabilityChart
- [x] Adicionar empty states visuais em ambos
- [x] Adicionar loading states em ambos
- [x] Refetch automático a cada 30 segundos

### Fase 4: Widgets de Estratégias e Mercado
- [x] Remover Math.random() fake do HeatmapWidget
- [x] Remover 4 ativos hardcoded do MarketTodayWidget
- [x] Extrair ativos únicos dos trades do usuário
- [x] Adicionar empty states visuais
- [x] Refetch automático a cada 60 segundos

### Fase 5: Remover Mock Data
- [x] Remover simulação de Ibovespa em PerformanceComparison
- [x] Remover Math.random() para crescimento fake
- [x] Mostra apenas performance real do usuário
- [x] Adicionar nota sobre integração com dados reais
- [x] Refetch automático a cada 60 segundos

### Fase 6: Testes e Validação
- [x] Build sem erros (22.22s)
- [x] Testes passando (267/267)
- [x] Todos os widgets conectados ao backend
- [x] Refetch automático funcionando
- [x] Loading states visuais
- [x] Empty states inteligentes

### Status Final
- ✅ 10 widgets auditados
- ✅ 0 dados mockados
- ✅ 0 valores hardcoded
- ✅ 100% conectado ao backend
- ✅ Atualização automática em tempo real
- ✅ Build: 22.22s
- ✅ Testes: 267/267 passando

## Redesign Visual Joven Invest

- [x] Aplicar identidade visual Joven Invest preto + verde na camada global sem alterar funcionalidade
- [x] Atualizar layouts de navegação, sidebar e cabeçalho para a nova identidade
- [x] Revisar páginas públicas e autenticadas para remover predominância azul/roxa
- [x] Revisar dashboard, gráficos, widgets e estados financeiros com semântica visual consistente
- [x] Revisar Strategy Builder, formulários, tabelas, modais, dropdowns, tooltips e estados vazios
- [x] Validar contraste, responsividade, compilação e registrar as 5 falhas preexistentes da suíte de testes
- [x] Confirmar que nenhuma rota, API, regra de negócio, cálculo ou fluxo funcional foi alterado
