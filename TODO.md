# AutoInvest Strategy Builder — TODO List

## FASE 1: Setup e Banco de Dados

### Backend Setup
- [ ] Instalar dependências (NestJS/Express, Drizzle, PostgreSQL)
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Criar conexão com PostgreSQL
- [ ] Configurar Drizzle ORM

### Schema de Banco de Dados
- [ ] Criar tabela `users` com autenticação
- [ ] Criar tabela `plans` (Free, Pro, Premium)
- [ ] Criar tabela `strategies` com JSONB para blocos
- [ ] Criar tabela `backtests` com resultados
- [ ] Criar tabela `paperTrades` para simulação
- [ ] Criar tabela `portfolios` para agregação
- [ ] Criar tabela `assets` com ativos B3
- [ ] Criar tabela `assetPrices` com série temporal
- [ ] Criar tabela `transactions` para billing
- [ ] Criar tabela `auditLogs` para conformidade
- [ ] Gerar migrations com Drizzle Kit

### Autenticação
- [ ] Implementar hash de senha com bcrypt
- [ ] Implementar geração de JWT
- [ ] Implementar validação de JWT
- [ ] Configurar cookies HttpOnly, Secure, SameSite
- [ ] Implementar middleware de autenticação

---

## FASE 2: Backend Core

### Routers de Autenticação
- [ ] `auth.register` - Registrar novo usuário
- [ ] `auth.login` - Login com email/senha
- [ ] `auth.requestPasswordReset` - Solicitar reset de senha
- [ ] `auth.resetPassword` - Resetar senha com token
- [ ] `auth.me` - Obter usuário atual
- [ ] `auth.logout` - Logout

### Routers de Usuários
- [ ] `users.getProfile` - Obter perfil
- [ ] `users.updateProfile` - Atualizar perfil
- [ ] `users.getCurrentPlan` - Obter plano atual
- [ ] `users.listPlans` - Listar planos disponíveis

### Routers de Estratégias
- [ ] `strategies.list` - Listar estratégias do usuário
- [ ] `strategies.create` - Criar estratégia
- [ ] `strategies.getById` - Obter estratégia detalhada
- [ ] `strategies.update` - Atualizar blocos e configurações
- [ ] `strategies.delete` - Deletar estratégia
- [ ] `strategies.toggleStatus` - Ativar/pausar
- [ ] `strategies.startPaperTrading` - Iniciar simulação
- [ ] `strategies.stopPaperTrading` - Parar simulação

### Routers de Backtesting
- [ ] `backtests.run` - Executar backtest
- [ ] `backtests.getResult` - Obter resultado
- [ ] `backtests.listByStrategy` - Listar backtests
- [ ] `backtests.export` - Exportar resultado (CSV/JSON)

### Routers de Paper Trading
- [ ] `paperTrades.listOpen` - Listar trades abertos
- [ ] `paperTrades.listClosed` - Listar histórico
- [ ] `paperTrades.getById` - Obter detalhes
- [ ] `paperTrades.close` - Fechar trade manualmente
- [ ] `paperTrades.cancel` - Cancelar trade

### Routers de Portfólio
- [ ] `portfolio.getSummary` - Resumo do portfólio
- [ ] `portfolio.getOpenPositions` - Posições abertas
- [ ] `portfolio.getPerformanceHistory` - Histórico de performance

### Routers de Dados de Mercado
- [ ] `market.listAssets` - Listar ativos B3
- [ ] `market.getPriceHistory` - Obter preços históricos
- [ ] `market.getCurrentPrice` - Obter preço atual
- [ ] `market.calculateIndicators` - Calcular MA, RSI, MACD

### Motor de Backtesting (Python)
- [ ] Criar script Python para backtesting
- [ ] Implementar carregamento de dados históricos
- [ ] Implementar cálculo de indicadores (MA, RSI, MACD)
- [ ] Implementar execução de estratégia
- [ ] Implementar cálculo de métricas (Sharpe, Drawdown, etc)
- [ ] Integrar com fila de jobs (Bull Queue)

