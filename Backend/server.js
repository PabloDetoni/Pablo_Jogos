// BACKEND Node.js/Express completo para login, registro, painel admin e ranking avançado (em memória)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// ---- DADOS EM MEMÓRIA ---- //
const users = [
  // Primeiro admin criado manualmente
  { nome: "Administrador", email: "admin@admin.com", senha: "admin123", isAdmin: true, status: 'ativo', createdAt: '2024-06-01', ultimoLogin: '' }
];

// Lista estática dos jogos
const jogos = [
  { nome: 'Jogo da Velha', partidas: 120, vitorias: 55, derrotas: 44, empates: 21, bloqueado: false },
  { nome: 'PPT', partidas: 100, vitorias: 50, derrotas: 45, empates: 5, bloqueado: false },
  { nome: 'Forca', partidas: 80, vitorias: 40, derrotas: 35, empates: 5, bloqueado: false },
  { nome: '2048', partidas: 60, vitorias: 30, derrotas: 28, empates: 2, bloqueado: false },
  { nome: 'Memória', partidas: 70, vitorias: 35, derrotas: 33, empates: 2, bloqueado: false },
  { nome: 'Sudoku', partidas: 90, vitorias: 45, derrotas: 40, empates: 5, bloqueado: false },
  { nome: 'Pong', partidas: 80, vitorias: 40, derrotas: 35, empates: 5, bloqueado: false },
  { nome: 'Campo Minado', partidas: 50, vitorias: 25, derrotas: 25, empates: 0, bloqueado: false }
];

// Ranking avançado: { [jogo]: { [tipo]: { [dificuldade]: [entradas] } } }
const advancedRankings = {};
// Exemplo de entrada de ranking:
// { nome, valor, tempo, erros, status: 'ativo'|'bloqueado' }

const logs = [
  { data: '2025-06-28 14:51', usuario: 'Administrador', acao: 'Criou sistema', detalhes: '-' }
];

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));
app.use(bodyParser.json());

// --- HELPERS --- //
function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
function findUser(email) {
  return users.find(u => u.email === email);
}
function nowStr() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}
function addLog(usuario, acao, detalhes) {
  logs.push({ data: nowStr(), usuario, acao, detalhes });
}

// --- MIDDLEWARE --- //
function requireAdmin(req, res, next) {
  const { email } = req.body;
  const user = findUser(email);
  if (user && user.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Acesso apenas para administradores.' });
  }
}

// --- AUTENTICAÇÃO --- //

// Cadastro
app.post('/register', (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || nome.length > 20) {
    return res.json({ success: false, message: 'Nome inválido.' });
  }
  if (!validateEmail(email)) {
    return res.json({ success: false, message: 'Email inválido.' });
  }
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 20) {
    return res.json({ success: false, message: 'A senha deve ter entre 8 e 20 caracteres.' });
  }
  if (findUser(email)) {
    return res.json({ success: false, message: 'Email já cadastrado.' });
  }

  users.push({ nome, email, senha, isAdmin: false, status: 'ativo', createdAt: nowStr(), ultimoLogin: '' });
  addLog(nome, 'Cadastro', email);
  return res.json({ success: true, user: { nome, email, isAdmin: false } });
});

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const user = users.find(u => u.email === email && u.senha === senha);
  if (user) {
    if (user.status === 'bloqueado') {
      return res.json({ success: false, message: 'Usuário bloqueado. Contate o administrador.' });
    }
    user.ultimoLogin = nowStr();
    addLog(user.nome, 'Login', email);
    return res.json({ success: true, user: { nome: user.nome, email: user.email, isAdmin: !!user.isAdmin } });
  } else {
    return res.json({ success: false, message: 'Email ou senha inválidos.' });
  }
});

// --- ROTAS ADMIN --- //

// Listar usuários
app.post('/admin/users', requireAdmin, (req, res) => {
  const usersInfo = users.map(u => ({
    nome: u.nome,
    email: u.email,
    isAdmin: u.isAdmin,
    status: u.status,
    createdAt: u.createdAt,
    ultimoLogin: u.ultimoLogin
  }));
  res.json({ success: true, users: usersInfo });
});

