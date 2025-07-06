// (A rota de edição de usuário foi movida para depois da criação do app)
// ...existing code...
// BACKEND Node.js/Express completo para login, registro, painel admin e ranking avançado (em memória)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// ---- DADOS EM MEMÓRIA ---- //
const users = [
  // Primeiro admin criado manualmente
  { nome: "Administrador", email: "admin@admin.com", senha: "admin123", isAdmin: true, status: 'ativo', createdAt: '2024-06-01', ultimoLogin: '' }
];

// Para bloqueio de jogos (status) — estatísticas serão dinâmicas
const jogosStatus = [
  { nome: 'Jogo da Velha', bloqueado: false },
  { nome: 'PPT', bloqueado: false },
  { nome: 'Forca', bloqueado: false },
  { nome: '2048', bloqueado: false },
  { nome: 'Memória', bloqueado: false },
  { nome: 'Sudoku', bloqueado: false },
  { nome: 'Pong', bloqueado: false },
  { nome: 'Campo Minado', bloqueado: false }
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
  // Adiciona um log de cadastro usando o email como usuario para garantir que apareça na listagem imediatamente
  addLog(email, 'Cadastro', email);
  return res.json({ success: true, user: { nome, email, isAdmin: false } });
});

// Nova rota pública para checar status do usuário (bloqueado ou não)
app.post('/user/status', (req, res) => {
  const { email } = req.body;
  const user = findUser(email);
  if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  res.json({ success: true, status: user.status });
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
  // Buscar últimas ações do usuário nos logs
  const usersInfo = users.map(u => {
    // Filtrar logs mais recentes deste usuário
    const userLogs = logs.filter(l => l.usuario === u.nome || l.usuario === u.email)
      .sort((a, b) => b.data.localeCompare(a.data));
    // Considera o log mais recente como 'última ação'
    const ultimaAcao = userLogs.length > 0
      ? `${userLogs[0].acao} (${userLogs[0].data})`
      : (u.ultimoLogin ? `Login (${u.ultimoLogin})` : '--');
    return {
      nome: u.nome,
      email: u.email,
      isAdmin: u.isAdmin,
      status: u.status,
      createdAt: u.createdAt,
      ultimoLogin: u.ultimoLogin,
      ultimaAcao
    }
  });
  res.json({ success: true, users: usersInfo });
});

// Bloquear usuário
app.put('/admin/users/:email/block', requireAdmin, (req, res) => {
  const email = req.params.email;
  const adminEmail = req.body.email;
  const user = findUser(email);
  if (!user || user.email === 'admin@admin.com') return res.json({ success: false, message: 'Não permitido.' });
  if (email === adminEmail) return res.json({ success: false, message: 'Você não pode bloquear a si mesmo.' });
  user.status = 'bloqueado';
  addLog(adminEmail, 'Bloqueou usuário', email);
  res.json({ success: true });
});

// Desbloquear usuário
app.put('/admin/users/:email/unblock', requireAdmin, (req, res) => {
  const email = req.params.email;
  const adminEmail = req.body.email;
  const user = findUser(email);
  if (!user) return res.json({ success: false });
  if (email === adminEmail) return res.json({ success: false, message: 'Você não pode desbloquear a si mesmo.' });
  user.status = 'ativo';
  addLog(adminEmail, 'Desbloqueou usuário', email);
  res.json({ success: true });
});

// Promover admin
app.put('/admin/users/:email/promote', requireAdmin, (req, res) => {
  const email = req.params.email;
  const adminEmail = req.body.email;
  const user = findUser(email);
  if (!user || user.isAdmin) return res.json({ success: false });
  if (email === adminEmail) return res.json({ success: false, message: 'Você não pode promover a si mesmo.' });
  user.isAdmin = true;
  addLog(adminEmail, 'Promoveu usuário', email);
  res.json({ success: true });
});

// Despromover admin
app.put('/admin/users/:email/demote', requireAdmin, (req, res) => {
  const email = req.params.email;
  const adminEmail = req.body.email;
  if (email === 'admin@admin.com') return res.json({ success: false, message: 'Não permitido.' });
  if (email === adminEmail) return res.json({ success: false, message: 'Você não pode remover seu próprio privilégio de admin.' });
  const user = findUser(email);
  if (!user || !user.isAdmin) return res.json({ success: false });
  user.isAdmin = false;
  addLog(adminEmail, 'Removeu admin', email);
  res.json({ success: true });
});

// Excluir usuário
app.delete('/admin/users/:email', requireAdmin, (req, res) => {
  const email = req.params.email;
  const adminEmail = req.body.email;
  if (email === 'admin@admin.com') return res.json({ success: false, message: 'Não permitido.' });
  if (email === adminEmail) return res.json({ success: false, message: 'Você não pode excluir a si mesmo.' });
  const idx = users.findIndex(u => u.email === email);
  if (idx === -1) return res.json({ success: false });
  users.splice(idx, 1);
  addLog(adminEmail, 'Excluiu usuário', email);
  res.json({ success: true });
});

