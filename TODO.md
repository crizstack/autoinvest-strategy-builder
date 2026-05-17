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