// Bloquear usuário
app.put('/admin/users/:email/block', requireAdmin, (req, res) => {
  const email = req.params.email;
  const user = findUser(email);
  if (!user || user.email === 'admin@admin.com') return res.json({ success: false, message: 'Não permitido.' });
  user.status = 'bloqueado';
  addLog(req.body.email, 'Bloqueou usuário', email);
  res.json({ success: true });
});

// Desbloquear usuário
app.put('/admin/users/:email/unblock', requireAdmin, (req, res) => {
  const email = req.params.email;
  const user = findUser(email);
  if (!user) return res.json({ success: false });
  user.status = 'ativo';
  addLog(req.body.email, 'Desbloqueou usuário', email);
  res.json({ success: true });
});

// Promover admin
app.put('/admin/users/:email/promote', requireAdmin, (req, res) => {
  const email = req.params.email;
  const user = findUser(email);
  if (!user || user.isAdmin) return res.json({ success: false });
  user.isAdmin = true;
  addLog(req.body.email, 'Promoveu usuário', email);
  res.json({ success: true });
});

// Despromover admin
app.put('/admin/users/:email/demote', requireAdmin, (req, res) => {
  const email = req.params.email;
  if (email === 'admin@admin.com') return res.json({ success: false, message: 'Não permitido.' });
  const user = findUser(email);
  if (!user || !user.isAdmin) return res.json({ success: false });
  user.isAdmin = false;
  addLog(req.body.email, 'Removeu admin', email);
  res.json({ success: true });
});

// Excluir usuário
app.delete('/admin/users/:email', requireAdmin, (req, res) => {
  const email = req.params.email;
  if (email === 'admin@admin.com') return res.json({ success: false, message: 'Não permitido.' });
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) return res.json({ success: false });
  users.splice(idx, 1);
  addLog(req.body.email, 'Excluiu usuário', email);
  res.json({ success: true });
});

// --- JOGOS --- //

// Listar jogos
app.post('/admin/games', requireAdmin, (req, res) => {
  res.json({ success: true, jogos });
});

// Resetar estatísticas do jogo
app.put('/admin/games/:nome/reset', requireAdmin, (req, res) => {
  const nome = req.params.nome;
  const jogo = jogos.find(j => j.nome === nome);
  if (!jogo) return res.json({ success: false });
  jogo.partidas = 0; jogo.vitorias = 0; jogo.derrotas = 0; jogo.empates = 0;
  addLog(req.body.email, 'Resetou jogo', nome);
  res.json({ success: true });
});

// Bloquear/desbloquear jogo
app.put('/admin/games/:nome/block', requireAdmin, (req, res) => {
  const nome = req.params.nome;
  const jogo = jogos.find(j => j.nome === nome);
  if (!jogo) return res.json({ success: false });
  jogo.bloqueado = true;
  addLog(req.body.email, 'Bloqueou jogo', nome);
  res.json({ success: true });
});
app.put('/admin/games/:nome/unblock', requireAdmin, (req, res) => {
  const nome = req.params.nome;
  const jogo = jogos.find(j => j.nome === nome);
  if (!jogo) return res.json({ success: false });
  jogo.bloqueado = false;
  addLog(req.body.email, 'Desbloqueou jogo', nome);
  res.json({ success: true });
});

// --- RANKINGS AVANÇADO --- //
/*
Estrutura do advancedRankings:
{
  [jogo]: {
    [tipoRanking]: {
      [dificuldade]: [
        { nome, valor, tempo, erros, status: "ativo"|"bloqueado" }
      ]
    }
  }
}
*/

// Obter ranking avançado (admin ou público)
app.post('/rankings/advanced', (req, res) => {
  const { jogo, tipo, dificuldade } = req.body;
  if (!jogo || !tipo) return res.json({ success: false, ranking: [] });

  let entries = [];
  if (advancedRankings[jogo] && advancedRankings[jogo][tipo]) {
    if (dificuldade !== undefined && dificuldade !== null && dificuldade !== "") {
      entries = (advancedRankings[jogo][tipo][dificuldade] || []);
    } else {
      // Se não há dificuldade, pega todos os que não tem dificuldade
      entries = (advancedRankings[jogo][tipo][''] || []);
    }
  }
  // Ordenação padrão: 
  // valor decrescente (Vitórias/Pontuação/Sequência), tempo crescente (para menor tempo), erros crescente (para desempate se houver)
  // O frontend já monta a tabela correta para cada tipo
  entries = entries.slice(); // copiar array
  // Ordena por valor (maior primeiro), exceto se for ranking de tempo
  if (tipo.startsWith('menor_tempo')) {
    entries.sort((a, b) => (a.tempo ?? Infinity) - (b.tempo ?? Infinity) || (a.erros ?? 0) - (b.erros ?? 0));
  } else {
    entries.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
  }
  res.json({ success: true, ranking: entries });
});

