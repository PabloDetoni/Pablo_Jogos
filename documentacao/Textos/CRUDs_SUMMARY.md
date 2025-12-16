# Resumo dos CRUDs do projeto — visão consolidada

Este documento resume o que foi definido sobre os CRUDs do seu projeto: responsabilidades, regras de negócio, tipo (A/B/C/D), endpoints principais, comportamentos esperados e observações para implementação.

---

## Visão geral
- Áreas do sistema:
  - GESTÃO (admin-gestao): CRUDs executáveis (criar/editar/excluir) para os recursos do tipo A, B, C e D que você escolheu.
  - VISUALIZAÇÃO (admin/visualizacao): páginas e APIs apenas de consulta — `usuario` (com marcação de admin), `jogo` e `ranking` (com info ligada às `partidas` e `troféus`).

- Classificação por tipo (conforme padrão combinado):
  - A — CRUDs sem dependência: Usuario, Jogo, TrophyType
  - B — 1:N: Trophy (instância de troféu pertencente a um usuário)
  - C — N:M com atributos: Partida (usuario <-> jogo, com dados)
  - D — 1:1: Admin (dados de permissão vinculados a um usuario)

---

## Tabelas principais (atualizadas)
- `usuario` (A)
- `admin` (D)
- `jogo` (A)
- `partida` (C)
- `ranking_avancado` (B — observável)
- `trophy_type` (A)
- `trophy` (B)

---

## CRUDs detalhados
### 1) Usuario (A)
- O que faz: gerencia contas (nome, email, senha, status/admin).
- Endpoints principais:
  - GET /usuario
  - POST /usuario (ou /usuario/register)
  - GET /usuario/:id
  - PUT /usuario/:id
  - DELETE /usuario/:id
- Regras: validar email único; senha mínima de 8 chars (projeto didático: sem hash por enquanto); não permitir editar o admin crítico sem permissão.

### 2) Admin (D)
- O que faz: relação 1:1 que promove/rebaixa usuários; nível de permissão.
- Endpoints:
  - GET /admin/:usuario_id
  - POST /admin/:usuario_id
  - PUT /admin/:usuario_id
  - DELETE /admin/:usuario_id
- Regras: operação restrita a administradores (controle futuro de autorização).

### 3) Jogo (A)
- O que faz: cadastro/edição de metadados de jogo (titulo, genero, descricao, slug). Ao criar, chama `jogoFileManager` para gerar páginas CSS/JS a partir de templates.
- Endpoints:
  - GET /jogo
  - POST /jogo
  - GET /jogo/:id
  - PUT /jogo/:id
  - DELETE /jogo/:id (proteger jogos padrão)
- Regras: slug gerado automaticamente; não permitir exclusão de jogos padrão do sistema.

### 4) TrophyType (A)
- O que faz: catálogo de tipos de troféu (definições).
- Campos: chave (única), titulo, descricao, dados extras.
- Endpoints: GET/POST/PUT/DELETE em /trophy-type
- Regras: administração por usuário admin; não afeta posse diretamente.

### 5) Trophy (B) — instâncias 1:N (usuario -> trophy)
- O que faz: instâncias de troféu atribuídas a usuários.
- Cada usuário pode ter muitos troféus; cada troféu pertence a exatamente um usuário (1:N).
- Campos: id, usuario_id (FK), trophy_type_id (FK), granted_at, dados
- Endpoints:
  - GET /trophy?usuario_id=...
  - POST /trophy  (atribuir a um usuário)
  - DELETE /trophy/:id
- Regras: quando atribuir/remover troféus, atualizar visualizações; concessão pode ser feita pelo admin ou por processos automáticos.

### 6) Partida (C)
- O que faz: grava resultados/estatísticas por jogo e usuário (N:M com atributos).
- Campos (variáveis por jogo): data, resultado, tempo, pontuacao, erros, dificuldade, dados JSONB.
- Endpoints principais (gestão):
  - GET /partida?usuario_id=&jogo_id=&page=&limit=
  - GET /partida/:id
  - POST /partida (criação permitida apenas no fluxo "Alterar Partidas")
  - PUT /partida/:id (editar single)
  - PATCH /partida/bulk (editar em massa)
  - DELETE /partida/:id
  - DELETE /partida?usuario_id=... (excluir todas de um usuário)
  - DELETE /partida?jogo_id=... (excluir todas de um jogo)
- Regras principais:
  - A listagem deve ser paginada e suportar filtros por usuario/jogo (ID ou nome incremental).
  - Bulk edit e deletes devem ser transacionais.
  - Ao inserir/editar/excluir, disparar recálculo das estatísticas/ranking automaticamente.
  - Campos exibidos no frontend dependem do jogo (se um jogo não tem "tempo", o frontend não mostra o campo).

---

## Fluxos e UI (resumo)
- Tela inicial do CRUD de Estatísticas (no admin): apenas três botões: "Alterar informações de um Jogo", "Alterar informações de um Usuário", "Alterar Partidas".
- Modal de busca (Jogo/Usuário): dois campos mutuamente exclusivos (ID ou Nome com filtro incremental). "Confirmar Seleção" e "Buscar Partidas" devem disparar a busca ao backend e exibir partidas com campos aplicáveis.
- A listagem permite seleção múltipla para edição em massa ou exclusão; também ações para excluir todas as partidas de um usuário ou de um jogo.
- Inserção de novas partidas somente pelo fluxo "Alterar Partidas" (com exige seleção de jogo e usuário primeiro).

---

## Regras de integridade e transações
- Recalcular ranking automaticamente após qualquer alteração/remoção/inserção relevante em `partida`.
- Operações em massa (bulk updates/deletes) devem ser executadas em transação para evitar inconsistência parcial.
- Validar FK e valores antes de gravar (ex.: campos obrigatórios, tipos numéricos, intervalos).

---

## Observações finais e próximos passos
- Prioridade de implementação: `partida` (C) + recálculo de ranking; `trophy_type` (A) + `trophy` (B); `usuario`/`jogo` (A) já presentes.
- Depois de implementar os endpoints, gerar a UI/UX do modal no frontend que consome essas APIs.
- Fazer testes manuais: alterar a melhor partida e confirmar recálculo do ranking.


Arquivo gerado automaticamente pelo organizador — posso separar por arquivos menores dentro de `documentacao/Textos/` se preferir.
