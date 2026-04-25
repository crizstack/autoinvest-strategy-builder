# AutoInvest Strategy Builder — Especificação Técnica Completa

## 1. Visão Geral da Arquitetura

A plataforma AutoInvest Strategy Builder é uma aplicação SaaS full-stack para criação, simulação e execução de estratégias de investimento automatizadas no mercado brasileiro (B3). A arquitetura segue um padrão de três camadas: **Frontend (React)**, **Backend (tRPC + Express)**, **Banco de Dados (PostgreSQL)** e **Motor de Backtesting (Python)**.

### Stack Tecnológico

| Componente | Tecnologia | Justificativa |
| :--------- | :--------- | :------------ |
| **Frontend** | React 19 + Tailwind CSS 4 + TypeScript | Interface reativa, styling rápido, type-safety |
| **Backend** | Express.js + tRPC 11 | API type-safe, rápida de desenvolver, escalável |
| **Banco de Dados** | PostgreSQL + Drizzle ORM | Relacional robusto, suporta séries temporais, migrations versionadas |
| **Autenticação** | JWT + OAuth Manus | Segurança, integração com plataforma Manus |
| **Backtesting** | Python + Pandas/NumPy | Processamento de dados financeiros, performance |
| **Billing** | Stripe API | Pagamentos, gerenciamento de planos |
| **Deployment** | Manus Platform | Hosting gerenciado, escalabilidade automática |

---

## 2. Modelo de Dados (Banco de Dados)

### Tabelas Principais

#### 2.1 `users`
Usuários da plataforma com informações de autenticação e plano.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(320) UNIQUE NOT NULL,
  name VARCHAR(255),
  passwordHash VARCHAR(255),
  loginMethod VARCHAR(64) DEFAULT 'email', -- 'email', 'google', 'oauth'
  role ENUM('user', 'admin') DEFAULT 'user',
  planId INT REFERENCES plans(id),
  stripeCustomerId VARCHAR(255),
  subscriptionStatus ENUM('active', 'canceled', 'past_due', 'trial') DEFAULT 'trial',
  trialEndsAt TIMESTAMP,
  subscriptionEndsAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  lastSignedIn TIMESTAMP
);
```

#### 2.2 `plans`
Planos de assinatura (Free, Pro, Premium).

```sql
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'free', 'pro', 'premium'
  priceMonthly DECIMAL(10, 2),
  priceAnnual DECIMAL(10, 2),
  maxStrategies INT,
  backtestDaysLimit INT, -- -1 para ilimitado
  paperTradingEnabled BOOLEAN DEFAULT TRUE,
  realtimeDataEnabled BOOLEAN DEFAULT FALSE,
  liveExecutionEnabled BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 2.3 `strategies`
Estratégias criadas pelos usuários.

```sql
CREATE TABLE strategies (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asset VARCHAR(10) NOT NULL, -- ex: 'PETR4', 'VALE3'
  status ENUM('draft', 'active', 'paused', 'archived') DEFAULT 'draft',
  
  -- Definição visual do builder
  blocks JSONB NOT NULL, -- Estrutura dos blocos (trigger, condições, ações)
  connections JSONB NOT NULL, -- Conexões entre blocos
  
  -- Configurações de risco
  maxDrawdown DECIMAL(5, 2), -- % máximo de drawdown
  maxLossPerTrade DECIMAL(5, 2), -- % máximo de perda por operação
  riskPerTrade DECIMAL(5, 2), -- % de risco por operação
  
  -- Status de execução
  paperTradingActive BOOLEAN DEFAULT FALSE,
  liveExecutionActive BOOLEAN DEFAULT FALSE,
  
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 2.4 `backtests`
Resultados de backtesting de estratégias.

```sql
CREATE TABLE backtests (
  id SERIAL PRIMARY KEY,
  strategyId INT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Período do backtest
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  
  -- Resultados
  totalTrades INT,
  winningTrades INT,
  losingTrades INT,
  winRate DECIMAL(5, 2), -- %
  totalReturn DECIMAL(10, 2), -- %
  maxDrawdown DECIMAL(5, 2), -- %
  sharpeRatio DECIMAL(5, 2),
  profitFactor DECIMAL(5, 2),
  
  -- Detalhes
  initialCapital DECIMAL(15, 2) DEFAULT 10000.00,
  finalCapital DECIMAL(15, 2),
  
  -- Trades detalhados (JSON para flexibilidade)
  trades JSONB,
  
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT NOW(),
  completedAt TIMESTAMP
);
```

#### 2.5 `paperTrades`
Execuções simuladas (paper trading) em tempo real.

```sql
CREATE TABLE paperTrades (
  id SERIAL PRIMARY KEY,
  strategyId INT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Detalhes da operação
  asset VARCHAR(10) NOT NULL,
  type ENUM('buy', 'sell') NOT NULL,
  quantity INT NOT NULL,
  entryPrice DECIMAL(10, 2) NOT NULL,
  entryTime TIMESTAMP NOT NULL,
  
  -- Saída
  exitPrice DECIMAL(10, 2),
  exitTime TIMESTAMP,
  
  -- Resultado
  status ENUM('open', 'closed', 'canceled') DEFAULT 'open',
  profitLoss DECIMAL(15, 2),
  profitLossPercent DECIMAL(5, 2),
  
  -- Motivo
  entryReason VARCHAR(255),
  exitReason VARCHAR(255),
  
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 2.6 `portfolios`
Portfólio simulado do usuário (agregação de paper trades).

```sql
CREATE TABLE portfolios (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Saldo
  initialBalance DECIMAL(15, 2) DEFAULT 10000.00,
  currentBalance DECIMAL(15, 2),
  
  -- Métricas
  totalReturn DECIMAL(10, 2), -- %
  totalTrades INT DEFAULT 0,
  winningTrades INT DEFAULT 0,
  winRate DECIMAL(5, 2), -- %
  
  -- Posições abertas
  openPositions JSONB, -- Array de posições abertas
  
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 2.7 `assets`
Ativos da B3 com dados históricos.

```sql
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) UNIQUE NOT NULL, -- 'PETR4', 'VALE3'
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  lastUpdated TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 2.8 `assetPrices`
Série temporal de preços históricos (otimizado com TimescaleDB).

