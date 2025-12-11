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
  titulo VARCHAR(100) NOT NULL,
  genero VARCHAR(50),
  descricao TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL
);

-- Exemplo de inserção de jogos padrão
INSERT INTO jogo (titulo, genero, descricao, slug) VALUES
('PPT', 'Clássico', 'Pedra Papel Tesoura', 'ppt'),
('Forca', 'Palavras', 'Jogo da Forca', 'forca'),
('2048', 'Puzzle', 'Jogo 2048', '2048'),
('Memória', 'Puzzle', 'Jogo da Memória', 'memoria'),
('Sudoku', 'Puzzle', 'Jogo Sudoku', 'sudoku'),
('Pong', 'Arcade', 'Jogo Pong', 'pong'),
('Campo Minado', 'Puzzle', 'Campo Minado', 'campo-minado'),
('Velha', 'Clássico', 'Jogo da Velha', 'velha');

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
  created_at TIMESTAMP DEFAULT NOW(), -- Data/hora de criação do registro
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Para rastrear alterações
);

-- Tabela de Partidas
CREATE TABLE partida (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuario(id),
  id_jogo INTEGER REFERENCES jogo(id),
  resultado VARCHAR(20),
  dificuldade VARCHAR(50),
  tempo INTEGER,
  pontucao INTEGER,
  erros INTEGER,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Para rastrear alterações
  excluido BOOLEAN DEFAULT FALSE -- Para marcação lógica de exclusão
);

CREATE INDEX idx_ranking_jogo_tipo_dif ON ranking_avancado (id_jogo, tipo, dificuldade);
CREATE INDEX idx_ranking_usuario ON ranking_avancado (id_usuario);

-- Criar triggers para atualizar automaticamente o ranking ao alterar/excluir partidas
CREATE OR REPLACE FUNCTION atualizar_ranking()
RETURNS TRIGGER AS $$
BEGIN
  -- Lógica para recalcular o ranking com base nas alterações na tabela de partidas
  -- Exemplo: Atualizar o ranking com a melhor pontuação ou menor tempo
  UPDATE ranking_avancado
  SET valor = (
    SELECT MAX(pontucao)
    FROM partida
    WHERE partida.id_jogo = NEW.id_jogo AND partida.id_usuario = NEW.id_usuario AND excluido = FALSE
  ),
  tempo = (
    SELECT MIN(tempo)
    FROM partida
    WHERE partida.id_jogo = NEW.id_jogo AND partida.id_usuario = NEW.id_usuario AND excluido = FALSE
  ),
  atualizado_em = NOW()
  WHERE id_jogo = NEW.id_jogo AND id_usuario = NEW.id_usuario;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar ranking ao inserir/alterar/excluir partidas
CREATE TRIGGER trigger_atualizar_ranking
AFTER INSERT OR UPDATE OR DELETE ON partida
FOR EACH ROW
EXECUTE FUNCTION atualizar_ranking();