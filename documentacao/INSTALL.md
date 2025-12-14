INSTALL — Como instalar e rodar este projeto (BACKEND + FRONTEND)

Visão rápida
- Este repositório tem 3 áreas principais: `backend/`, `frontend/`, `documentacao/`.
- O backend é Node.js + Express + PostgreSQL e serve a pasta `frontend/` como estática (prefixo `/frontend`).
- O processo abaixo explica como subir o projeto numa máquina nova (Linux/bash).

Pré-requisitos
- Node.js (recomendo v16+ ou v18+)
- npm
- PostgreSQL (serviço ativo)
- Acesso ao repositório (cópia local)

Passo a passo (Linux / bash)
1) Clone / copie o repositório e acesse a pasta do projeto

```bash
# ajuste o caminho conforme necessário
cd /caminho/para/Pablo_Jogos(14-12-25)
```

2) Preparar o banco PostgreSQL (exemplo mínimo)

Obs: ajuste nome/usuário/senha conforme desejar e depois coloque os mesmos valores em `backend/.env`.

```bash
# entra no psql como usuário postgres
sudo -u postgres psql

# dentro do psql execute (troque senha conforme preferir):
CREATE USER pablodetoni WITH PASSWORD '123mudar';
CREATE DATABASE pablo_jogos OWNER pablodetoni;
\q
```

3) Aplicar schema (criar tabelas)

O script SQL padrão está em `documentacao/SCHEMA_PADRAO.sql`.

```bash
psql -U pablodetoni -d pablo_jogos -f documentacao/SCHEMA_PADRAO.sql
```

4) Configurar variáveis de ambiente (backend/.env)

Edite `backend/.env` com as credenciais locais. Exemplo mínimo (já incluído no repositório, mas verifique):

```
PGUSER=pablodetoni
PGHOST=localhost
PGDATABASE=pablo_jogos
PGPASSWORD=123mudar
PGPORT=5432
# opcional: PORT=3001
```

5) Instalar dependências do backend e iniciar

```bash
cd backend
npm install
npm start
```

- O `package.json` já foi ajustado para iniciar `server2.js` (entrypoint).
- O servidor fará um health-check no banco e executará inicialização idempotente que cria o usuário admin padrão e os jogos básicos automaticamente.

6) Verificar health check e acessar frontend

- Health check:
```
curl http://localhost:3001/health
```
- Frontend (arquivos estáticos servidos pelo backend):
  - Páginas de estrutura: http://localhost:3001/frontend/html/estrutura/index.html
  - Páginas de jogos geradas: http://localhost:3001/frontend/html/jogos/<slug>.html

7) Comandos úteis de debug

- Ver processos Node / porta ocupada:
```bash
ss -ltnp | grep :3001
# ou
lsof -iTCP:3001 -sTCP:LISTEN -P -n
```
- Matar processo que está usando a porta (se necessário):
```bash
kill <PID>
# ou (forçar):
kill -9 <PID>
# alternativa: fuser -k 3001/tcp
```
- Testar rotas API (exemplos):
```bash
# listar jogos
curl http://localhost:3001/jogo
# criar usuário (registro)
curl -X POST -H 'Content-Type: application/json' -d '{"nome":"Teste","email":"t@t.com","senha":"12345678"}' http://localhost:3001/usuario/register
```

Problemas comuns e soluções rápidas
- Erro de conexão com PostgreSQL: verifique `backend/.env` e se o serviço Postgres está ativo. Tente conectar manualmente:
```bash
psql -U $PGUSER -h $PGHOST -d $PGDATABASE
```
- Porta já em uso (EADDRINUSE): escolha outra porta setando `PORT=3002` em `backend/.env` ou mate o processo que está usando a porta.
- Erros de permissão ao aplicar schema: execute psql com usuário que tem permissões adequadas (ou use sudo para entrar como postgres).

Notas de operação
- Inicialização automática: na primeira execução `server2.js` chama um inicializador que garante que exista um usuário admin e os jogos padrões (idempotente — não duplica se já existirem).
- Templates e geração de jogos: templates estão em `frontend/*/estrutura` e o backend gera arquivos em `frontend/*/jogos` ao criar novos jogos via API (utilitário em `backend/utils/jogoFileManager.js`).
- Segurança: atualmente senhas são armazenadas em texto no banco (projeto didático). Planeje usar bcrypt em ambiente real.

Backup / restauração do banco (rápido)

```bash
# backup
pg_dump -U pablodetoni -h localhost -Fc pablo_jogos > pablo_jogos.dump

# restauração para um DB vazio
pg_restore -U pablodetoni -h localhost -d pablo_jogos pablo_jogos.dump
```

Commit e branch de segurança
- Antes de fazer limpezas ou remoções em lote, crie uma branch/backup:
```bash
cd backend
git checkout -b cleanup/before-major-deletions
```

Últimas recomendações
- Mantenha `backend/.env` fora do controle de versão (não comitar credenciais). O `.gitignore` do repositório contém `node_modules` — adicione `.env` se quiser garantir que não seja comitado.
- Depois de confirmar que tudo funciona numa máquina de referência, documente passos específicos extras em `documentacao/` (ex.: variáveis adicionais, testes automatizados).

Se quiser, eu posso: 1) criar um `documentacao/INSTALL.md` (feito agora), 2) rodar testes automatizados nas APIs, 3) gerar script de inicialização para facilitar deploy. Diga o que prefere que eu faça a seguir.