```sql
CREATE TABLE assetPrices (
  time TIMESTAMP NOT NULL,
  assetId INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  open DECIMAL(10, 4) NOT NULL,
  high DECIMAL(10, 4) NOT NULL,
  low DECIMAL(10, 4) NOT NULL,
  close DECIMAL(10, 4) NOT NULL,
  volume BIGINT NOT NULL,
  PRIMARY KEY (time, assetId)
);

-- Criar hypertable se usar TimescaleDB
-- SELECT create_hypertable('assetPrices', 'time', if_not_exists => TRUE);
```

#### 2.9 `transactions`
Histórico de transações e pagamentos.

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  userId INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripePaymentIntentId VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  type ENUM('subscription', 'refund', 'credit') NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 2.10 `auditLogs`
Logs de auditoria para conformidade regulatória.

```sql
CREATE TABLE auditLogs (
  id SERIAL PRIMARY KEY,
  userId INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL, -- 'strategy_created', 'backtest_run', etc
  resourceType VARCHAR(50), -- 'strategy', 'backtest', 'trade'
  resourceId INT,
  details JSONB,
  ipAddress VARCHAR(45),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## 3. Rotas da API (tRPC)

### 3.1 Autenticação (`auth.*`)

```typescript
// Registrar novo usuário
auth.register: publicProcedure
  .input({ email, password, name })
  .mutation()

// Login
auth.login: publicProcedure
  .input({ email, password })
  .mutation()

// Recuperar senha
auth.requestPasswordReset: publicProcedure
  .input({ email })
  .mutation()

// Resetar senha
auth.resetPassword: publicProcedure
  .input({ token, newPassword })
  .mutation()

// Obter usuário atual
auth.me: protectedProcedure.query()

// Logout
auth.logout: protectedProcedure.mutation()
```

### 3.2 Usuários (`users.*`)

```typescript
// Obter perfil
users.getProfile: protectedProcedure.query()

// Atualizar perfil
users.updateProfile: protectedProcedure
  .input({ name, email })
  .mutation()

// Obter plano atual
users.getCurrentPlan: protectedProcedure.query()

// Listar planos disponíveis
users.listPlans: publicProcedure.query()
```

### 3.3 Estratégias (`strategies.*`)

```typescript
// Listar estratégias do usuário
strategies.list: protectedProcedure
  .input({ status?, limit?, offset? })
  .query()

// Criar estratégia
strategies.create: protectedProcedure
  .input({ name, description, asset })
  .mutation()

// Obter estratégia detalhada
strategies.getById: protectedProcedure
  .input({ id })
  .query()

// Atualizar estratégia (blocos, conexões, configurações)
strategies.update: protectedProcedure
  .input({ id, blocks, connections, maxDrawdown, maxLossPerTrade })
  .mutation()

// Deletar estratégia
strategies.delete: protectedProcedure
  .input({ id })
  .mutation()

// Ativar/pausar estratégia
strategies.toggleStatus: protectedProcedure
  .input({ id, status })
  .mutation()

