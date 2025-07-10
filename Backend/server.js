const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { requireGameNotBlocked } = require('./middleware');

const app = express();
const PORT = 3001;


// CORS para todas as rotas e métodos (antes de tudo)
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
app.use(cors({
  origin: function(origin, callback) {
    // Permite requests sem origin (ex: curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Body parser antes de tudo
app.use(bodyParser.json());

// Log de partidas individuais (para estatísticas reais)
const { users, jogosStatus, advancedRankings, partidasLog, saveAdvancedRankings } = require('./server-helpers');


// Endpoint para registrar uma partida
app.post('/api/partida', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.json({ success: false, message: 'Requisição inválida.' });
  }
  const { jogo, resultado, nome, tempo, pontuacao, dificuldade, erros } = req.body;
  if (!jogo || !resultado || !nome) return res.json({ success: false, message: 'Dados obrigatórios ausentes.' });
  partidasLog.push({
    jogo,
    resultado, // 'vitoria', 'derrota', 'empate'
    nome,
    tempo: typeof tempo === 'number' ? tempo : null,
    pontuacao: typeof pontuacao === 'number' ? pontuacao : null,
    dificuldade: dificuldade || null,
    erros: typeof erros === 'number' ? erros : null,
    data: new Date().toISOString()
  });
  res.json({ success: true });
});


// Removido duplicidade de declaração
// (já está declarado e usado acima)

// REMOVER CORS DUPLICADO ABAIXO (SE EXISTIR)

// Rota pública para consultar status de bloqueio de um jogo
const { getJogosStatus } = require('./server-helpers');
app.post('/game/status', (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ success: false, message: 'Requisição inválida.' });
  }
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ success: false, message: 'Nome do jogo obrigatório.' });
  const jogosStatus = getJogosStatus();
  const jogo = jogosStatus.find(j => j.nome === nome);
  if (!jogo) return res.status(404).json({ success: false, message: 'Jogo não encontrado.' });
  res.json({ success: true, bloqueado: jogo.bloqueado });
});

// Rotas protegidas para todos os jogos principais
app.post('/api/jogo-da-velha', requireGameNotBlocked('Jogo da Velha'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Jogo da Velha!' });
});
app.post('/api/ppt', requireGameNotBlocked('PPT'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao PPT!' });
});
app.post('/api/forca', requireGameNotBlocked('Forca'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Forca!' });
});
app.post('/api/2048', requireGameNotBlocked('2048'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao 2048!' });
});
app.post('/api/memoria', requireGameNotBlocked('Memória'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Memória!' });
});
app.post('/api/sudoku', requireGameNotBlocked('Sudoku'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Sudoku!' });
});
app.post('/api/pong', requireGameNotBlocked('Pong'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Pong!' });
});
app.post('/api/campo-minado', requireGameNotBlocked('Campo Minado'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Campo Minado!' });
});
// ...existing code...
// BACKEND Node.js/Express completo para login, registro, painel admin e ranking avançado (em memória)
// (Removido: já importado no topo do arquivo)



// --- EXEMPLO DE USO DO MIDDLEWARE PARA BLOQUEIO DE JOGOS ---
// Para cada rota de jogo real, adicione o middleware:
// app.post('/api/jogo-da-velha', requireGameNotBlocked('Jogo da Velha'), (req, res) => { ... })
// app.post('/api/ppt', requireGameNotBlocked('PPT'), (req, res) => { ... })
// app.post('/api/forca', requireGameNotBlocked('Forca'), (req, res) => { ... })
// app.post('/api/2048', requireGameNotBlocked('2048'), (req, res) => { ... })
// app.post('/api/memoria', requireGameNotBlocked('Memória'), (req, res) => { ... })
// app.post('/api/sudoku', requireGameNotBlocked('Sudoku'), (req, res) => { ... })
// app.post('/api/pong', requireGameNotBlocked('Pong'), (req, res) => { ... })
// app.post('/api/campo-minado', requireGameNotBlocked('Campo Minado'), (req, res) => { ... })
const logs = [
  { data: '2025-06-28 14:51', usuario: 'Administrador', acao: 'Criou sistema', detalhes: '-' }
];

