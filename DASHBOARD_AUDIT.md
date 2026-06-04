# Auditoria Completa do Dashboard - AutoInvest Strategy Builder

## 📊 Resumo Executivo

O dashboard contém **9 widgets** com uma mistura de componentes conectados ao backend e componentes com dados mockados/hardcoded. Abaixo está a análise detalhada de cada um.

---

## 🔍 Análise por Widget

### 1. **Dashboard.tsx - KPI Cards (Saldo, Retorno, Estratégias, Taxa de Acerto)**

**Status:** ✅ CONECTADO AO BACKEND

**Dados Utilizados:**
- `trpc.portfolio.getPortfolio` - Saldo atual e inicial
- `trpc.paperTrading.getTradeStats` - Taxa de acerto, total de trades, profit factor
- `trpc.strategies.list` - Estratégias ativas

**Cálculos:**
```typescript
const balance = Number(portfolio.currentBalance) || 10000;
const initialBalance = Number(portfolio.initialBalance) || 10000;
const totalReturn = ((balance - initialBalance) / initialBalance) * 100;
const activeStrategies = strategies.filter((s) => s.status === 'active').length;
```

**Problema:** Valores padrão (10000) se dados não chegarem - não há fallback visual adequado.

---

### 2. **BalanceChart.tsx - Gráfico de Evolução de Saldo**

**Status:** ✅ CONECTADO AO BACKEND (com fallback mockado)

**Dados Utilizados:**
- `trpc.portfolio.getPortfolio` - Saldo atual
- `trpc.paperTrading.getClosedTrades` - Histórico de trades fechados

**Lógica:**
- Ordena trades fechados por `exitTime`
- Acumula `profitLoss` para criar curva de saldo
- Mostra últimos 8 pontos

**Problema:** Se não houver trades, cria série sintética de 8 dias com saldo inicial (linha 50-61):
```typescript
if (chartData.length === 0) {
  chartData = Array.from({ length: 8 }, (_, i) => ({
    date: format(subDays(today, 7 - i), 'MMM dd'),
    balance: initialBalance,
  }));
}
```

**Impacto:** Gráfico mostra linha reta fake quando não há dados.

---

### 3. **ProfitabilityChart.tsx - Gráfico Semanal de Lucros/Perdas**

**Status:** ✅ CONECTADO AO BACKEND (com fallback mockado)

**Dados Utilizados:**
- `trpc.paperTrading.getClosedTrades` - Últimos 1000 trades

**Lógica:**
- Agrupa trades por semana
- Soma `profitLoss` positivos e negativos
- Mostra últimas 4 semanas

**Problema:** Se não houver trades, cria 4 semanas com valores zero (linha 55-63):
```typescript
if (weeklyData.length === 0) {
  weeklyData = Array.from({ length: 4 }, (_, i) => ({
    week: format(subWeeks(today, 3 - i), 'MMM dd'),
    profit: 0,
    loss: 0,
  }));
}
```

**Impacto:** Gráfico mostra barras zeradas quando não há dados.

---

### 4. **PerformanceComparison.tsx - Você vs Mercado (Ibovespa)**

**Status:** ✅ RECENTEMENTE CONECTADO AO BACKEND

**Dados Utilizados:**
- `trpc.paperTrading.getClosedTrades` - Histórico de trades
- `trpc.portfolio.getPortfolio` - Saldo inicial

**Lógica:**
- Calcula rentabilidade acumulada por dia (últimos 30 dias)
- Simula rentabilidade do Ibovespa com crescimento de ~0.5% ao dia

**Problema:** Ibovespa é SIMULADO, não real. Usa `Math.random()` para variar:
```typescript
marketCumulativeReturn += 0.5 + (Math.random() - 0.5) * 0.3;
```

**Impacto:** Comparação com benchmark não é real.

---

### 5. **OpenPositionsWidget.tsx - Posições Abertas em Tempo Real**

**Status:** ✅ CONECTADO AO BACKEND

**Dados Utilizados:**
- `trpc.paperTrading.getPortfolioPnLRealtime` - PnL de posições abertas
- `trpc.paperTrading.closePosition` - Fechamento manual

**Atualização:** A cada 5 segundos (refetchInterval: 5000)

**Funcionalidade:** ✅ Completa e operacional

---

### 6. **TradeHistoryWidget.tsx - Histórico de Operações**

**Status:** ✅ CONECTADO AO BACKEND

**Dados Utilizados:**
- `trpc.paperTrading.getClosedTrades` - Últimas 20 operações

**Funcionalidade:** ✅ Completa e operacional

---

### 7. **TopStrategiesWidget.tsx - Top 3 Estratégias**

**Status:** ✅ CONECTADO AO BACKEND

**Dados Utilizados:**
- `trpc.strategies.list` - Lista de estratégias
- `trpc.paperTrading.getClosedTrades` - Trades por estratégia

