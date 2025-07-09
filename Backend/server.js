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
const { users, jogosStatus, advancedRankings, partidasLog } = require('./server-helpers');


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

  // Mapeamento dos tipos do frontend para tipos internos
  const tipoMap = {
    'mais_vitorias_total': 'vitorias',
    'mais_vitorias_dificuldade': 'vitorias',
    'mais_vitorias_consecutivas': 'vitorias_consecutivas',
    'pontuacao': 'pontuacao',
    'menor_tempo': 'menor_tempo'
  };
  const tipoInterno = tipoMap[tipo] || tipo;

  let entries = [];
  if (tipoInterno === 'vitorias') {
    // Ranking por número de vitórias (total ou por dificuldade)
    const vitPorUser = {};
    partidasLog.forEach(p => {
      if (
        p.jogo === jogo &&
        p.resultado === 'vitoria' &&
        (!dificuldade || p.dificuldade === dificuldade)
      ) {
        vitPorUser[p.nome] = (vitPorUser[p.nome] || 0) + 1;
      }
    });
    entries = Object.entries(vitPorUser).map(([nome, valor]) => ({ nome, valor }));
    entries.sort((a, b) => b.valor - a.valor);
  } else if (tipoInterno === 'vitorias_consecutivas') {
    // Ranking por maior sequência de vitórias consecutivas (por dificuldade)
    const seqPorUser = {};
    const lastSeq = {};
    partidasLog.forEach(p => {
      if (p.jogo === jogo && (!dificuldade || p.dificuldade === dificuldade)) {
        if (!seqPorUser[p.nome]) seqPorUser[p.nome] = 0;
        if (!lastSeq[p.nome]) lastSeq[p.nome] = 0;
        if (p.resultado === 'vitoria') {
          lastSeq[p.nome] = (lastSeq[p.nome] || 0) + 1;
          if (lastSeq[p.nome] > seqPorUser[p.nome]) seqPorUser[p.nome] = lastSeq[p.nome];
        } else {
          lastSeq[p.nome] = 0;
        }
      }
    });
    entries = Object.entries(seqPorUser).map(([nome, valor]) => ({ nome, valor }));
    entries.sort((a, b) => b.valor - a.valor);
  } else if (tipoInterno === 'pontuacao') {
    // Ranking por maior pontuação
    const pontPorUser = {};
    partidasLog.forEach(p => {
      if (p.jogo === jogo && typeof p.pontuacao === 'number') {
        if (!pontPorUser[p.nome] || p.pontuacao > pontPorUser[p.nome]) {
          pontPorUser[p.nome] = p.pontuacao;
        }
      }
    });
    entries = Object.entries(pontPorUser).map(([nome, valor]) => ({ nome, valor }));
    entries.sort((a, b) => b.valor - a.valor);
  } else if (tipoInterno === 'menor_tempo') {
    // Ranking por menor tempo, considerando dificuldade
    const tempoPorUser = {};
    partidasLog.forEach(p => {
      if (
        p.jogo === jogo &&
        typeof p.tempo === 'number' &&
        p.resultado === 'vitoria' &&
        ((dificuldade && p.dificuldade === dificuldade) || (!dificuldade && (!p.dificuldade || p.dificuldade === '')))
      ) {
        if (!tempoPorUser[p.nome] || p.tempo < tempoPorUser[p.nome]) {
          tempoPorUser[p.nome] = p.tempo;
        }
      }
    });
    // Para exibir também erros, se existirem, busque o registro completo
    entries = Object.entries(tempoPorUser).map(([nome, tempo]) => {
      // Busca o registro da partida com o menor tempo desse usuário e dificuldade
      const partida = partidasLog.find(p =>
        p.jogo === jogo &&
        typeof p.tempo === 'number' &&
        p.resultado === 'vitoria' &&
        p.nome === nome &&
        p.tempo === tempo &&
        ((dificuldade && p.dificuldade === dificuldade) || (!dificuldade && (!p.dificuldade || p.dificuldade === '')))
      );
      return {
        nome,
        valor: tempo, // para compatibilidade com frontend
        tempo,
        erros: partida && typeof partida.erros === 'number' ? partida.erros : null
      };
    });
    entries.sort((a, b) => a.tempo - b.tempo);
  } else {
    // Outros tipos: empates, derrotas, etc
    const countPorUser = {};
    partidasLog.forEach(p => {
      if (p.jogo === jogo && p.resultado === tipoInterno) {
        countPorUser[p.nome] = (countPorUser[p.nome] || 0) + 1;
      }
    });
    entries = Object.entries(countPorUser).map(([nome, valor]) => ({ nome, valor }));
    entries.sort((a, b) => b.valor - a.valor);
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



// Middleware de erro global (deve ser o último)
app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.', error: err && err.message });
});