// Removido duplicidade de declaração


// Body parser já está no topo

// Rotas protegidas para todos os jogos principais
app.post('/api/jogo-da-velha', requireGameNotBlocked('Jogo da Velha'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Jogo da Velha!' });
});
app.post('/api/ppt', requireGameNotBlocked('PPT'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao PPT!' });
});
app.post('/api/forca', requireGameNotBlocked('Forca'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Forca!' });
});
app.post('/api/2048', requireGameNotBlocked('2048'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao 2048!' });
});
app.post('/api/memoria', requireGameNotBlocked('Memória'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Memória!' });
});
app.post('/api/sudoku', requireGameNotBlocked('Sudoku'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Sudoku!' });
});
app.post('/api/pong', requireGameNotBlocked('Pong'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Pong!' });
});
app.post('/api/campo-minado', requireGameNotBlocked('Campo Minado'), (req, res) => {
  res.json({ success: true, message: 'Acesso permitido ao Campo Minado!' });
});

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
    // Filtra todas as partidas desse jogo
    const partidas = partidasLog.filter(p => p.jogo === nome);
    const totalPartidas = partidas.length;
    let totalVitorias = 0, totalDerrotas = 0, totalEmpates = 0;
    let totalTempo = 0, countTempo = 0;
    let totalPontuacao = 0, countPontuacao = 0;
    partidas.forEach(p => {
      if (p.resultado === 'vitoria') totalVitorias++;
      if (p.resultado === 'derrota') totalDerrotas++;
      if (p.resultado === 'empate') totalEmpates++;
      if (["Sudoku","Memória","Campo Minado","Pong"].includes(nome) && typeof p.tempo === 'number') {
        totalTempo += p.tempo;
        countTempo++;
      }
      if (nome === '2048' && typeof p.pontuacao === 'number') {
        totalPontuacao += p.pontuacao;
        countPontuacao++;
      }
    });
    // Busca status de bloqueio
    const bloqueado = (jogosStatus.find(j => j.nome === nome) || {}).bloqueado || false;
    // Porcentagens
    const pct = (v, t) => (t > 0 ? ((v / t) * 100).toFixed(1) : '0.0');
    // Tempo médio em segundos (para jogos de tempo)
    let mediaTempoConclusao = null;
    if (["Sudoku","Memória","Campo Minado","Pong"].includes(nome)) {
      mediaTempoConclusao = countTempo > 0 ? (totalTempo / countTempo).toFixed(2) : null;
    }
    // Pontuação média (2048)
    let mediaPontuacao = null;
    if (nome === '2048') {
      mediaPontuacao = countPontuacao > 0 ? (totalPontuacao / countPontuacao).toFixed(2) : null;
    }
    stats.push({
      nome,
      bloqueado,
      totalPartidas,
      vitorias: totalVitorias,
      derrotas: totalDerrotas,
      empates: totalEmpates,
      pctVitorias: pct(totalVitorias, totalPartidas),
      pctDerrotas: pct(totalDerrotas, totalPartidas),
      pctEmpates: pct(totalEmpates, totalPartidas),
      mediaTempoConclusao,
      mediaPontuacao
    });
  });

  res.json({ success: true, stats });
});

// Listar jogos (status apenas)
app.post('/admin/games', requireAdmin, (req, res) => {
  const jogosStatus = getJogosStatus();
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
  const jogosStatus = getJogosStatus();
  const jogo = jogosStatus.find(j => j.nome === nome);
  if (!jogo) return res.json({ success: false });
  jogo.bloqueado = true;
  addLog(req.body.email, 'Bloqueou jogo', nome);
  res.json({ success: true });
});
app.put('/admin/games/:nome/unblock', requireAdmin, (req, res) => {
  const nome = req.params.nome;
  const jogosStatus = getJogosStatus();
  const jogo = jogosStatus.find(j => j.nome === nome);
  if (!jogo) return res.json({ success: false });
  jogo.bloqueado = false;
  addLog(req.body.email, 'Desbloqueou jogo', nome);
  res.json({ success: true });
});