// Iniciar paper trading
strategies.startPaperTrading: protectedProcedure
  .input({ id })
  .mutation()

// Parar paper trading
strategies.stopPaperTrading: protectedProcedure
  .input({ id })
  .mutation()
```

### 3.4 Backtesting (`backtests.*`)

```typescript
// Executar backtest
backtests.run: protectedProcedure
  .input({ strategyId, startDate, endDate, initialCapital })
  .mutation()

// Obter resultado de backtest
backtests.getResult: protectedProcedure
  .input({ backtestId })
  .query()

// Listar backtests de uma estratégia
backtests.listByStrategy: protectedProcedure
  .input({ strategyId })
  .query()

// Exportar resultado de backtest (CSV/JSON)
backtests.export: protectedProcedure
  .input({ backtestId, format })
  .query()
```

### 3.5 Paper Trading (`paperTrades.*`)

```typescript
// Listar trades abertos
paperTrades.listOpen: protectedProcedure
  .input({ strategyId? })
  .query()

// Listar trades fechados (histórico)
paperTrades.listClosed: protectedProcedure
  .input({ strategyId?, limit?, offset? })
  .query()

// Obter detalhes de um trade
paperTrades.getById: protectedProcedure
  .input({ id })
  .query()

// Fechar trade manualmente
paperTrades.close: protectedProcedure
  .input({ id, exitPrice })
  .mutation()

// Cancelar trade
paperTrades.cancel: protectedProcedure
  .input({ id })
  .mutation()
```

### 3.6 Portfólio (`portfolio.*`)

```typescript
// Obter resumo do portfólio
portfolio.getSummary: protectedProcedure.query()

// Obter posições abertas
portfolio.getOpenPositions: protectedProcedure.query()

// Obter histórico de performance
portfolio.getPerformanceHistory: protectedProcedure
  .input({ period }) // 'day', 'week', 'month', 'year'
  .query()

// Resetar portfólio (apenas admin)
portfolio.reset: adminProcedure
  .input({ userId })
  .mutation()
```

### 3.7 Dados de Mercado (`market.*`)

```typescript
// Listar ativos disponíveis (B3)
market.listAssets: publicProcedure.query()

// Obter preços históricos de um ativo
market.getPriceHistory: publicProcedure
  .input({ symbol, startDate, endDate, interval })
  .query()

// Obter preço atual
market.getCurrentPrice: publicProcedure
  .input({ symbol })
  .query()

// Calcular indicadores (MA, RSI, MACD)
market.calculateIndicators: publicProcedure
  .input({ symbol, indicator, period })
  .query()
```

### 3.8 Billing (`billing.*`)

```typescript
// Obter Stripe Checkout Session
billing.createCheckoutSession: protectedProcedure
  .input({ planId, billingCycle })
  .mutation()

// Obter histórico de transações
billing.getTransactionHistory: protectedProcedure
  .input({ limit?, offset? })
  .query()

// Cancelar assinatura
billing.cancelSubscription: protectedProcedure.mutation()

// Atualizar método de pagamento
billing.updatePaymentMethod: protectedProcedure
  .input({ stripePaymentMethodId })
  .mutation()

// Webhook do Stripe (public, validado com signature)
billing.stripeWebhook: publicProcedure
  .input({ event })
  .mutation()
```

### 3.9 Admin (`admin.*`)

```typescript
// Dashboard admin
admin.getDashboard: adminProcedure.query()
  // Retorna: totalUsers, activeSubscriptions, monthlyRevenue, churn, errorLogs

// Listar usuários
admin.listUsers: adminProcedure
  .input({ limit?, offset? })
  .query()

// Promover usuário a admin
admin.promoteUser: adminProcedure
  .input({ userId })
  .mutation()

// Visualizar logs de auditoria
admin.getAuditLogs: adminProcedure
  .input({ limit?, offset? })
  .query()
