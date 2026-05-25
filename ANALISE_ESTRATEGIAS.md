# 📋 ANÁLISE COMPLETA DA ESTRUTURA DE ESTRATÉGIAS

## 1. COMO ESTRATÉGIAS SÃO ARMAZENADAS

### Schema do Banco (drizzle/schema.ts)
```sql
strategies {
  id: int (PK)
  userId: int (FK)
  name: varchar
  description: text
  asset: varchar (ex: "PETR4")
  status: enum (draft, active, paused, archived)
  blocks: json ← ARMAZENA BLOCOS
  connections: json ← ARMAZENA CONEXÕES
  maxDrawdown: decimal
  maxLossPerTrade: decimal
  riskPerTrade: decimal
  paperTradingActive: boolean
  liveExecutionActive: boolean
}
```

### Problema Crítico #1: Salvar não persiste blocos
**Arquivo**: `client/src/pages/StrategyBuilder.tsx` (linhas 180-201)

```typescript
// ERRADO - Não envia nodes/edges!
await trpc.strategies.create.mutate({
  name: strategyName,
  asset: selectedAsset,
  description: strategyDescription,
  // ❌ nodes e edges não são enviados!
})
```

**Resultado**: Blocos e conexões criadas no Builder Visual são PERDIDAS ao salvar!

### Problema Crítico #2: Formato inconsistente
- **Frontend** salva: `{ nodes, edges, selectedNode, ... }` (Zustand store)
- **Backend** espera: `{ blocks: json, connections: json }`
- **Mismatch**: Tipos não correspondem

---

## 2. BLOCOS DISPONÍVEIS

### Tipos de Blocos Definidos (client/src/types/builder.ts)

| Tipo | SubTipos | Status |
|------|----------|--------|
| **trigger** | price_above, price_below, ma_cross | ✅ Definido |
| **indicator** | rsi, ma, macd, volume | ✅ Definido |
| **operator** | and, or | ✅ Definido |
| **action** | buy, sell, close | ✅ Definido |
| **risk** | stop_loss, take_profit, max_per_trade | ✅ Definido |

### Problema: Falta de Parametrização
- RSI: Apenas `period`, `condition`, `value`
- MA: Sem suporte a SMA vs EMA
- MACD: Sem parâmetros de linha de sinal
- Volume: Sem comparação com volume anterior

---

## 3. CONEXÕES EXISTENTES

### Formato Armazenado
```json
{
  "connections": [
    { "source": "block-1", "target": "block-2" },
    { "source": "block-2", "target": "block-3" }
  ]
}
```

### Problema: Sem Validação Semântica
- ❌ Não valida se conexão é legítima (ex: trigger → action)
- ❌ Não detecta ciclos
- ❌ Não valida múltiplas entradas em operadores AND/OR
- ❌ Permite conexões inválidas (ex: action → trigger)

---

## 4. INDICADORES IMPLEMENTADOS

### RSI (server/strategy/executor.ts)
```typescript
calculateRSI(closes: number[], period: number): number
// ✅ Implementado corretamente
// Calcula ganhos/perdas médias e retorna valor 0-100
```

### Média Móvel (SMA/EMA)
```typescript
calculateSMA(closes: number[], period: number): number
calculateEMA(closes: number[], period: number): number
// ✅ Ambas implementadas
```

### MACD
```typescript
calculateMACD(closes: number[]): { macd, signal, histogram }
// ✅ Implementado com períodos fixos (12, 26, 9)
// ❌ Sem suporte a customização de períodos
```

### Volume
```typescript
calculateVolume(volumes: number[]): number
// ✅ Retorna volume médio
// ❌ Sem comparação com volume anterior
```

---

## 5. PROBLEMAS CRÍTICOS ENCONTRADOS

### 🔴 P1: Persistência Quebrada
- Blocos criados no Builder não são salvos no banco
- Conexões não são persistidas
- Ao recarregar, estratégia volta vazia

### 🔴 P2: Formato Inconsistente
- Frontend usa `nodes` e `edges` (React Flow)
- Backend espera `blocks` e `connections`
- Sem conversor entre formatos

### 🔴 P3: Sem Validação de Grafo
- Ciclos não são detectados
- Conexões inválidas são aceitas
- Operadores AND/OR sem validação de arity

### 🔴 P4: Execução Simplista
- Apenas primeiro bloco de ação é executado
- AND/OR avaliam todos os blocos, não apenas predecessores
- Sem suporte a múltiplas ações paralelas

### 🔴 P5: Dados Mock
- Candles são gerados aleatoriamente
- Sem integração com dados reais
- Backtest não reflete realidade

---

## 6. ARQUITETURA NECESSÁRIA

```
┌─────────────────────────────────────────────────────┐
│ Frontend: StrategyBuilder.tsx (React Flow)          │
│ - Edita nodes e edges visualmente                   │
│ - Salva em Zustand store                            │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ Conversor: Builder → ExecutableStrategy             │
│ - Transforma nodes/edges em JSON executável         │
│ - Valida grafo (ciclos, tipos)                      │
│ - Retorna erros semânticos                          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ Persistência: Salva em banco                        │
│ - strategies.blocks = JSON executável               │
│ - strategies.connections = array de conexões        │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ Parser: Reconstrói grafo de execução                │
│ - Lê JSON do banco                                  │
│ - Constrói grafo topológico                         │
│ - Detecta ordem de execução                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ Executor: Processa candle por candle                │
│ - Calcula indicadores                              │
│ - Avalia condições                                 │
│ - Gera sinais de compra/venda                      │
│ - Respeita AND/OR                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ Backtest: Simula operações                          │
│ - Aplica sinais em dados históricos                 │
│ - Calcula P&L real                                 │
│ - Gera métricas (Sharpe, Drawdown, etc)            │
└─────────────────────────────────────────────────────┘
```

---

## 7. PLANO DE IMPLEMENTAÇÃO

### FASE 1: Persistência (CRÍTICA)
1. ✅ Converter nodes/edges → ExecutableStrategy JSON
2. ✅ Salvar JSON no banco (strategy.blocks)
3. ✅ Carregar e reconstruir no Builder

### FASE 2: Validação
1. ✅ Detectar ciclos no grafo
2. ✅ Validar tipos de conexões
3. ✅ Validar arity de operadores

### FASE 3: Execução Real
1. ✅ Parser de estratégia
2. ✅ Executor candle-por-candle
3. ✅ Suporte a múltiplas ações

### FASE 4: Dados Reais
1. ✅ Integrar API de mercado (B3, Alpha Vantage)
2. ✅ Substituir mock candles
3. ✅ Backtest com dados reais

---

## 8. RESUMO

| Aspecto | Status | Problema |
|---------|--------|----------|
| Blocos definidos | ✅ | Faltam parâmetros avançados |
| Conexões | ✅ | Sem validação semântica |
| Indicadores | ✅ | Sem customização |
| Persistência | ❌ | **NÃO FUNCIONA** |
| Validação | ⚠️ | Incompleta |
| Execução | ⚠️ | Simplista |
| Dados | ❌ | 100% mock |

**Prioridade**: Corrigir persistência ANTES de qualquer outra coisa.
