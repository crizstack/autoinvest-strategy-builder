# AutoInvest Strategy Builder — TODO List

## FASE 1: Setup e Banco de Dados

### Backend Setup
- [x] Instalar dependências (NestJS/Express, Drizzle, PostgreSQL)
- [x] Configurar variáveis de ambiente (.env)
- [x] Criar conexão com PostgreSQL
- [x] Configurar Drizzle ORM

### Schema de Banco de Dados
- [x] Criar tabela `users` com autenticação
- [x] Criar tabela `plans` (Free, Pro, Premium)
- [x] Criar tabela `strategies` com JSONB para blocos
- [x] Criar tabela `backtests` com resultados
- [x] Criar tabela `paperTrades` para simulação
- [x] Criar tabela `portfolios` para agregação
- [ ] Criar tabela `assets` com ativos B3
- [ ] Criar tabela `assetPrices` com série temporal
- [x] Criar tabela `transactions` para billing
- [ ] Criar tabela `auditLogs` para conformidade
- [x] Gerar migrations com Drizzle Kit

### Autenticação
- [x] Implementar hash de senha com bcrypt
- [x] Implementar geração de JWT
- [x] Implementar validação de JWT
- [x] Configurar cookies HttpOnly, Secure, SameSite
- [x] Implementar middleware de autenticação

---

## FASE 2: Backend Core

### Routers de Autenticação
- [x] `auth.register` - Registrar novo usuário
- [x] `auth.login` - Login com email/senha
- [ ] `auth.requestPasswordReset` - Solicitar reset de senha
- [ ] `auth.resetPassword` - Resetar senha com token
- [x] `auth.me` - Obter usuário atual
- [x] `auth.logout` - Logout

### Routers de Usuários
- [x] `users.getProfile` - Obter perfil
- [x] `users.updateProfile` - Atualizar perfil
- [x] `users.getCurrentPlan` - Obter plano atual
- [x] `users.listPlans` - Listar planos disponíveis

### Routers de Estratégias
- [x] `strategies.list` - Listar estratégias do usuário
- [x] `strategies.create` - Criar estratégia
- [x] `strategies.getById` - Obter estratégia detalhada
- [x] `strategies.update` - Atualizar blocos e configurações
- [x] `strategies.delete` - Deletar estratégia
- [x] `strategies.toggleStatus` - Ativar/pausar
- [ ] `strategies.startPaperTrading` - Iniciar simulação
- [ ] `strategies.stopPaperTrading` - Parar simulação

### Routers de Backtesting
- [x] `backtests.run` - Executar backtest (mock)
- [x] `backtests.getResult` - Obter resultado (mock)
- [x] `backtests.listByStrategy` - Listar backtests (mock)
- [ ] `backtests.export` - Exportar resultado (CSV/JSON)

### Routers de Paper Trading
- [x] `paperTrades.listOpen` - Listar trades abertos (mock)
- [x] `paperTrades.listClosed` - Listar histórico (mock)
- [x] `paperTrades.getById` - Obter detalhes (mock)
- [ ] `paperTrades.close` - Fechar trade manualmente
- [ ] `paperTrades.cancel` - Cancelar trade

### Routers de Portfólio
- [x] `portfolio.getSummary` - Resumo do portfólio (mock)
- [ ] `portfolio.getOpenPositions` - Posições abertas
- [ ] `portfolio.getPerformanceHistory` - Histórico de performance

### Routers de Dados de Mercado
- [x] `market.listAssets` - Listar ativos B3 (via BRAPI)
- [x] `market.getPriceHistory` - Obter preços históricos (via BRAPI)
- [x] `market.getCurrentPrice` - Obter preço atual (via BRAPI)
- [ ] `market.calculateIndicators` - Calcular MA, RSI, MACD

### Motor de Backtesting (Python)
- [ ] Criar script Python para backtesting
- [ ] Implementar carregamento de dados históricos
- [ ] Implementar cálculo de indicadores (MA, RSI, MACD)
- [ ] Implementar execução de estratégia
- [ ] Implementar cálculo de métricas (Sharpe, Drawdown, etc)
- [ ] Integrar com fila de jobs (Bull Queue)

### Serviços
- [x] AuthService - Lógica de autenticação
- [x] StrategyService - Lógica de estratégias
- [ ] BacktestService - Orquestração de backtesting
- [x] BillingService - Lógica de billing (mock)
- [x] MarketDataService - Integração com dados de mercado (BRAPI)

---

