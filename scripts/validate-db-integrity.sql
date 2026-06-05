-- ============================================================================
-- VALIDAÇÃO DE INTEGRIDADE REFERENCIAL - AutoInvest Strategy Builder
-- ============================================================================

-- 1. Verificar usuários sem portfolio (CRÍTICO)
SELECT COUNT(*) as usuarios_sem_portfolio
FROM users u
LEFT JOIN portfolios p ON u.id = p.userId
WHERE p.id IS NULL;

-- 2. Verificar strategies órfãs (usuário deletado)
SELECT COUNT(*) as strategies_orfas
FROM strategies s
LEFT JOIN users u ON s.userId = u.id
WHERE u.id IS NULL;

-- 3. Verificar paperTrades órfãs
SELECT COUNT(*) as paper_trades_orfas
FROM paperTrades pt
LEFT JOIN users u ON pt.userId = u.id
LEFT JOIN strategies s ON pt.strategyId = s.id
WHERE u.id IS NULL OR s.id IS NULL;

-- 4. Verificar backtests órfãs
SELECT COUNT(*) as backtests_orfos
FROM backtests b
LEFT JOIN users u ON b.userId = u.id
LEFT JOIN strategies s ON b.strategyId = s.id
WHERE u.id IS NULL OR s.id IS NULL;

-- 5. Verificar portfolioSnapshots órfãs
SELECT COUNT(*) as snapshots_orfos
FROM portfolioSnapshots ps
LEFT JOIN portfolios p ON ps.portfolioId = p.id
LEFT JOIN users u ON ps.userId = u.id
WHERE p.id IS NULL OR u.id IS NULL;

-- 6. Verificar portfolioAllocations órfãs
SELECT COUNT(*) as allocations_orfas
FROM portfolioAllocations pa
LEFT JOIN portfolios p ON pa.portfolioId = p.id
LEFT JOIN users u ON pa.userId = u.id
LEFT JOIN assets a ON pa.assetId = a.id
WHERE p.id IS NULL OR u.id IS NULL OR a.id IS NULL;

-- 7. Verificar assetPrices órfãs
SELECT COUNT(*) as prices_orfas
FROM assetPrices ap
LEFT JOIN assets a ON ap.assetId = a.id
WHERE a.id IS NULL;

-- 8. Verificar watchlist órfã
SELECT COUNT(*) as watchlist_orfos
FROM watchlist w
LEFT JOIN users u ON w.userId = u.id
LEFT JOIN assets a ON w.assetId = a.id
WHERE u.id IS NULL OR a.id IS NULL;

-- 9. Verificar notifications órfãs
SELECT COUNT(*) as notifications_orfas
FROM notifications n
LEFT JOIN users u ON n.userId = u.id
LEFT JOIN strategies s ON n.strategyId = s.id
WHERE u.id IS NULL OR (n.strategyId IS NOT NULL AND s.id IS NULL);

-- 10. Verificar auditLogs órfãs
SELECT COUNT(*) as audit_logs_orfos
FROM auditLogs al
LEFT JOIN users u ON al.userId = u.id
WHERE al.userId IS NOT NULL AND u.id IS NULL;

-- 11. Verificar userSessions órfãs
SELECT COUNT(*) as sessions_orfas
FROM userSessions us
LEFT JOIN users u ON us.userId = u.id
WHERE u.id IS NULL;

-- 12. Verificar securityEvents órfãs
SELECT COUNT(*) as security_events_orfos
FROM securityEvents se
LEFT JOIN users u ON se.userId = u.id
WHERE se.userId IS NOT NULL AND u.id IS NULL;

-- 13. Verificar twoFactorAuth órfãs
SELECT COUNT(*) as 2fa_orfas
FROM twoFactorAuth tfa
LEFT JOIN users u ON tfa.userId = u.id
WHERE u.id IS NULL;

-- 14. Verificar transactions órfãs
SELECT COUNT(*) as transactions_orfas
FROM transactions t
LEFT JOIN users u ON t.userId = u.id
WHERE u.id IS NULL;

-- 15. Verificar plans órfãs (usuários com planId inválido)
SELECT COUNT(*) as users_invalid_plan
FROM users u
LEFT JOIN plans p ON u.planId = p.id
WHERE u.planId IS NOT NULL AND p.id IS NULL;

-- ============================================================================
-- ESTATÍSTICAS DE DADOS
-- ============================================================================

-- Total de registros por tabela
SELECT 
  'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'strategies', COUNT(*) FROM strategies
UNION ALL
SELECT 'paperTrades', COUNT(*) FROM paperTrades
UNION ALL
SELECT 'backtests', COUNT(*) FROM backtests
UNION ALL
SELECT 'portfolios', COUNT(*) FROM portfolios
UNION ALL
SELECT 'portfolioSnapshots', COUNT(*) FROM portfolioSnapshots
UNION ALL
SELECT 'portfolioAllocations', COUNT(*) FROM portfolioAllocations
UNION ALL
SELECT 'assets', COUNT(*) FROM assets
UNION ALL
SELECT 'assetPrices', COUNT(*) FROM assetPrices
UNION ALL
SELECT 'watchlist', COUNT(*) FROM watchlist
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'auditLogs', COUNT(*) FROM auditLogs
UNION ALL
SELECT 'userSessions', COUNT(*) FROM userSessions
UNION ALL
SELECT 'securityEvents', COUNT(*) FROM securityEvents
UNION ALL
SELECT 'twoFactorAuth', COUNT(*) FROM twoFactorAuth
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'plans', COUNT(*) FROM plans
ORDER BY record_count DESC;

-- ============================================================================
-- VERIFICAÇÃO DE ÍNDICES
-- ============================================================================

SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME NOT IN ('PRIMARY')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- ANÁLISE DE PERFORMANCE
-- ============================================================================

-- Tabelas com mais de 10K registros (candidates para particionamento)
SELECT 
  TABLE_NAME,
  ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb,
  TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_ROWS > 10000
ORDER BY TABLE_ROWS DESC;
