-- Tabela de Usuários
CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(20) NOT NULL,
  email VARCHAR(40) NOT NULL UNIQUE,
  senha VARCHAR(20) NOT NULL CHECK (char_length(senha) >= 8 AND char_length(senha) <= 20),
  status VARCHAR(5) NOT NULL CHECK (status IN ('admin', 'user')),
  criado_em DATE DEFAULT CURRENT_DATE
);

-- Tabela de Admins (1:1 com usuário)
CREATE TABLE admin (
  id_usuario INTEGER PRIMARY KEY REFERENCES usuario(id),
  nivel_permissao INTEGER NOT NULL DEFAULT 1
);

-- Tabela de Jogos
CREATE TABLE jogo (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  genero TEXT,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de Ranking Avançado
CREATE TABLE ranking_avancado (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id),
  id_jogo INTEGER NOT NULL REFERENCES jogo(id),
  tipo VARCHAR(40) NOT NULL,      -- Ex: 'mais_vitorias_total', 'menor_tempo', etc
  dificuldade VARCHAR(20),        -- Ex: 'Fácil', 'Médio', etc (pode ser NULL)
  valor INTEGER,                  -- Pontuação, vitórias, sequência, etc
  tempo INTEGER,                  -- Para rankings de menor tempo (em segundos)
  erros INTEGER,                  -- Para rankings que usam erros
  created_at TIMESTAMP DEFAULT NOW() -- Data/hora de criação do registro
);

-- Tabela de Partidas
CREATE TABLE partida (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuario(id),
  id_jogo INTEGER REFERENCES jogo(id),
  resultado VARCHAR(20),
  dificuldade VARCHAR(50),
  tempo INTEGER,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ranking_jogo_tipo_dif ON ranking_avancado (id_jogo, tipo, dificuldade);
CREATE INDEX idx_ranking_usuario ON ranking_avancado (id_usuario);