## FASE 3: Frontend Base

### Autenticação no Frontend
- [x] Criar página de Login
- [x] Criar página de Registro
- [ ] Criar página de Reset de Senha
- [x] Implementar hook `useAuth()`
- [x] Implementar proteção de rotas

### Layout Principal
- [x] Criar DashboardLayout com sidebar
- [x] Implementar navegação
- [x] Implementar logout
- [x] Implementar perfil do usuário

### Dashboard Principal
- [x] Exibir saldo simulado
- [x] Exibir rentabilidade %
- [x] Exibir estratégias ativas
- [x] Exibir últimas execuções
- [x] Exibir performance por período (gráficos)

### Estética Blueprint
- [x] Aplicar fundo verde escuro (Auto Invest)
- [x] Adicionar grade fina sobreposta
- [x] Implementar linhas brancas para molduras
- [x] Usar tipografia sans-serif bold em branco
- [x] Aplicar hierarquia visual limpa

---

## FASE 4: Builder Visual de Estratégias

### Componentes do Builder
- [x] Criar Canvas para desenho (React Flow)
- [x] Criar BlockPalette com blocos disponíveis
- [x] Criar BlockEditor para editar configurações
- [x] Implementar drag-and-drop de blocos
- [x] Implementar conexões entre blocos

### Tipos de Blocos
- [x] Trigger Block (ativo + timeframe)
- [x] Condition Block (indicador + operador + valor)
- [x] Action Block (buy/sell + quantidade)
- [x] Risk Block (stop loss, take profit, drawdown)

### Funcionalidades
- [x] Salvar estratégia com blocos
- [x] Carregar estratégia existente
- [x] Deletar blocos
- [x] Editar configurações de blocos
- [x] Validar lógica da estratégia

---

## FASE 5: Paper Trading e Backtesting

### Paper Trading
- [x] Implementar engine de paper trading (mock)
- [x] Executar estratégia em tempo real (simulado)
- [x] Registrar trades abertos/fechados (mock)
- [x] Calcular P&L por trade (mock)
- [x] Atualizar portfólio em tempo real (mock)

### Backtesting
- [x] Criar UI para executar backtest (mock)
- [x] Exibir resultados (lucro, drawdown, taxa de acerto) (mock)
- [x] Exibir lista de trades (mock)
- [x] Exibir gráficos (equity curve, drawdown) (mock)
- [ ] Exportar resultados (CSV/JSON)

### Portfólio
- [x] Exibir saldo atual (mock)
- [x] Exibir posições abertas (mock)
- [x] Exibir histórico de trades (mock)
- [x] Exibir métricas (total return, win rate, etc) (mock)

### Mercado (NOVO - Corrigido)
- [x] Página /mercado com lista de ativos B3 (BRAPI)
- [x] Página /mercado/:code com detalhe do ativo
- [x] Gráficos de preço (linha e volume)
- [x] Estatísticas de ativo
- [x] Botão para criar estratégia a partir do ativo
- [x] Busca e filtros de ativos
- [x] Top gainers/losers
- [x] Integração com BRAPI API
- [x] Cache local com TTL de 15 segundos
- [x] Hook useMarketData estabilizado (sem loops infinitos)
- [x] Testes para Market Data Service

---

## FASE 6: Billing e Planos SaaS

### Integração com Stripe
- [ ] Configurar conta Stripe
- [ ] Implementar checkout session
- [ ] Implementar webhook de pagamento
- [ ] Atualizar status de assinatura

### Planos
- [x] Criar página de Planos (mock)
- [x] Implementar seleção de plano (mock)
- [ ] Implementar upgrade de plano
- [ ] Implementar cancelamento de assinatura
- [x] Exibir histórico de transações (mock)

### Limitações por Plano
- [x] Free: até 2 estratégias, paper trading apenas (mock)
- [ ] Pro: estratégias ilimitadas, backtest completo
- [ ] Premium: execução real (futuro), dados em tempo real

---

## FASE 7: Landing Page e Admin

### Landing Page Pública
- [x] Criar seção Hero
- [x] Criar seção Benefícios
- [x] Criar seção Como Funciona
- [x] Criar seção Planos
- [x] Criar seção FAQ
- [x] Criar CTA final
- [ ] Implementar captura de leads

### Painel Admin
- [ ] Dashboard com métricas (usuários, receita, churn)
- [ ] Listar usuários
- [ ] Promover usuário a admin
- [ ] Visualizar logs de auditoria
- [ ] Visualizar erros do sistema