// Adicionar entrada ao ranking avançado (public)
app.post('/rankings/advanced/add', (req, res) => {
  const { jogo, tipo, dificuldade, nome, valor, tempo, erros } = req.body;
  if (!jogo || !tipo || !nome || valor === undefined) {
    return res.json({ success: false, message: 'Dados inválidos.' });
  }
  // status padrão: ativo
  if (!advancedRankings[jogo]) advancedRankings[jogo] = {};
  if (!advancedRankings[jogo][tipo]) advancedRankings[jogo][tipo] = {};
  const keyDif = dificuldade || '';
  if (!advancedRankings[jogo][tipo][keyDif]) advancedRankings[jogo][tipo][keyDif] = [];
  // Remove duplicado do mesmo nome (por simplicidade)
  let arr = advancedRankings[jogo][tipo][keyDif];
  let idx = arr.findIndex(e => e.nome === nome);
  if (idx !== -1) arr.splice(idx, 1);
  arr.push({ nome, valor, tempo, erros, status: "ativo" });
  addLog(nome, `Pontuou em ${jogo} [${tipo}]${dificuldade ? " ("+dificuldade+")" : ""}`, valor);
  res.json({ success: true });
});

// Remover entrada do ranking (admin)
app.post('/rankings/remove', requireAdmin, (req, res) => {
  const { jogo, tipo, dificuldade, nome } = req.body;
  if (!jogo || !tipo || !nome) return res.json({ success: false });
  const keyDif = dificuldade || '';
  let arr = (advancedRankings[jogo] && advancedRankings[jogo][tipo] && advancedRankings[jogo][tipo][keyDif]) || [];
  let idx = arr.findIndex(e => e.nome === nome);
  if (idx !== -1) {
    arr.splice(idx, 1);
    addLog(req.body.email, `Removeu "${nome}" do ranking (${jogo} - ${tipo} ${keyDif})`, '-');
    return res.json({ success: true });
  }
  res.json({ success: false });
});

// Bloquear/desbloquear entrada no ranking (admin)
app.post('/rankings/block', requireAdmin, (req, res) => {
  const { jogo, tipo, dificuldade, nome } = req.body;
  if (!jogo || !tipo || !nome) return res.json({ success: false });
  const keyDif = dificuldade || '';
  let arr = (advancedRankings[jogo] && advancedRankings[jogo][tipo] && advancedRankings[jogo][tipo][keyDif]) || [];
  let idx = arr.findIndex(e => e.nome === nome);
  if (idx !== -1) {
    arr[idx].status = "bloqueado";
    addLog(req.body.email, `Bloqueou "${nome}" no ranking (${jogo} - ${tipo} ${keyDif})`, '-');
    return res.json({ success: true });
  }
  res.json({ success: false });
});
app.post('/rankings/unblock', requireAdmin, (req, res) => {
  const { jogo, tipo, dificuldade, nome } = req.body;
  if (!jogo || !tipo || !nome) return res.json({ success: false });
  const keyDif = dificuldade || '';
  let arr = (advancedRankings[jogo] && advancedRankings[jogo][tipo] && advancedRankings[jogo][tipo][keyDif]) || [];
  let idx = arr.findIndex(e => e.nome === nome);
  if (idx !== -1) {
    arr[idx].status = "ativo";
    addLog(req.body.email, `Desbloqueou "${nome}" no ranking (${jogo} - ${tipo} ${keyDif})`, '-');
    return res.json({ success: true });
  }
  res.json({ success: false });
});

// --- LOGS --- //
app.post('/admin/logs', requireAdmin, (req, res) => {
  res.json({ success: true, logs });
});

// --- INICIAR SERVIDOR --- //
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});