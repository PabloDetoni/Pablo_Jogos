-- Tabela de Usuários
CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  status TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
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

-- Tabela de Estatísticas do Usuário por Jogo
CREATE TABLE estatistica_usuario_jogo (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id),
  id_jogo INTEGER NOT NULL REFERENCES jogo(id),
  id_dificuldade INTEGER,
  vitorias INTEGER DEFAULT 0,
  vitorias_consecutivas INTEGER DEFAULT 0,
  pontuacao INTEGER DEFAULT 0,
  menor_tempo INTEGER,
  erros INTEGER DEFAULT 0
);