---

## FASE 8: Testes e Deploy

### Testes Unitários
- [x] Testes de Market Data Service
- [ ] Testes de autenticação
- [ ] Testes de estratégias
- [ ] Testes de backtesting
- [ ] Testes de billing

### Testes de Integração
- [ ] Testes de fluxo de registro
- [ ] Testes de fluxo de login
- [ ] Testes de criação de estratégia
- [ ] Testes de execução de backtest

### Segurança
- [x] Validação de entrada em todos os endpoints
- [ ] Rate limiting
- [x] CORS configurado
- [ ] Proteção contra XSS
- [ ] Proteção contra CSRF

### Deploy
- [ ] Configurar variáveis de ambiente de produção
- [ ] Deploy em Manus Platform
- [ ] Configurar domínio customizado
- [ ] Configurar SSL/TLS
- [ ] Monitoramento e logs

---

## FUNCIONALIDADES FUTURAS (Não incluir agora)

- [ ] Marketplace de estratégias
- [ ] Social trading
- [ ] IA e recomendações automatizadas
- [ ] Multi corretoras
- [ ] Mobile app nativo
- [ ] Execução real em corretoras
- [ ] Análise de sentimento
- [ ] Alertas avançados
- [ ] Webhooks customizados

---

## NOTAS

- Foco em MVP funcional e confiável
- Sem IA nesta fase
- Conformidade CVM: plataforma é ferramenta de simulação, não consultoria
- Estética blueprint profissional em toda a interface
- Dados históricos B3 precisam ser carregados (fonte: BRAPI)
- Módulo de Mercado corrigido: loops infinitos resolvidos, testes implementados


---

## FASE 4B: Builder Visual Refinado (NOVO)

### Seleção de Ativo
- [x] Campo obrigatório de seleção de ativo no topo
- [x] Lista de ativos B3 principais (PETR4, VALE3, etc)
- [x] Validação: não permitir salvar sem ativo
- [x] Feedback visual quando ativo selecionado

### Fluxo Estruturado
- [x] Guia visual inicial com instruções
- [x] Exemplo automático: "Preço acima de X → Comprar"
- [x] Validação de fluxo completo
- [x] Detecção de blocos desconectados

### Melhorias de UX
- [x] Ícones visuais para cada tipo de bloco (🔔 Trigger, 📊 Indicador, 🎯 Ação, 🛡️ Risco)
- [x] Handles melhorados (10px, com borda)
- [x] Seleção visual clara com glow effect
- [x] Painel de preview da estratégia
- [x] Resumo legível do fluxo
- [x] Composição visual (contagem de blocos)
- [x] Dicas contextuais

### Validação Forte
- [x] Validação de ativo obrigatório
- [x] Validação de trigger obrigatório
- [x] Validação de ação obrigatória
- [x] Detecção de blocos isolados
- [x] Mensagens de erro claras
- [x] Status "Pronto para salvar" quando válido

### Painel de Configuração
- [x] Campos bem organizados
- [x] Dicas de como usar cada bloco
- [x] Suporte a múltiplos tipos de blocos
- [x] Exibição de parâmetros configurados

### Testes
- [x] 18 testes passando para validação
- [x] Testes de tipos de blocos
- [x] Testes de parâmetros
- [x] Testes de fluxo de estratégia
- [x] Testes de seleção de ativo


---

## FASE 9: Assistente IA Integrado (NOVO)

### Arquitetura e Componentes
- [ ] Criar módulo /ai-assistant
- [ ] Componente ChatPanel (chat lateral moderno)
- [ ] Componente MessageBubble (mensagens animadas)
- [ ] Componente SuggestionChips (sugestões rápidas)
- [ ] AIService (integração com LLM)
- [ ] Ícone flutuante no canto inferior direito

### Chat Funcional
- [ ] Chat lateral com UI premium dark mode
- [ ] Mensagens animadas e typing indicator
- [ ] Histórico de conversa
- [ ] Botão limpar conversa
- [ ] Responsividade mobile

### Contexto Inteligente
- [ ] Detectar página atual (Builder, Backtest, Market, etc)
- [ ] Adaptar respostas ao contexto
- [ ] Armazenar contexto na sessão
- [ ] Passar contexto ao prompt system

### Educação Financeira
- [ ] Explicar RSI
- [ ] Explicar MACD
- [ ] Explicar Média Móvel
- [ ] Explicar Stop Loss
- [ ] Explicar Take Profit
- [ ] Explicar Gestão de Risco
- [ ] Explicar Candlestick
- [ ] Linguagem simples e acessível