### Serviços
- [ ] AuthService - Lógica de autenticação
- [ ] StrategyService - Lógica de estratégias
- [ ] BacktestService - Orquestração de backtesting
- [ ] BillingService - Lógica de billing
- [ ] MarketDataService - Integração com dados de mercado

---

## FASE 3: Frontend Base

### Autenticação no Frontend
- [ ] Criar página de Login
- [ ] Criar página de Registro
- [ ] Criar página de Reset de Senha
- [ ] Implementar hook `useAuth()`
- [ ] Implementar proteção de rotas

### Layout Principal
- [ ] Criar DashboardLayout com sidebar
- [ ] Implementar navegação
- [ ] Implementar logout
- [ ] Implementar perfil do usuário

### Dashboard Principal
- [ ] Exibir saldo simulado
- [ ] Exibir rentabilidade %
- [ ] Exibir estratégias ativas
- [ ] Exibir últimas execuções
- [ ] Exibir performance por período (gráficos)

### Estética Blueprint
- [ ] Aplicar fundo azul royal escuro
- [ ] Adicionar grade fina sobreposta
- [ ] Implementar linhas brancas para molduras
- [ ] Usar tipografia sans-serif bold em branco
- [ ] Aplicar hierarquia visual limpa

---

## FASE 4: Builder Visual de Estratégias

### Componentes do Builder
- [ ] Criar Canvas para desenho
- [ ] Criar BlockPalette com blocos disponíveis
- [ ] Criar BlockEditor para editar configurações
- [ ] Implementar drag-and-drop de blocos
- [ ] Implementar conexões entre blocos

### Tipos de Blocos
- [ ] Trigger Block (ativo + timeframe)
- [ ] Condition Block (indicador + operador + valor)
- [ ] Action Block (buy/sell + quantidade)
- [ ] Risk Block (stop loss, take profit, drawdown)

### Funcionalidades
- [ ] Salvar estratégia com blocos
- [ ] Carregar estratégia existente
- [ ] Deletar blocos
- [ ] Editar configurações de blocos
- [ ] Validar lógica da estratégia

---

## FASE 5: Paper Trading e Backtesting

### Paper Trading
- [ ] Implementar engine de paper trading
- [ ] Executar estratégia em tempo real (simulado)
- [ ] Registrar trades abertos/fechados
- [ ] Calcular P&L por trade
- [ ] Atualizar portfólio em tempo real

### Backtesting
- [ ] Criar UI para executar backtest
- [ ] Exibir resultados (lucro, drawdown, taxa de acerto)
- [ ] Exibir lista de trades
- [ ] Exibir gráficos (equity curve, drawdown)
- [ ] Exportar resultados (CSV/JSON)

### Portfólio
- [ ] Exibir saldo atual
- [ ] Exibir posições abertas
- [ ] Exibir histórico de trades
- [ ] Exibir métricas (total return, win rate, etc)

---

## FASE 6: Billing e Planos SaaS

### Integração com Stripe
- [ ] Configurar conta Stripe
- [ ] Implementar checkout session
- [ ] Implementar webhook de pagamento
- [ ] Atualizar status de assinatura

### Planos
- [ ] Criar página de Planos
- [ ] Implementar seleção de plano
- [ ] Implementar upgrade de plano
- [ ] Implementar cancelamento de assinatura
- [ ] Exibir histórico de transações

### Limitações por Plano
- [ ] Free: até 2 estratégias, paper trading apenas
- [ ] Pro: estratégias ilimitadas, backtest completo
- [ ] Premium: execução real (futuro), dados em tempo real

---

## FASE 7: Landing Page e Admin

### Landing Page Pública
- [ ] Criar seção Hero
- [ ] Criar seção Benefícios
- [ ] Criar seção Como Funciona
- [ ] Criar seção Planos
- [ ] Criar seção FAQ
- [ ] Criar CTA final
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
- [ ] Validação de entrada em todos os endpoints
- [ ] Rate limiting
- [ ] CORS configurado
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
- Dados históricos B3 precisam ser carregados (fonte a definir)
