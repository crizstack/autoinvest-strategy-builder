/**
 * Market Data Manager
 * Gerencia múltiplos providers com fallback automático
 */

import type {
  IMarketDataProvider,
  Candle,
  Quote,
  Timeframe,
  ProviderHealthStatus,
  ManagerConfig,
} from './types';

export class MarketDataManager {
  private providers: Map<string, IMarketDataProvider> = new Map();
  private config: ManagerConfig;
  private healthStatus: Map<string, ProviderHealthStatus> = new Map();
  private lastHealthCheck: number = 0;

  constructor(config: ManagerConfig) {
    this.config = config;
  }

  /**
   * Registrar um provider
   */
  registerProvider(provider: IMarketDataProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`[MarketManager] Provider registrado: ${provider.name}`);
  }

  /**
   * Obter providers ordenados por prioridade
   */
  private getActiveProviders(): IMarketDataProvider[] {
    const providerConfigs = this.config.providers
      .filter(c => c.enabled)
      .sort((a, b) => a.priority - b.priority);

    return providerConfigs
      .map(config => this.providers.get(config.name))
      .filter((p): p is IMarketDataProvider => p !== undefined);
  }

  /**
   * Obter cotação com fallback
   */
  async getQuote(symbol: string): Promise<Quote | null> {
    const providers = this.getActiveProviders();

    for (const provider of providers) {
      try {
        const quote = await provider.getQuote(symbol);
        if (quote) {
          console.log(`[MarketManager] Quote obtida de ${provider.name}: ${symbol}`);
          return quote;
        }
      } catch (error) {
        console.warn(
          `[MarketManager] Erro ao obter quote de ${provider.name}:`,
          error
        );
        continue;
      }
    }

    console.error(`[MarketManager] Falha ao obter quote de ${symbol} de todos os providers`);
    return null;
  }

  /**
   * Obter candles com fallback
   */
  async getCandles(
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date
  ): Promise<Candle[]> {
    const providers = this.getActiveProviders();

    for (const provider of providers) {
      try {
        const candles = await provider.getCandles(
          symbol,
          timeframe,
          startDate,
          endDate
        );
        if (candles.length > 0) {
          console.log(
            `[MarketManager] ${candles.length} candles obtidos de ${provider.name}: ${symbol} ${timeframe}`
          );
          return candles;
        }
      } catch (error) {
        console.warn(
          `[MarketManager] Erro ao obter candles de ${provider.name}:`,
          error
        );
        continue;
      }
    }

    console.error(
      `[MarketManager] Falha ao obter candles de ${symbol} ${timeframe} de todos os providers`
    );
    return [];
  }

  /**
   * Obter candles recentes com fallback
   */
  async getRecentCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number
  ): Promise<Candle[]> {
    const providers = this.getActiveProviders();

    for (const provider of providers) {
      try {
        const candles = await provider.getRecentCandles(symbol, timeframe, limit);
        if (candles.length > 0) {
          console.log(
            `[MarketManager] ${candles.length} candles recentes obtidos de ${provider.name}: ${symbol} ${timeframe}`
          );
          return candles;
        }
      } catch (error) {
        console.warn(
          `[MarketManager] Erro ao obter candles recentes de ${provider.name}:`,
          error
        );
        continue;
      }
    }

    console.error(
      `[MarketManager] Falha ao obter candles recentes de ${symbol} ${timeframe} de todos os providers`
    );
    return [];
  }

  /**
   * Verificar saúde de todos os providers
   */
  async checkHealth(): Promise<Map<string, ProviderHealthStatus>> {
    console.log('[MarketManager] Iniciando health check...');

    const providers = Array.from(this.providers.values());
    const results = new Map<string, ProviderHealthStatus>();

    for (const provider of providers) {
      try {
        const status = await provider.healthCheck();
        results.set(provider.name, status);
        this.healthStatus.set(provider.name, status);

        console.log(
          `[MarketManager] ${provider.name}: ${status.status} (${status.responseTime}ms)`
        );
      } catch (error) {
        console.error(`[MarketManager] Erro ao verificar saúde de ${provider.name}:`, error);

        const failedStatus: ProviderHealthStatus = {
          provider: provider.name,
          status: 'down',
          lastCheck: new Date(),
          errorCount: (this.healthStatus.get(provider.name)?.errorCount ?? 0) + 1,
          lastError: String(error),
        };

        results.set(provider.name, failedStatus);
        this.healthStatus.set(provider.name, failedStatus);
      }
    }

    this.lastHealthCheck = Date.now();
    return results;
  }

  /**
   * Obter status de saúde
   */
  getHealthStatus(): Map<string, ProviderHealthStatus> {
    return this.healthStatus;
  }

  /**
   * Obter status de um provider específico
   */
  getProviderStatus(providerName: string): ProviderHealthStatus | undefined {
    return this.healthStatus.get(providerName);
  }

  /**
   * Verificar se há algum provider saudável
   */
  hasHealthyProvider(): boolean {
    for (const status of this.healthStatus.values()) {
      if (status.status === 'healthy') {
        return true;
      }
    }
    return false;
  }

  /**
   * Obter providers saudáveis
   */
  getHealthyProviders(): string[] {
    const healthy: string[] = [];
    for (const [name, status] of this.healthStatus.entries()) {
      if (status.status === 'healthy' || status.status === 'degraded') {
        healthy.push(name);
      }
    }
    return healthy;
  }

  /**
   * Limpar cache de todos os providers
   */
  clearAllCaches(): void {
    for (const provider of this.providers.values()) {
      provider.clearCache();
    }
    console.log('[MarketManager] Cache de todos os providers limpo');
  }

  /**
   * Limpar cache de um provider específico
   */
  clearProviderCache(providerName: string, symbol?: string): void {
    const provider = this.providers.get(providerName);
    if (provider) {
      provider.clearCache(symbol);
      console.log(
        `[MarketManager] Cache de ${providerName}${symbol ? ` (${symbol})` : ''} limpo`
      );
    }
  }

  /**
   * Obter informações dos providers
   */
  getProvidersInfo(): Array<{
    name: string;
    enabled: boolean;
    priority: number;
    status: string;
  }> {
    return this.config.providers.map(config => ({
      name: config.name,
      enabled: config.enabled,
      priority: config.priority,
      status: this.healthStatus.get(config.name)?.status ?? 'unknown',
    }));
  }
}

// Singleton instance
let managerInstance: MarketDataManager | null = null;

/**
 * Obter instância do Market Data Manager
 */
export function getMarketManager(): MarketDataManager {
  if (!managerInstance) {
    const config: ManagerConfig = {
      providers: [
        {
          name: 'brapi',
          enabled: true,
          priority: 1,
          rateLimit: {
            requestsPerSecond: 10,
            requestsPerDay: 10000,
          },
          cache: {
            ttl: 5 * 60 * 1000, // 5 minutes
            maxSize: 100 * 1024 * 1024, // 100 MB
          },
          timeframes: ['1D'],
        },
      ],
      fallbackEnabled: true,
      cacheEnabled: true,
      validationEnabled: true,
      healthCheckInterval: 5 * 60 * 1000, // 5 minutes
    };

    managerInstance = new MarketDataManager(config);
  }

  return managerInstance;
}

/**
 * Inicializar Market Data Manager com providers
 */
export function initializeMarketManager(providers: IMarketDataProvider[]): MarketDataManager {
  const manager = getMarketManager();

  for (const provider of providers) {
    manager.registerProvider(provider);
  }

  // Iniciar health check periódico
  setInterval(async () => {
    await manager.checkHealth();
  }, 5 * 60 * 1000); // 5 minutes

  return manager;
}