### Ajuda da Plataforma
- [ ] Como criar estratégia
- [ ] Como usar builder
- [ ] Como funciona backtest
- [ ] Como funciona paper trading
- [ ] Como funciona billing
- [ ] Como usar módulo mercado

### Ajuda no Builder
- [ ] Passo a passo para criar estratégia
- [ ] Quais blocos usar
- [ ] Como conectar blocos
- [ ] Validação de estratégia

### Sugestões de Estratégias
- [ ] Estratégia RSI
- [ ] Cruzamento de médias
- [ ] Estratégia conservadora
- [ ] Estratégia agressiva
- [ ] Exemplos práticos

### Prompt System
- [ ] Atuar como educador financeiro
- [ ] Atuar como assistente da plataforma
- [ ] Nunca prometer ganhos
- [ ] Nunca recomendar compra direta
- [ ] Incluir aviso "Não é recomendação financeira"
- [ ] Respostas educacionais e seguras

### Sugestões Rápidas
- [ ] "Como criar estratégia?"
- [ ] "O que é RSI?"
- [ ] "Como funciona backtest?"
- [ ] "Explicar stop loss"
- [ ] Chips clicáveis dinâmicos

### Testes
- [ ] Testes de AIService
- [ ] Testes de contexto
- [ ] Testes de prompt system
- [ ] Testes de integração com LLM

### Funcionalidades Futuras (Preparar Arquitetura)
- [ ] Geração automática de estratégias
- [ ] Análise de performance
- [ ] Otimização de estratégias
- [ ] Insights inteligentes


### Assistente IA - CONCLUÍDO ✅

#### Arquitetura e Componentes
- [x] Criar módulo /ai-assistant
- [x] Componente ChatPanel (chat lateral moderno)
- [x] Componente MessageBubble (mensagens animadas)
- [x] Componente SuggestionChips (sugestões rápidas)
- [x] AIService (integração com LLM)
- [x] Ícone flutuante no canto inferior direito

#### Chat Funcional
- [x] Chat lateral com UI premium dark mode
- [x] Mensagens animadas e typing indicator
- [x] Histórico de conversa
- [x] Botão limpar conversa
- [x] Responsividade mobile

#### Contexto Inteligente
- [x] Detectar página atual (Builder, Backtest, Market, etc)
- [x] Adaptar respostas ao contexto
- [x] Armazenar contexto na sessão
- [x] Passar contexto ao prompt system

#### Educação Financeira
- [x] Explicar RSI
- [x] Explicar MACD
- [x] Explicar Média Móvel
- [x] Explicar Stop Loss
- [x] Explicar Take Profit
- [x] Explicar Gestão de Risco
- [x] Explicar Candlestick
- [x] Linguagem simples e acessível

#### Ajuda da Plataforma
- [x] Como criar estratégia
- [x] Como usar builder
- [x] Como funciona backtest
- [x] Como funciona paper trading
- [x] Como funciona billing
- [x] Como usar módulo mercado

#### Ajuda no Builder
- [x] Passo a passo para criar estratégia
- [x] Quais blocos usar
- [x] Como conectar blocos
- [x] Validação de estratégia

#### Sugestões de Estratégias
- [x] Estratégia RSI
- [x] Cruzamento de médias
- [x] Estratégia conservadora
- [x] Estratégia agressiva
- [x] Exemplos práticos

#### Prompt System
- [x] Atuar como educador financeiro
- [x] Atuar como assistente da plataforma
- [x] Nunca prometer ganhos
- [x] Nunca recomendar compra direta
- [x] Incluir aviso "Não é recomendação financeira"
- [x] Respostas educacionais e seguras

#### Sugestões Rápidas
- [x] "Como criar estratégia?"
- [x] "O que é RSI?"
- [x] "Como funciona backtest?"
- [x] "Explicar stop loss"
- [x] Chips clicáveis dinâmicos

#### Testes
- [x] 25 testes passando para AIService
- [x] Testes de contexto
- [x] Testes de prompt system
- [x] Testes de segurança (sem promessas de ganho)
- [x] Testes de educação financeira
- [x] Testes de sugestões por contexto

#### Integração
- [x] Router tRPC para chat IA
- [x] Integração com LLM backend
- [x] Ícone flutuante em todas as páginas
- [x] Chat acessível de qualquer lugar