// --- RANKINGS AVANÇADO --- //
// Remove usuário de todos os rankings (admin)
app.post('/rankings/remove-all', requireAdmin, (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.json({ success: false });
  let count = 0;
  for (const jogo in advancedRankings) {
    for (const tipo in advancedRankings[jogo]) {
      for (const dif in advancedRankings[jogo][tipo]) {
        let arr = advancedRankings[jogo][tipo][dif];
        let idx;
        while ((idx = arr.findIndex(e => e.nome === nome)) !== -1) {
          arr.splice(idx, 1);
          count++;
        }
      }
    }
  }
  saveAdvancedRankings();
  addLog(req.body.email || nome, `Removeu "${nome}" de TODOS os rankings`, count);
  res.json({ success: true, removidos: count });
});

// Bloquear usuário em todos os rankings (admin)
app.post('/rankings/block-all', requireAdmin, (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.json({ success: false });
  let count = 0;
  for (const jogo in advancedRankings) {
    for (const tipo in advancedRankings[jogo]) {
      for (const dif in advancedRankings[jogo][tipo]) {
        let arr = advancedRankings[jogo][tipo][dif];
        arr.forEach(e => {
          if (e.nome === nome && e.status !== 'bloqueado') {
            e.status = 'bloqueado';
            count++;
          }
        });
      }
    }
  }
  saveAdvancedRankings();
  addLog(req.body.email || nome, `Bloqueou "${nome}" em TODOS os rankings`, count);
  res.json({ success: true, bloqueados: count });
});

// Desbloquear usuário em todos os rankings (admin)
app.post('/rankings/unblock-all', requireAdmin, (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.json({ success: false });
  let count = 0;
  for (const jogo in advancedRankings) {
    for (const tipo in advancedRankings[jogo]) {
      for (const dif in advancedRankings[jogo][tipo]) {
        let arr = advancedRankings[jogo][tipo][dif];
        arr.forEach(e => {
          if (e.nome === nome && e.status === 'bloqueado') {
            e.status = 'ativo';
            count++;
          }
        });
      }
    }
  }
  saveAdvancedRankings();
  addLog(req.body.email || nome, `Desbloqueou "${nome}" em TODOS os rankings`, count);
  res.json({ success: true, desbloqueados: count });
});
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

// Obter ranking avançado (admin ou público) - agora baseado no partidasLog
app.post('/rankings/advanced', (req, res) => {
  const { jogo, tipo, dificuldade } = req.body;
  if (!jogo || !tipo) return res.json({ success: false, ranking: [] });
  const keyDif = dificuldade || '';
  let arr = (advancedRankings[jogo] && advancedRankings[jogo][tipo] && advancedRankings[jogo][tipo][keyDif]) || [];
  let sorted = [];

  // 1. Mais Vitórias (todas as dificuldades somadas)
  if (tipo === 'mais_vitorias_total') {
    // Agrupa por nome, somando valor de todas as dificuldades
    let totalPorNome = {};
    let tipos = advancedRankings[jogo] && advancedRankings[jogo][tipo];
    if (tipos) {
      for (const dif in tipos) {
        for (const entry of tipos[dif]) {
          if (!totalPorNome[entry.nome]) totalPorNome[entry.nome] = 0;
          totalPorNome[entry.nome] += entry.valor || 0;
        }
      }
    }
    sorted = Object.entries(totalPorNome).map(([nome, valor]) => {
      // Pega status do usuário na dificuldade principal (se bloqueado em todas, mostra bloqueado)
      let status = 'ativo';
      for (const dif in tipos) {
        let found = tipos[dif].find(e => e.nome === nome);
        if (found && found.status === 'bloqueado') status = 'bloqueado';
      }
      return { nome, valor, status };
    });
    sorted.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
  }
  // 2. Mais Vitórias por dificuldade (só soma na dificuldade)
  else if (tipo === 'mais_vitorias_dificuldade') {
    sorted = [...arr];
    sorted.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
  }
  // 3. Mais Vitórias Consecutivas (por dificuldade, só conta sequência máxima)
  else if (tipo === 'mais_vitorias_consecutivas') {
    // Para cada usuário, pega o maior valor de sequência já registrada na dificuldade
    sorted = [...arr];
    sorted.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
  }
  // 4. Menor tempo (por dificuldade)
  else if (tipo === 'menor_tempo') {
    sorted = [...arr];
    sorted.sort((a, b) => (a.tempo ?? Infinity) - (b.tempo ?? Infinity));
  }
  // 5. Outros rankings (pontuação, etc)
  else {
    sorted = [...arr];
    sorted.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
  }
  res.json({ success: true, ranking: sorted });
});

