// BACKEND Node.js/Express para login, registro e painel admin funcional (em memória)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// ---- DADOS EM MEMÓRIA ---- //
const users = [
  // Primeiro admin criado manualmente
  { nome: "Administrador", email: "admin@admin.com", senha: "admin123", isAdmin: true, status: 'ativo', createdAt: '2024-06-01', ultimoLogin: '' }
];
const jogos = [
  { nome: 'Jogo da Velha', partidas: 120, vitorias: 55, derrotas: 44, empates: 21 },
  { nome: 'Pong', partidas: 80, vitorias: 40, derrotas: 35, empates: 5 }
];
const rankings = {
  "Jogo da Velha": [
    { nome: 'Administrador', pontuacao: 30 }
  ],
  "Pong": [
    { nome: 'Administrador', pontuacao: 20 }
  ]
};
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

// Adicionar jogo
app.post('/admin/games/add', requireAdmin, (req, res) => {
  const { nome } = req.body;
  if (!nome || jogos.some(j => j.nome.toLowerCase() === nome.toLowerCase())) {
    return res.json({ success: false, message: 'Nome de jogo inválido ou já existe.' });
  }
  jogos.push({ nome, partidas: 0, vitorias: 0, derrotas: 0, empates: 0 });
  rankings[nome] = [];
  addLog(req.body.email, 'Adicionou jogo', nome);
  res.json({ success: true });
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

// Remover jogo
app.delete('/admin/games/:nome', requireAdmin, (req, res) => {
  const nome = req.params.nome;
  const idx = jogos.findIndex(j => j.nome === nome);
  if (idx === -1) return res.json({ success: false });
  jogos.splice(idx, 1);
  delete rankings[nome];
  addLog(req.body.email, 'Removeu jogo', nome);
  res.json({ success: true });
});

// --- RANKINGS --- //

// Listar ranking de um jogo
app.post('/admin/rankings', requireAdmin, (req, res) => {
  const { jogo } = req.body;
  res.json({ success: true, ranking: rankings[jogo] || [] });
});

// --- LOGS --- //
app.post('/admin/logs', requireAdmin, (req, res) => {
  res.json({ success: true, logs });
});

// --- INICIAR SERVIDOR --- //
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});