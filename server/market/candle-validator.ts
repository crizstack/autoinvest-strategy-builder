/**
 * Candle Validator
 * Valida candles e detecta anomalias
 */

import type { Candle, CandleValidation } from './types';

interface ValidationOptions {
  maxGapPercent?: number; // 5% default
  outlierThreshold?: number; // 3 sigma default
  checkOHLC?: boolean;
  checkGaps?: boolean;
  checkOutliers?: boolean;
}

/**
 * Validar um candle individual
 */
export function validateCandle(
  candle: Candle,
  options: ValidationOptions = {}
): CandleValidation {
  const {
    checkOHLC = true,
    checkGaps = false,
    checkOutliers = false,
  } = options;

  const errors: string[] = [];
  let hasGap = false;
  let isOutlier = false;

  // 1. Validar OHLC
  if (checkOHLC) {
    if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
      errors.push('OHLC contém valores inválidos (≤ 0)');
    }

    if (candle.high < candle.low) {
      errors.push(`High (${candle.high}) < Low (${candle.low})`);
    }

    if (candle.high < candle.open || candle.high < candle.close) {
      errors.push(`High (${candle.high}) < Open/Close`);
    }

    if (candle.low > candle.open || candle.low > candle.close) {
      errors.push(`Low (${candle.low}) > Open/Close`);
    }
  }

  // 2. Validar volume
  if (candle.volume < 0) {
    errors.push('Volume negativo');
  }

  // 3. Validar timestamp
  if (!(candle.timestamp instanceof Date) || isNaN(candle.timestamp.getTime())) {
    errors.push('Timestamp inválido');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    hasGap,
    isOutlier,
    errors,
  };
}

/**
 * Detectar gaps entre candles
 */
export function detectGaps(
  candles: Candle[],
  maxGapPercent: number = 5
): Array<{
  index: number;
  gapPercent: number;
  from: Candle;
  to: Candle;
}> {
  const gaps: Array<{
    index: number;
    gapPercent: number;
    from: Candle;
    to: Candle;
  }> = [];

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    // Calcular gap
    const gapPercent = Math.abs((curr.open - prev.close) / prev.close) * 100;

    if (gapPercent > maxGapPercent) {
      gaps.push({
        index: i,
        gapPercent,
        from: prev,
        to: curr,
      });
    }
  }

  return gaps;
}

/**
 * Detectar outliers de volume
 */
export function detectVolumeOutliers(
  candles: Candle[],
  threshold: number = 3
): Array<{
  index: number;
  volume: number;
  mean: number;
  stdDev: number;
  zscore: number;
}> {
  if (candles.length < 2) return [];

  // Calcular média e desvio padrão
  const volumes = candles.map(c => c.volume);
  const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const variance =
    volumes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / volumes.length;
  const stdDev = Math.sqrt(variance);

  // Detectar outliers
  const outliers: Array<{
    index: number;
    volume: number;
    mean: number;
    stdDev: number;
    zscore: number;
  }> = [];

  for (let i = 0; i < candles.length; i++) {
    const zscore = (candles[i].volume - mean) / (stdDev || 1);

    if (Math.abs(zscore) > threshold) {
      outliers.push({
        index: i,
        volume: candles[i].volume,
        mean,
        stdDev,
        zscore,
      });
    }
  }

  return outliers;
}

/**
 * Detectar outliers de preço
 */
export function detectPriceOutliers(
  candles: Candle[],
  threshold: number = 3
): Array<{
  index: number;
  close: number;
  mean: number;
  stdDev: number;
  zscore: number;
}> {
  if (candles.length < 2) return [];

  // Calcular média e desvio padrão dos closes
  const closes = candles.map(c => c.close);
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const variance =
    closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / closes.length;
  const stdDev = Math.sqrt(variance);

  // Detectar outliers
  const outliers: Array<{
    index: number;
    close: number;
    mean: number;
    stdDev: number;
    zscore: number;
  }> = [];

  for (let i = 0; i < candles.length; i++) {
    const zscore = (candles[i].close - mean) / (stdDev || 1);

    if (Math.abs(zscore) > threshold) {
      outliers.push({
        index: i,
        close: candles[i].close,
        mean,
        stdDev,
        zscore,
      });
    }
  }

  return outliers;
}

/**
 * Validar sequência de candles
 */
export function validateCandleSequence(
  candles: Candle[],
  options: ValidationOptions = {}
): {
  isValid: boolean;
  invalidCandles: Array<{ index: number; errors: string[] }>;
  gaps: Array<{ index: number; gapPercent: number }>;
  volumeOutliers: Array<{ index: number; zscore: number }>;
  priceOutliers: Array<{ index: number; zscore: number }>;
} {
  const {
    maxGapPercent = 5,
    outlierThreshold = 3,
  } = options;

  const invalidCandles: Array<{ index: number; errors: string[] }> = [];
  const gaps = detectGaps(candles, maxGapPercent).map(g => ({
    index: g.index,
    gapPercent: g.gapPercent,
  }));
  const volumeOutliers = detectVolumeOutliers(candles, outlierThreshold).map(o => ({
    index: o.index,
    zscore: o.zscore,
  }));
  const priceOutliers = detectPriceOutliers(candles, outlierThreshold).map(o => ({
    index: o.index,
    zscore: o.zscore,
  }));

  // Validar cada candle
  for (let i = 0; i < candles.length; i++) {
    const validation = validateCandle(candles[i], options);
    if (!validation.isValid) {
      invalidCandles.push({
        index: i,
        errors: validation.errors,
      });
    }
  }

  const isValid =
    invalidCandles.length === 0 &&
    gaps.length === 0 &&
    volumeOutliers.length === 0 &&
    priceOutliers.length === 0;

  return {
    isValid,
    invalidCandles,
    gaps,
    volumeOutliers,
    priceOutliers,
  };
}

/**
 * Gerar relatório de validação
 */
export function generateValidationReport(
  candles: Candle[],
  options: ValidationOptions = {}
): string {
  const validation = validateCandleSequence(candles, options);

  let report = `Relatório de Validação de Candles\n`;
  report += `================================\n\n`;

  report += `Total de candles: ${candles.length}\n`;
  report += `Status geral: ${validation.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n\n`;

  if (validation.invalidCandles.length > 0) {
    report += `❌ Candles Inválidos: ${validation.invalidCandles.length}\n`;
    for (const invalid of validation.invalidCandles) {
      report += `  - Índice ${invalid.index}: ${invalid.errors.join(', ')}\n`;
    }
    report += '\n';
  }

  if (validation.gaps.length > 0) {
    report += `⚠️  Gaps Detectados: ${validation.gaps.length}\n`;
    for (const gap of validation.gaps) {
      report += `  - Índice ${gap.index}: ${gap.gapPercent.toFixed(2)}%\n`;
    }
    report += '\n';
  }

  if (validation.volumeOutliers.length > 0) {
    report += `⚠️  Outliers de Volume: ${validation.volumeOutliers.length}\n`;
    for (const outlier of validation.volumeOutliers) {
      report += `  - Índice ${outlier.index}: z-score ${outlier.zscore.toFixed(2)}\n`;
    }
    report += '\n';
  }

  if (validation.priceOutliers.length > 0) {
    report += `⚠️  Outliers de Preço: ${validation.priceOutliers.length}\n`;
    for (const outlier of validation.priceOutliers) {
      report += `  - Índice ${outlier.index}: z-score ${outlier.zscore.toFixed(2)}\n`;
    }
    report += '\n';
  }

  return report;
}