### Assistente IA - Ajuste de Respostas Concisas (NOVO)

- [x] Modificar prompt system para enfatizar respostas curtas
- [x] Adicionar limite de 500 caracteres por resposta
- [x] Instruções claras: máximo 2-3 linhas
- [x] Usar bullets para organizar informações
- [x] Testes passando (25/25)
- [x] Validação de TypeScript (sem erros)


### Strategy Builder - Correções (NOVO)

- [x] Adicionar campo de condição (acima/abaixo) para blocos de preço
- [x] Adicionar campo de input para valor específico nos blocos de preço
- [x] Corrigir minimapa com cores por tipo de bloco
- [x] Adicionar background escuro ao minimapa
- [x] Adicionar border ao minimapa para visibilidade
- [x] Colorir blocos: Trigger (azul), Indicador (roxo), Ação (verde), Risco (vermelho)


### Dashboard - Transformação Premium (NOVO)

- [x] Criar componente BalanceChart (gráfico de evolução de saldo)
- [x] Criar componente ProfitabilityChart (ganhos vs perdas semanal)
- [x] Criar componente PerformanceComparison (usuário vs mercado)
- [x] Criar componente HeatmapWidget (heatmap semanal)
- [x] Criar componente TopStrategiesWidget (top 3 estratégias)
- [x] Criar componente MarketTodayWidget (principais ativos B3)
- [x] Refatorar Dashboard.tsx com novo layout profissional
- [x] Adicionar métricas: Taxa de Acerto, Rentabilidade, Estratégias Ativas
- [x] Implementar visual dark mode estilo TradingView
- [x] Adicionar hover effects e transições suaves
- [x] Integrar Recharts para gráficos interativos


### Sistema de Watchlist (NOVO)

- [x] Criar schema de watchlist no banco de dados
- [x] Implementar tRPC procedures (getAll, add, remove, updateNotes, isInWatchlist)
- [x] Criar componente WatchlistWidget para Dashboard
- [x] Criar página Watchlist completa
- [x] Integrar widget no Dashboard
- [x] Adicionar rota /watchlist em App.tsx
- [x] Implementar modal de adição de ativos
- [x] Implementar busca de ativos
- [x] Implementar remoção de ativos
- [x] Mock de preços em tempo real


### Correção de Bugs - Watchlist

- [x] Diagnosticar erro ao selecionar ativos
- [x] Popular tabela assets com dados B3
- [x] Criar procedure getAllAssets no router
- [x] Corrigir Watchlist.tsx para buscar assets do servidor
- [x] Implementar useEffect para sincronizar disponíveis


### Templates de Estratégias (NOVO)

- [ ] Criar tipos e estrutura de templates
- [ ] Definir 4 templates (RSI Oversold, Cruzamento de Médias, Tendência, Scalping)
- [ ] Criar componente TemplateModal
- [ ] Criar componente TemplateGallery
- [ ] Integrar templates no StrategyBuilder
- [ ] Implementar lógica de import com 1 clique
- [ ] Permitir edição após importação


### Templates de Estratégias - COMPLETO

- [x] Criar tipos e estrutura de templates
- [x] Definir 4 templates (RSI Oversold, Cruzamento de Médias, Tendência, Scalping)
- [x] Criar componente TemplateModal
- [x] Criar componente TemplateGallery
- [x] Integrar templates no StrategyBuilder
- [x] Implementar lógica de import com 1 clique
- [x] Permitir edição após importação


### Sistema de Alertas (NOVO)

- [ ] Criar tipos e schema de alertas
- [ ] Implementar tRPC procedures para alertas
- [ ] Criar componente NotificationCenter
- [ ] Criar componente AlertToast
- [ ] Criar hook useNotifications
- [ ] Integrar alertas em todas as páginas
- [ ] Implementar testes


### Sistema de Alertas - COMPLETO

- [x] Criar tipos e schema de alertas
- [x] Implementar tRPC procedures para alertas (getAll, getUnreadCount, markAsRead, markAllAsRead, create, delete, deleteAll)
- [x] Criar componente NotificationCenter com painel lateral
- [x] Criar hook useNotifications com helpers (notifyExecution, notifyRisk, notifyMarket, notifySystem)
- [x] Integrar NotificationCenter em DashboardLayout
- [x] Adicionar botão de notificações no header
- [x] Implementar 11 testes passando
- [x] Suporte para 4 tipos de alertas (execution, risk, market, system)
- [x] Suporte para 4 níveis de severidade (info, warning, error, success)
