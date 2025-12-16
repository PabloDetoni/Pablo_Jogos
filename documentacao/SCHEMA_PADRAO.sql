-- SCHEMA_PADRAO.sql
-- Schema completo mínimo solicitado: usuario, jogo, admin, trophy_type, trophy, partida, ranking_avancado
-- Use este script para (re)criar as tabelas principais do sistema.

-- Usuário
DROP TABLE IF EXISTS usuario CASCADE;
CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Jogo
DROP TABLE IF EXISTS jogo CASCADE;
CREATE TABLE jogo (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  genero VARCHAR(100),
  descricao TEXT,
  slug VARCHAR(200) UNIQUE NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Admin (1:1)
DROP TABLE IF EXISTS admin CASCADE;
CREATE TABLE admin (
  id_usuario INTEGER PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
  nivel_permissao INTEGER NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tipos de Troféu (catálogo)
DROP TABLE IF EXISTS trophy_type CASCADE;
CREATE TABLE trophy_type (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(80) UNIQUE NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  dados JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Instâncias de Troféu (cada troféu pertence a um usuário) 1:N (usuario -> trophy)
DROP TABLE IF EXISTS trophy CASCADE;
CREATE TABLE trophy (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  trophy_type_id INTEGER REFERENCES trophy_type(id) ON DELETE SET NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  dados JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_trophy_usuario ON trophy (usuario_id);
CREATE INDEX IF NOT EXISTS idx_trophy_type ON trophy (trophy_type_id);

-- Partidas (N:M com atributos)
DROP TABLE IF EXISTS partida CASCADE;
CREATE TABLE partida (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  id_jogo INTEGER REFERENCES jogo(id) ON DELETE SET NULL,
  resultado VARCHAR(50),
  dificuldade VARCHAR(50),
  tempo INTEGER,         -- em segundos (se aplicável)
  pontuacao INTEGER,     -- score (se aplicável)
  erros INTEGER,
  dados JSONB DEFAULT '{}'::jsonb,
  data TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  excluido BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_partida_usuario ON partida (id_usuario);
CREATE INDEX IF NOT EXISTS idx_partida_jogo ON partida (id_jogo);
CREATE INDEX IF NOT EXISTS idx_partida_data ON partida (data);

-- ===============================================
-- TROFÉUS - Tabelas adicionais para o sistema
-- ===============================================

-- Garante que trophy_type tem os campos extras para cor e ícone no JSONB dados
-- Exemplo de inserção:
-- INSERT INTO trophy_type (chave, titulo, descricao, dados) 
-- VALUES ('mestre_velha', 'Mestre da Velha', 'Dominou o Jogo da Velha', '{"cor_hex": "#ffd700", "icone": "👑"}');

-- Garante que trophy tem granted_at como padrão para ordenação
-- A query no controller já retorna os campos necessários:
-- usuario_nome, usuario_status, trofeu_nome, trofeu_cor, trofeu_icone, data_atribuicao

-- ===============================================
-- Exemplos de inserção de tipos de troféu
-- ===============================================
-- INSERT INTO trophy_type (chave, titulo, descricao, dados) VALUES
--   ('lenda_2048', 'Lenda do 2048', 'Alcançou pontuação épica no 2048', '{"cor_hex": "#ff6b6b", "icone": "🏆"}'),
--   ('mestre_memoria', 'Mestre da Memória', 'Completou memória em tempo recorde', '{"cor_hex": "#4ecdc4", "icone": "🧠"}'),
--   ('rei_pong', 'Rei do Pong', 'Invicto no Pong por 10 partidas', '{"cor_hex": "#45b7d1", "icone": "👑"}'),
--   ('velocista', 'Velocista', 'Menor tempo no Campo Minado difícil', '{"cor_hex": "#96ceb4", "icone": "⚡"}');

-- ===============================================
-- Exemplo de atribuição de troféu a um usuário
-- ===============================================
-- INSERT INTO trophy (usuario_id, trophy_type_id, granted_at)
-- SELECT u.id, tt.id, NOW()
-- FROM usuario u, trophy_type tt
-- WHERE u.nome = 'João' AND tt.chave = 'lenda_2048';

-- Nota: tabela `ranking_avancado` removida por decisão do projeto.
-- Raciocínio: os rankings serão calculados a partir das consultas sobre a tabela `partida` no momento da visualização.
-- Se futuramente for necessária otimização, considere criar uma MATERIALIZED VIEW ou uma tabela de cache
-- atualizada por job ou por lógica no backend. Posso gerar esse artefato quando pedir.

-- Observações:
-- 1) Este script cria as tabelas principais solicitadas. Execute em um banco vazio ou faça backup antes de aplicar.
-- 2) Funções/triggers para recalcular ranking automaticamente não estão incluídas aqui; posso gerar quando pedir.
-- 3) Ajuste permissões/usuários conforme seu ambiente local.