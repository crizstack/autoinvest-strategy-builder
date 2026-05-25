# Análise Completa do Builder Visual

## 1. ESTRUTURA ATUAL

### 1.1 Tipos Definidos (`builder.ts`)
```typescript
BlockType: 'trigger' | 'indicator' | 'operator' | 'action' | 'risk'
TriggerType: 'price_above' | 'price_below' | 'ma_cross'
IndicatorType: 'rsi' | 'ma' | 'macd' | 'volume'
OperatorType: 'and' | 'or'
ActionType: 'buy' | 'sell' | 'close'
RiskType: 'stop_loss' | 'take_profit' | 'max_per_trade'
```

### 1.2 Estrutura de Dados

**BlockConfig (Frontend)**
```typescript
{
  id: string (UUID único)
  type: BlockType
  subType: TriggerType | IndicatorType | OperatorType | ActionType | RiskType
  label: string
  params: Record<string, any>
  position?: { x: number; y: number }
}
```

**StrategyDefinition (Frontend)**
```typescript
{
  id: string
  name: string
  description: string
  blocks: StrategyBlock[]
  connections: Array<{ source: string; target: string }>
  createdAt: Date
  updatedAt: Date
}
```

**Armazenamento no Banco (schema.ts)**
```typescript
strategies.blocks = json("blocks")        // Array de blocos
strategies.connections = json("connections") // Array de conexões
```

---

## 2. ESTADO ATUAL - O QUE FUNCIONA

### ✅ Funcionando
- **Criação de Blocos**: Drag-and-drop funciona
- **Conexões Visuais**: React Flow renderiza conexões
- **IDs Únicos**: Cada bloco tem `id: ${blockType}-${Date.now()}`
- **Validação Básica**: 
  - Exige Trigger
  - Exige Action
  - Detecta blocos desconectados
  - Exige ativo selecionado
- **Persistência Parcial**: Salva no banco (mas sem executar)
- **Importação de Templates**: Carrega templates pré-definidos
- **Parâmetros de Blocos**: Armazena params em JSON

### ❌ NÃO FUNCIONA
- **Execução Real**: Nenhum bloco é executado
- **Cálculo de Indicadores**: RSI, MACD, MA não são calculados
- **Lógica de Condições**: AND/OR não são avaliadas
- **Geração de Trades**: Nenhum trade é criado
- **Backtest**: Não há motor de backtest
- **Persistência Completa**: Blocos salvam, mas não há parser para executar
- **Leitura Sequencial**: Não há ordem de execução definida
- **Logs de Debug**: Sem rastreamento de execução

---

## 3. PROBLEMAS IDENTIFICADOS

### 3.1 Estrutura de Blocos Incompleta
- Faltam parâmetros obrigatórios para cada tipo
- Sem validação de parâmetros
- Sem schema de validação

### 3.2 Sem Parser de Estratégia
- Blocos salvam em JSON, mas não há código que os leia
- Sem interpretação da lógica
- Sem conversão para operações reais

### 3.3 Sem Motor de Execução
- Não há engine que execute a estratégia
- Não há cálculo de indicadores
- Não há geração de sinais de compra/venda

### 3.4 Sem Histórico de Execução
- Sem logs de quando a estratégia foi executada
- Sem rastreamento de erros
- Sem debug de fluxo

---

## 4. ESTRUTURA NECESSÁRIA

### 4.1 JSON Schema Padronizado

**Estratégia Completa**
```json
{
  "id": "strat-123",
  "name": "RSI + MACD",
  "asset": "PETR4",
  "blocks": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "subType": "price_above",
      "label": "Preço acima de 25",
      "params": {
        "value": 25.00,
        "timeframe": "1d"
      }
    },
    {
      "id": "indicator-1",
      "type": "indicator",
      "subType": "rsi",
      "label": "RSI < 30",
      "params": {
        "period": 14,
        "condition": "below",
        "value": 30
      }
    },
    {
      "id": "indicator-2",
      "type": "indicator",
      "subType": "macd",
      "label": "MACD Bullish",
      "params": {
        "fastPeriod": 12,
        "slowPeriod": 26,
        "signalPeriod": 9,
        "condition": "above_signal"
      }
    },
    {
      "id": "operator-1",
      "type": "operator",
      "subType": "and",
      "label": "E (AND)",
      "params": {}
    },
    {
      "id": "action-1",
      "type": "action",
      "subType": "buy",
      "label": "Comprar",
      "params": {
        "orderType": "market",
        "quantity": 100,
        "percentCapital": 10
      }
    },
    {
      "id": "risk-1",
      "type": "risk",
      "subType": "stop_loss",
      "label": "Stop Loss 2%",
      "params": {
        "percentage": 2.0
      }
    },
    {
      "id": "risk-2",
      "type": "risk",
      "subType": "take_profit",
      "label": "Take Profit 5%",
      "params": {
        "percentage": 5.0
      }
    }
  ],
  "connections": [
    { "source": "trigger-1", "target": "indicator-1" },
    { "source": "trigger-1", "target": "indicator-2" },
    { "source": "indicator-1", "target": "operator-1" },
    { "source": "indicator-2", "target": "operator-1" },
    { "source": "operator-1", "target": "action-1" },
    { "source": "action-1", "target": "risk-1" },
    { "source": "action-1", "target": "risk-2" }
  ]
}
```

---

## 5. IMPLEMENTAÇÃO NECESSÁRIA

### 5.1 Parser de Estratégia (Backend)
- Ler JSON da estratégia
- Validar estrutura
- Construir grafo de execução
- Ordenar blocos topologicamente

### 5.2 Motor de Execução (Backend)
- Executar blocos na ordem correta
- Calcular indicadores
- Avaliar condições
- Gerar sinais

### 5.3 Calculadores de Indicadores (Backend)
- RSI: Relative Strength Index
- MA: Média Móvel Simples/Exponencial
- MACD: Moving Average Convergence Divergence
- Volume: Análise de volume

### 5.4 Gerador de Trades (Backend)
- Converter sinais em operações
- Aplicar stop loss e take profit
- Registrar no banco

### 5.5 Sistema de Logs (Backend)
- Rastrear execução de cada bloco
- Registrar valores intermediários
- Registrar erros

---

## 6. CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Estrutura Padronizada
- [ ] Definir schema JSON final
- [ ] Criar validador de schema
- [ ] Adicionar parâmetros obrigatórios para cada tipo
- [ ] Criar tipos TypeScript correspondentes

### FASE 2: Parser de Estratégia
- [ ] Ler JSON do banco
- [ ] Validar estrutura
- [ ] Construir grafo
- [ ] Ordenar topologicamente

### FASE 3: Motor de Execução
- [ ] Implementar executor de blocos
- [ ] Implementar calculadores de indicadores
- [ ] Implementar avaliador de condições
- [ ] Implementar gerador de sinais

### FASE 4: Integração com Backtest
- [ ] Conectar motor ao backtest
- [ ] Gerar trades reais
- [ ] Calcular P&L

### FASE 5: Logs e Debug
- [ ] Adicionar sistema de logs
- [ ] Rastrear execução
- [ ] Registrar valores intermediários

---

## 7. PRÓXIMAS AÇÕES

1. **Revisar StrategyBuilder.tsx** para entender fluxo completo
2. **Criar parser de estratégia** no backend
3. **Implementar calculadores** de indicadores
4. **Criar motor de execução**
5. **Integrar com backtest**