// Adicionar entrada ao ranking avançado (public)
app.post('/rankings/advanced/add', (req, res) => {
  const { jogo, tipo, dificuldade, nome, valor, tempo, erros } = req.body;
  console.log('REQ /rankings/advanced/add', { jogo, tipo, dificuldade, nome, valor, tempo, erros });
  if (!jogo || !tipo || !nome || valor === undefined) {
    console.log('FALHA: Dados inválidos', { jogo, tipo, nome, valor });
    return res.json({ success: false, message: 'Dados inválidos.' });
  }
  // status padrão: ativo
  if (!advancedRankings[jogo]) {
    console.log('Criando jogo em advancedRankings:', jogo);
    advancedRankings[jogo] = {};
  }
  if (!advancedRankings[jogo][tipo]) {
    // Cria estrutura correta para tipos com dificuldade
    if (["mais_vitorias_dificuldade", "mais_vitorias_consecutivas", "menor_tempo"].includes(tipo)) {
      let difs = [];
      if (jogo === "Memória" || jogo === "Pong" || jogo === "Campo Minado") difs = ["Fácil", "Médio", "Difícil"];
      else if (jogo === "Sudoku") difs = ["Fácil", "Médio", "Difícil", "Muito Difícil"];
      else if (jogo === "Forca") difs = ["Fácil", "Médio", "Difícil"];
      else if (jogo === "Jogo da Velha") difs = ["Fácil", "Médio"];
      else difs = [dificuldade || ""];
      advancedRankings[jogo][tipo] = {};
      for (const d of difs) advancedRankings[jogo][tipo][d] = [];
    } else {
      advancedRankings[jogo][tipo] = { "": [] };
    }
  }
  const keyDif = (dificuldade !== undefined && dificuldade !== null) ? dificuldade : '';
  if (!advancedRankings[jogo][tipo][keyDif]) {
    console.log('Criando array para dificuldade:', keyDif, 'em', tipo);
    advancedRankings[jogo][tipo][keyDif] = [];
  }
  let arr = advancedRankings[jogo][tipo][keyDif];
  // Lógica especial para mais_vitorias_total: somar vitórias entre dificuldades
  if (tipo === 'mais_vitorias_total') {
    console.log('Adicionando mais_vitorias_total', { arrTotal: advancedRankings[jogo][tipo][''] });
    // Sempre salva na keyDif = '' (global)
    let arrTotal = advancedRankings[jogo][tipo][''];
    let idx = arrTotal.findIndex(e => e.nome === nome);
    if (idx !== -1) {
      arrTotal[idx].valor = (arrTotal[idx].valor || 0) + (valor || 0);
      // Mantém status, tempo, erros se existirem
      if (tempo !== undefined) arrTotal[idx].tempo = tempo;
      if (erros !== undefined) arrTotal[idx].erros = erros;
    } else {
      arrTotal.push({ nome, valor: valor || 0, tempo, erros, status: "ativo" });
    }
    addLog(nome, `Pontuou em ${jogo} [${tipo}]${dificuldade ? " ("+dificuldade+")" : ""}`, valor);
    saveAdvancedRankings();
    console.log('Salvo mais_vitorias_total:', advancedRankings[jogo][tipo]['']);
    return res.json({ success: true });
  }
  // Para mais_vitorias_dificuldade: soma vitórias na dificuldade
  if (tipo === 'mais_vitorias_dificuldade') {
    console.log('Adicionando mais_vitorias_dificuldade', { arr });
    let idx = arr.findIndex(e => e.nome === nome);
    if (idx !== -1) {
      arr[idx].valor = (arr[idx].valor || 0) + (valor || 0);
      if (tempo !== undefined) arr[idx].tempo = tempo;
      if (erros !== undefined) arr[idx].erros = erros;
    } else {
      arr.push({ nome, valor: valor || 0, tempo, erros, status: "ativo" });
    }
    addLog(nome, `Pontuou em ${jogo} [${tipo}]${dificuldade ? " ("+dificuldade+")" : ""}`, valor);
    saveAdvancedRankings();
    console.log('Salvo mais_vitorias_dificuldade:', arr);
    return res.json({ success: true });
  }
  // Para mais_vitorias_consecutivas: só atualiza se for recorde
  if (tipo === 'mais_vitorias_consecutivas') {
    console.log('Adicionando mais_vitorias_consecutivas', { arr });
    let idx = arr.findIndex(e => e.nome === nome);
    if (idx !== -1) {
      // Só atualiza se o novo valor for maior que o anterior
      if ((valor || 0) > (arr[idx].valor || 0)) {
        arr[idx].valor = valor;
        if (tempo !== undefined) arr[idx].tempo = tempo;
        if (erros !== undefined) arr[idx].erros = erros;
        addLog(nome, `Novo recorde de vitórias consecutivas em ${jogo}${dificuldade ? " ("+dificuldade+")" : ""}`, valor);
      } // Se não for recorde, não altera
    } else {
      arr.push({ nome, valor: valor || 0, tempo, erros, status: "ativo" });
      addLog(nome, `Entrou no ranking de vitórias consecutivas em ${jogo}${dificuldade ? " ("+dificuldade+")" : ""}`, valor);
    }
    saveAdvancedRankings();
    console.log('Salvo mais_vitorias_consecutivas:', arr);
    return res.json({ success: true });
  }
  // Lógica especial para menor_tempo: só atualiza se for menor tempo, ou mesmo tempo com menos erros
  if (tipo === 'menor_tempo') {
    let idx = arr.findIndex(e => e.nome === nome);
    if (idx !== -1) {
      let atual = arr[idx];
      // Só atualiza se tempo for menor, ou mesmo tempo com menos erros
      if (
        (typeof tempo === 'number' && (typeof atual.tempo !== 'number' || tempo < atual.tempo)) ||
        (typeof tempo === 'number' && tempo === atual.tempo && typeof erros === 'number' && (typeof atual.erros !== 'number' || erros < atual.erros))
      ) {
        arr[idx] = { nome, valor, tempo, erros, status: "ativo" };
        addLog(nome, `Novo recorde de menor tempo em ${jogo}${dificuldade ? " ("+dificuldade+")" : ""}`, tempo);
      } // Se não for melhor, não altera
    } else {
      arr.push({ nome, valor, tempo, erros, status: "ativo" });
      addLog(nome, `Entrou no ranking de menor tempo em ${jogo}${dificuldade ? " ("+dificuldade+")" : ""}`, tempo);
    }
    saveAdvancedRankings();
    console.log('Salvo menor_tempo:', arr);
    return res.json({ success: true });
  }
  // Para outros tipos, só sobrescreve se não for menor_tempo
  if (tipo !== 'menor_tempo') {
    let idx = arr.findIndex(e => e.nome === nome);
    if (idx !== -1) arr.splice(idx, 1);
    arr.push({ nome, valor, tempo, erros, status: "ativo" });
    addLog(nome, `Pontuou em ${jogo} [${tipo}]${dificuldade ? " ("+dificuldade+")" : ""}`, valor);
    saveAdvancedRankings();
    console.log('Salvo tipo generico', tipo, arr);
    return res.json({ success: true });
  }
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
    saveAdvancedRankings();
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
    saveAdvancedRankings();
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
    saveAdvancedRankings();
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
  saveAdvancedRankings();
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



// Middleware de erro global (deve ser o último)
app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.', error: err && err.message });
});