```

---

## 4. Estrutura de Blocos do Builder Visual

O builder visual utiliza uma arquitetura baseada em blocos conectáveis. Cada bloco representa uma ação ou condição na estratégia.

### 4.1 Tipos de Blocos

```typescript
interface Block {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'risk';
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

// Trigger Block
interface TriggerBlock extends Block {
  type: 'trigger';
  config: {
    asset: string; // 'PETR4'
    timeframe: '1d' | '1h' | '15m'; // Timeframe
  };
}

// Condition Block
interface ConditionBlock extends Block {
  type: 'condition';
  config: {
    indicator: 'MA' | 'RSI' | 'MACD';
    period: number;
    operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
    value: number;
    logic?: 'AND' | 'OR'; // Para múltiplas condições
  };
}

// Action Block
interface ActionBlock extends Block {
  type: 'action';
  config: {
    action: 'buy' | 'sell';
    quantity: number | 'all'; // Número de ações ou 'all' para vender tudo
    type: 'market' | 'limit'; // Tipo de ordem
    limitPrice?: number; // Se type === 'limit'
  };
}

// Risk Block
interface RiskBlock extends Block {
  type: 'risk';
  config: {
    stopLoss: number; // % abaixo do preço de entrada
    takeProfit: number; // % acima do preço de entrada
    maxDrawdown: number; // % máximo de drawdown
    maxLossPerTrade: number; // % máximo de perda por operação
  };
}

// Connection
interface Connection {
  id: string;
  from: string; // Block ID
  to: string; // Block ID
  label?: string; // 'true', 'false', 'AND', 'OR'
}
```

### 4.2 Exemplo de Estratégia Simples

```json
{
  "blocks": [
    {
      "id": "trigger_1",
      "type": "trigger",
      "label": "PETR4 Diário",
      "config": { "asset": "PETR4", "timeframe": "1d" }
    },
    {
      "id": "condition_1",
      "type": "condition",
      "label": "MA(20) > MA(50)",
      "config": {
        "indicator": "MA",
        "period": 20,
        "operator": ">",
        "value": "MA(50)"
      }
    },
    {
      "id": "condition_2",
      "type": "condition",
      "label": "RSI < 70",
      "config": {
        "indicator": "RSI",
        "period": 14,
        "operator": "<",
        "value": 70
      }
    },
    {
      "id": "action_1",
      "type": "action",
      "label": "Comprar 100 ações",
      "config": { "action": "buy", "quantity": 100, "type": "market" }
    },
    {
      "id": "risk_1",
      "type": "risk",
      "label": "Stop Loss 5%, Take Profit 10%",
      "config": {
        "stopLoss": 5,
        "takeProfit": 10,
        "maxDrawdown": 20,
        "maxLossPerTrade": 2
      }
    }
  ],
  "connections": [
    { "id": "conn_1", "from": "trigger_1", "to": "condition_1" },
    { "id": "conn_2", "from": "condition_1", "to": "condition_2", "label": "AND" },
    { "id": "conn_3", "from": "condition_2", "to": "action_1", "label": "true" },
    { "id": "conn_4", "from": "action_1", "to": "risk_1" }
  ]
}
```

---

## 5. Motor de Backtesting

O motor de backtesting é implementado em Python e executado via fila de jobs (Bull Queue ou similar).

### 5.1 Fluxo de Backtesting

1. Usuário submete requisição de backtest via tRPC
2. Backend cria registro em `backtests` com status `pending`
3. Job é enfileirado para processamento
4. Python executa backtesting com dados históricos
5. Resultados são salvos em `backtests` e `assetPrices`
6. Frontend recebe notificação de conclusão

### 5.2 Saída do Backtesting

```json
{
  "backtestId": 123,
  "strategyId": 45,
  "period": { "startDate": "2023-01-01", "endDate": "2024-01-01" },
  "results": {
    "totalTrades": 52,
    "winningTrades": 31,
    "losingTrades": 21,
    "winRate": 59.6,
    "totalReturn": 28.5,
    "maxDrawdown": 12.3,
    "sharpeRatio": 1.8,
    "profitFactor": 2.1,
    "initialCapital": 10000,
    "finalCapital": 12850
  },
  "trades": [
    {
      "entryDate": "2023-01-15",
      "entryPrice": 25.50,
      "exitDate": "2023-01-20",
      "exitPrice": 26.80,
      "quantity": 100,
      "profitLoss": 130,
      "profitLossPercent": 5.1
    }
    // ... mais trades
  ]
}
```

---

## 6. Fluxo de Autenticação

### 6.1 Registro e Login

1. Usuário fornece email e senha
2. Senha é hasheada com bcrypt e armazenada
3. JWT é gerado e armazenado em cookie seguro
4. Sessão é criada com `ctx.user`

### 6.2 OAuth Manus

1. Usuário clica em "Login com Manus"
2. Redireciona para `/api/oauth/callback`
3. Token OAuth é validado
4. Usuário é criado ou atualizado em `users`
5. JWT é gerado

---

## 7. Estrutura de Pastas do Projeto

```
autoinvest-strategy-builder/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Dashboard.tsx       # Dashboard principal
│   │   │   ├── StrategyBuilder.tsx # Builder visual
│   │   │   ├── Backtest.tsx        # Resultados de backtest
│   │   │   ├── PaperTrading.tsx    # Paper trading
│   │   │   ├── Portfolio.tsx       # Portfólio
│   │   │   ├── Billing.tsx         # Planos e billing
│   │   │   ├── Admin.tsx           # Painel admin
│   │   │   └── Auth/
│   │   │       ├── Login.tsx
│   │   │       ├── Register.tsx
│   │   │       └── ResetPassword.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── StrategyBuilder/
│   │   │   │   ├── Canvas.tsx      # Área de desenho
│   │   │   │   ├── BlockPalette.tsx # Paleta de blocos
│   │   │   │   └── BlockEditor.tsx # Editor de blocos
│   │   │   ├── Charts/
│   │   │   │   ├── PerformanceChart.tsx
│   │   │   │   └── EquityCurve.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── lib/
│   │   │   ├── trpc.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
│
├── server/                          # Backend Express + tRPC
│   ├── routers/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── strategies.ts
│   │   ├── backtests.ts
│   │   ├── paperTrades.ts
│   │   ├── portfolio.ts
│   │   ├── market.ts
│   │   ├── billing.ts
│   │   └── admin.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── StrategyService.ts
│   │   ├── BacktestService.ts
│   │   ├── BillingService.ts
│   │   └── MarketDataService.ts
│   ├── jobs/
│   │   ├── BacktestJob.ts
│   │   ├── PaperTradingJob.ts
│   │   └── MarketDataJob.ts
│   ├── db.ts
│   ├── routers.ts
│   └── _core/
│       ├── index.ts
│       ├── context.ts
│       ├── trpc.ts
│       └── ...
│
├── drizzle/                         # Schema e migrations
│   ├── schema.ts
│   └── migrations/
│
├── python/                          # Motor de backtesting
│   ├── backtest_engine.py
│   ├── indicators.py
│   ├── data_loader.py
│   └── requirements.txt
│
├── shared/                          # Código compartilhado
│   ├── const.ts
│   └── types.ts
│
├── storage/                         # S3 helpers
│   └── index.ts
│
├── TECHNICAL_SPEC.md               # Este arquivo
├── TODO.md                         # Tarefas de desenvolvimento
├── package.json
└── tsconfig.json
```

---

## 8. Roadmap de Desenvolvimento

### Fase 1: Setup e Banco de Dados (Semana 1)
- [ ] Inicializar projeto com tRPC + Express
- [ ] Definir schema Drizzle
- [ ] Criar migrations
- [ ] Configurar autenticação JWT

### Fase 2: Backend Core (Semana 2-3)
- [ ] Implementar routers de autenticação
- [ ] Implementar routers de estratégias
- [ ] Implementar routers de backtesting
- [ ] Integrar motor de backtesting Python

### Fase 3: Frontend Base (Semana 3-4)
- [ ] Criar layout principal com sidebar
- [ ] Implementar autenticação no frontend
- [ ] Criar dashboard básico
- [ ] Implementar builder visual (versão 1)

### Fase 4: Paper Trading (Semana 4-5)
- [ ] Implementar engine de paper trading
- [ ] Criar UI de trades abertos/fechados
- [ ] Implementar portfólio

### Fase 5: Billing e Planos (Semana 5-6)
- [ ] Integrar Stripe
- [ ] Implementar checkout
- [ ] Criar painel de planos

### Fase 6: Landing Page e Admin (Semana 6-7)
- [ ] Criar landing page pública
- [ ] Implementar painel admin
- [ ] Adicionar logs de auditoria

### Fase 7: Testes e Deploy (Semana 7-8)
- [ ] Testes unitários e integração
- [ ] Testes de segurança
- [ ] Deploy em produção

---

## 9. Considerações de Segurança e Conformidade

### 9.1 Segurança

- Todas as senhas são hasheadas com bcrypt
- JWTs são armazenados em cookies HttpOnly, Secure, SameSite
- CORS configurado apenas para domínios autorizados
- Rate limiting em endpoints de autenticação
- Validação de entrada em todos os endpoints
- SQL injection prevenida com Drizzle ORM

### 9.2 Conformidade Regulatória (CVM)

- A plataforma é posicionada como **ferramenta de simulação e educação**, não como consultoria
- Todos os trades em paper trading são claramente marcados como "simulados"
- Termos de uso deixam claro que a plataforma não oferece recomendações de investimento
- Logs de auditoria rastreiam todas as ações do usuário
- Dados de usuários são protegidos com criptografia

---

## 10. Próximos Passos

1. Criar arquivo `TODO.md` com tarefas específicas
2. Inicializar repositório Git
3. Começar com Fase 1: Setup e Banco de Dados
4. Implementar schema Drizzle
5. Criar migrations