**Lógica:**
- Agrupa trades por `strategyId`
- Calcula P/L, count, wins por estratégia
- Ordena por retorno e mostra top 3

**Funcionalidade:** ✅ Completa e operacional

---

### 8. **HeatmapWidget.tsx - Heatmap de Ativos**

**Status:** ❌ COMPLETAMENTE MOCKADO

**Dados:**
```typescript
const data = [
  { symbol: 'PETR4', change: 2.5, volume: 1000000 },
  { symbol: 'VALE3', change: -1.2, volume: 800000 },
  { symbol: 'ITUB4', change: 0.8, volume: 600000 },
  { symbol: 'ABEV3', change: 1.5, volume: 500000 },
];
```

**Problema:** Array hardcoded, sem conexão com backend.

**Impacto:** Não reflete dados reais de mercado ou portfolio.

---

### 9. **MarketTodayWidget.tsx - Mercado Hoje**

**Status:** ❌ COMPLETAMENTE MOCKADO

**Dados:**
```typescript
const marketData = [
  { symbol: 'IBOV', name: 'Ibovespa', price: 135250, change: 1.2 },
  { symbol: 'PETR4', name: 'Petrobras', price: 28.50, change: 2.1 },
  { symbol: 'VALE3', name: 'Vale', price: 58.30, change: -0.8 },
  { symbol: 'ITUB4', name: 'Itaú', price: 32.15, change: 0.5 },
];
```

**Problema:** Array hardcoded, sem conexão com backend.

**Impacto:** Não reflete dados reais de mercado.

---

### 10. **WatchlistWidget.tsx - Watchlist**

**Status:** ❌ COMPLETAMENTE MOCKADO

**Dados:**
```typescript
const watchlistItems = [
  { symbol: 'PETR4', name: 'Petrobras', price: 28.50, change: 2.1 },
  { symbol: 'VALE3', name: 'Vale', price: 58.30, change: -0.8 },
  { symbol: 'ITUB4', name: 'Itaú', price: 32.15, change: 0.5 },
];
```

**Problema:** Array hardcoded, sem conexão com backend.

**Impacto:** Não reflete watchlist real do usuário.

---

## 📋 Resumo de Problemas

| Widget | Status | Problema | Prioridade |
|--------|--------|----------|-----------|
| KPI Cards | ✅ Conectado | Fallback 10000 | Baixa |
| BalanceChart | ✅ Conectado | Fallback sintético | Baixa |
| ProfitabilityChart | ✅ Conectado | Fallback sintético | Baixa |
| PerformanceComparison | ✅ Conectado | Ibovespa simulado | Alta |
| OpenPositionsWidget | ✅ Conectado | Nenhum | - |
| TradeHistoryWidget | ✅ Conectado | Nenhum | - |
| TopStrategiesWidget | ✅ Conectado | Nenhum | - |
| HeatmapWidget | ❌ Mockado | Dados hardcoded | Alta |
| MarketTodayWidget | ❌ Mockado | Dados hardcoded | Alta |
| WatchlistWidget | ❌ Mockado | Dados hardcoded | Alta |

---

## 🎯 Plano de Ação

### Fase 1: Conectar Dados Reais de Mercado
- Integrar API BRAPI para dados reais de Ibovespa e ativos
- Atualizar PerformanceComparison com dados reais
- Atualizar MarketTodayWidget com dados reais

### Fase 2: Conectar Watchlist
- Implementar endpoint `trpc.watchlist.getWatchlist`
- Conectar WatchlistWidget ao backend

### Fase 3: Conectar Heatmap
- Implementar endpoint `trpc.market.getHeatmap`
- Conectar HeatmapWidget ao backend

### Fase 4: Remover Fallbacks Sintéticos
- Remover fallback de 8 dias em BalanceChart
- Remover fallback de 4 semanas em ProfitabilityChart
- Implementar empty states reais

### Fase 5: Testes e Validação
- Testar todos os widgets com dados reais
- Validar atualização em tempo real
- Validar tratamento de erros

---

## 📊 Dados Disponíveis no Backend

### Portfolio
- `currentBalance` - Saldo atual
- `initialBalance` - Saldo inicial
- `totalReturn` - Retorno total

### Paper Trading
- `getTradeStats` - Estatísticas de trades (win rate, profit factor, etc)
- `getClosedTrades` - Histórico de trades fechados
- `getPortfolioPnLRealtime` - PnL em tempo real

### Estratégias
- `strategies.list` - Lista de estratégias
- `strategies.getById` - Detalhes de estratégia

### Faltando
- Dados de mercado em tempo real (Ibovespa, ativos)
- Watchlist do usuário
- Heatmap de ativos

---

## 🚀 Próximos Passos

1. **Integrar API BRAPI** para dados reais de mercado
2. **Criar endpoint de Watchlist** no backend
3. **Criar endpoint de Heatmap** no backend
4. **Remover todos os fallbacks sintéticos**
5. **Implementar empty states reais**
6. **Testar dashboard completo**
