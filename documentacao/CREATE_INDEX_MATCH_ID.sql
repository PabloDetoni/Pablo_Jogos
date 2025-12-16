-- Índice único opcional para evitar duplicatas por match_id em caso de race conditions
-- Execute este comando no PostgreSQL para criar o índice:

CREATE UNIQUE INDEX IF NOT EXISTS idx_partida_match_id_unique
ON partida ((dados->>'match_id'))
WHERE (dados->>'match_id') IS NOT NULL;

-- Isso garante que, se dois inserts tentarem gravar o mesmo match_id simultaneamente,
-- apenas um será bem-sucedido e o outro receberá um erro de constraint (que o backend pode tratar).