// Adiciona rota de edição de usuário (nome, email, status) após a criação do app
app.put('/admin/users/:email', requireAdmin, (req, res) => {
  const email = req.params.email;
  const { nome, email: novoEmail, status, adminEmail } = req.body;
  const user = findUser(email);
  if (!user) return res.json({ success: false, message: 'Usuário não encontrado.' });
  if (novoEmail && novoEmail !== email && findUser(novoEmail)) {
    return res.json({ success: false, message: 'Email já cadastrado.' });
  }
  if (nome) user.nome = nome;
  if (novoEmail && novoEmail !== email) user.email = novoEmail;
  if (status) user.status = status;
  addLog(adminEmail, 'Editou usuário', email);
  res.json({ success: true });
});

// --- JOGOS --- //

// Nova rota: Estatísticas reais dos jogos (dinâmico)
app.post('/admin/game-stats', requireAdmin, (req, res) => {
  const nomesJogos = [
    'Jogo da Velha', 'PPT', 'Forca', '2048',
    'Memória', 'Sudoku', 'Pong', 'Campo Minado'
  ];
  const stats = [];

  nomesJogos.forEach(nome => {
    let totalPartidas = 0;
    let totalVitorias = 0, totalDerrotas = 0, totalEmpates = 0;
    let jogadoresSet = new Set();

    // Busca as entradas de ranking para estatísticas
    for (const tipo in (advancedRankings[nome] || {})) {
      for (const dificuldade in (advancedRankings[nome][tipo] || {})) {
        (advancedRankings[nome][tipo][dificuldade] || []).forEach(entry => {
          jogadoresSet.add(entry.nome);

          // Ajuste os tipos conforme seu padrão real de ranking
          if (tipo.includes('vitoria')) totalVitorias += entry.valor || 0;
          if (tipo.includes('derrota')) totalDerrotas += entry.valor || 0;
          if (tipo.includes('empate'))  totalEmpates  += entry.valor || 0;
          // Considera todas interações como partidas (ajuste se necessário)
          if (tipo.includes('partida') || tipo.includes('vitoria') || tipo.includes('derrota') || tipo.includes('empate')) {
            totalPartidas += entry.valor || 0;
          }
        });
      }
    }
    const qtdJogadores = jogadoresSet.size || 1;
    // Busca status de bloqueio
    const bloqueado = (jogosStatus.find(j => j.nome === nome) || {}).bloqueado || false;
    stats.push({
      nome,
      bloqueado,
      totalPartidas,
      mediaVitorias: (totalVitorias / qtdJogadores).toFixed(2),
      mediaDerrotas: (totalDerrotas / qtdJogadores).toFixed(2),
      mediaEmpates: (totalEmpates / qtdJogadores).toFixed(2)
    });
  });

  res.json({ success: true, stats });
});

// Listar jogos (status apenas)
app.post('/admin/games', requireAdmin, (req, res) => {
  res.json({ success: true, jogos: jogosStatus });
});

// Resetar estatísticas do jogo (NÃO zera rankings, só loga)
app.put('/admin/games/:nome/reset', requireAdmin, (req, res) => {
  // Não faz nada além de logar (pois ranking é histórico, não zera)
  const nome = req.params.nome;
  addLog(req.body.email, 'Resetou estatísticas do jogo', nome);
  res.json({ success: true });
});

// Bloquear/desbloquear jogo
app.put('/admin/games/:nome/block', requireAdmin, (req, res) => {
  const nome = req.params.nome;
  const jogo = jogosStatus.find(j => j.nome === nome);
  if (!jogo) return res.json({ success: false });
  jogo.bloqueado = true;
  addLog(req.body.email, 'Bloqueou jogo', nome);
  res.json({ success: true });
});
app.put('/admin/games/:nome/unblock', requireAdmin, (req, res) => {
  const nome = req.params.nome;
  const jogo = jogosStatus.find(j => j.nome === nome);
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

// --- NOVA ROTA: Editar entrada do ranking (admin) ---
app.post('/rankings/edit', requireAdmin, (req, res) => {
  const { jogo, tipo, dificuldade, nome, valor, tempo, erros, status } = req.body;
  if (!jogo || !tipo || !nome) return res.json({ success: false, message: 'Dados obrigatórios faltando.' });
  const keyDif = dificuldade || '';
  let arr = (advancedRankings[jogo] && advancedRankings[jogo][tipo] && advancedRankings[jogo][tipo][keyDif]) || [];
  let idx = arr.findIndex(e => e.nome === nome);
  if (idx === -1) return res.json({ success: false, message: 'Entrada não encontrada.' });
  if (valor !== undefined) arr[idx].valor = valor;
  if (tempo !== undefined) arr[idx].tempo = tempo;
  if (erros !== undefined) arr[idx].erros = erros;
  if (status === "ativo" || status === "bloqueado") arr[idx].status = status;
  addLog(req.body.email, `Editou "${nome}" no ranking (${jogo} - ${tipo} ${keyDif})`, `valor=${valor}, tempo=${tempo}, erros=${erros}, status=${status}`);
  res.json({ success: true });
});

// --- LOGS --- //
app.post('/admin/logs', requireAdmin, (req, res) => {
  res.json({ success: true, logs });
});

// --- INICIAR SERVIDOR --- //
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});