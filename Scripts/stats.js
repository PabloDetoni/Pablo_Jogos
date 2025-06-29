// stats.js

const statsSession = {};

const jogos = [
  { chave: 'velha', nome: 'Jogo da Velha', empates: true },
  { chave: 'forca', nome: 'Forca', empates: true },
  { chave: 'ppt', nome: 'Pedra, Papel e Tesoura', empates: true },
  { chave: 'sudoku', nome: 'Sudoku', empates: false, dificuldades: ['facil','medio','dificil','mtDificil'] },
  { chave: 'campo_minado', nome: 'Campo Minado', empates: false, dificuldades: ['facil','medio','dificil'] },
  { chave: 'pong', nome: 'Pong', empates: true, dificuldades: ['facil','medio','dificil'] }, // <-- corrigido aqui
  { chave: 'memoria', nome: 'Jogo da Memória', empates: false, dificuldades: ['facil','medio','dificil'] },
  { chave: '2048', nome: '2048', tipo: 'highscore' }
];

function formatDuration(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return '-';
  const parts = [];
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  if (seconds || parts.length === 0) parts.push(`${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(' e ');
  return parts.slice(0, -1).join(', ') + ' e ' + parts.slice(-1);
}

// Chamar ao iniciar o jogo
function startGameSession(gameKey) {
  statsSession[gameKey] = Date.now();
}

/**
 * Para jogos comuns com vitória/derrota, empates opcionais
 * Para jogos com dificuldades (Sudoku, Memória, Campo Minado): passar dificuldade (ex: endGameSession('sudoku', 'vitoria', 'facil'))
 * Para 2048: outcome = pontuação (número), ex: endGameSession('2048', 3580)
 */
function endGameSession(gameKey, outcome, dificuldade=null) {
  const startTime = statsSession[gameKey];
  let elapsed = 0;
  if (startTime) elapsed = Math.floor((Date.now() - startTime) / 1000);

  const storageKey = `stats_${gameKey}`;
  let stats = JSON.parse(localStorage.getItem(storageKey)) || {};

  // 2048: outcome = pontuação
  if (gameKey === '2048') {
    stats.tempo = (stats.tempo || 0) + elapsed;
    stats.highscore = Math.max(Number(stats.highscore || 0), Number(outcome));
    localStorage.setItem(storageKey, JSON.stringify(stats));
    return;
  }

  // Jogos de dificuldade (Sudoku, Memória, Campo Minado)
  const jogoInfo = jogos.find(j => j.chave === gameKey);
  if (jogoInfo && jogoInfo.dificuldades && dificuldade) {
    stats.tempo = (stats.tempo || 0) + elapsed;
    stats.vitorias = (stats.vitorias || 0) + (outcome === 'vitoria' ? 1 : 0);
    stats.derrotas = (stats.derrotas || 0) + (outcome === 'derrota' ? 1 : 0);

    // Menor tempo só conta para vitória
    if (outcome === 'vitoria') {
      if (!stats.melhortempo) stats.melhortempo = {};
      const anterior = stats.melhortempo[dificuldade];
      if (!anterior || elapsed < anterior) stats.melhortempo[dificuldade] = elapsed;
    }
    localStorage.setItem(storageKey, JSON.stringify(stats));
    return;
  }

  // Jogos comuns (vitória/derrota/empate)
  stats.tempo = (stats.tempo || 0) + elapsed;
  stats.vitorias = (stats.vitorias || 0) + (outcome === 'vitoria' ? 1 : 0);
  stats.derrotas = (stats.derrotas || 0) + (outcome === 'derrota' ? 1 : 0);
  if (jogoInfo && jogoInfo.empates)
    stats.empates = (stats.empates || 0) + (outcome === 'empate' ? 1 : 0);

  localStorage.setItem(storageKey, JSON.stringify(stats));
}

// Exibe as estatísticas na tela
function carregarStats() {
  jogos.forEach(({ chave, empates, tipo, dificuldades }) => {
    const stats = JSON.parse(localStorage.getItem(`stats_${chave}`)) || {};
    // Tempo total
    document.getElementById(`${chave}-tempo`).textContent = formatDuration(stats.tempo);

    // Pontuação máxima (2048)
    if (tipo === 'highscore') {
      document.getElementById(`${chave}-highscore`).textContent = stats.highscore || 0;
      return;
    }

    // Estatísticas padrão
    if (typeof stats.vitorias !== "undefined")
      document.getElementById(`${chave}-vitorias`).textContent = stats.vitorias;
    if (typeof stats.derrotas !== "undefined")
      document.getElementById(`${chave}-derrotas`).textContent = stats.derrotas;
    if (empates && typeof stats.empates !== "undefined") {
      const empEl = document.getElementById(`${chave}-empates`);
      if (empEl) empEl.textContent = stats.empates;
    }

    // Menor tempo por dificuldade
    if (dificuldades) {
      if (stats.melhortempo) {
        dificuldades.forEach(dif => {
          const el = document.getElementById(`${chave}-melhortempo-${dif}`);
          if (el) el.textContent = typeof stats.melhortempo[dif] !== "undefined" && stats.melhortempo[dif] !== null
            ? formatDuration(stats.melhortempo[dif])
            : '-';
        });
      } else {
        dificuldades.forEach(dif => {
          const el = document.getElementById(`${chave}-melhortempo-${dif}`);
          if (el) el.textContent = '-';
        });
      }
    }
  });
}

function resetarStats() {
  jogos.forEach(({ chave }) => {
    localStorage.removeItem(`stats_${chave}`);
  });
  carregarStats();
}

if (window.location.pathname.endsWith('estatisticas.html')) {
  document.addEventListener('DOMContentLoaded', carregarStats);
}