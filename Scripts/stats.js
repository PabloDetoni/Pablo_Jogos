// stats.js
// Arquivo único de estatísticas para todos os jogos

const statsSession = {};

/**
 * Converte um total de segundos em uma string legível:
 * - Até 59s: "X segundos"
 * - De 1min a <1h: "X minutos e Y segundos"
 * - ≥1h: "H horas, M minutos e S segundos" (omitindo unidades zeradas)
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatDuration(totalSeconds) {
  const parts = [];

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours) {
    parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  }
  if (minutes) {
    parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  }
  if (seconds || parts.length === 0) {
    // mostra segundos sempre se for <1min, ou se for o único componente restante
    parts.push(`${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`);
  }

  if (parts.length === 1) {
    return parts[0];
  } else if (parts.length === 2) {
    return parts.join(' e ');
  } else {
    // 3 ou mais (no nosso caso, máximo 3): junta com vírgulas e 'e' antes do último
    return parts.slice(0, -1).join(', ') + ' e ' + parts.slice(-1);
  }
}

/**
 * Inicia sessão de tempo para um jogo específico.
 * @param {string} gameKey - Chave do jogo (e.g., 'velha', 'forca', 'ppt').
 */
function startGameSession(gameKey) {
  statsSession[gameKey] = Date.now();
}

/**
 * Termina sessão de tempo e registra o resultado no localStorage.
 * @param {string} gameKey - Chave do jogo para armazenamento.
 * @param {'vitoria'|'derrota'|'empate'} outcome - Resultado da partida.
 */
function endGameSession(gameKey, outcome) {
  const startTime = statsSession[gameKey];
  if (!startTime) return;

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const storageKey = `stats_${gameKey}`;
  const stats = JSON.parse(localStorage.getItem(storageKey)) || {
    tempo: 0,
    vitorias: 0,
    derrotas: 0,
    empates: 0
  };

  stats.tempo += elapsed;
  if (outcome === 'vitoria') stats.vitorias++;
  else if (outcome === 'derrota') stats.derrotas++;
  else if (outcome === 'empate') stats.empates++;

  localStorage.setItem(storageKey, JSON.stringify(stats));
}

/**
 * Carrega as estatísticas na página estatisticas.html.
 * Deve ser chamado após o DOM carregar.
 */
function carregarStats() {
  ['velha', 'forca', 'ppt'].forEach(gameKey => {
    const storageKey = `stats_${gameKey}`;
    const stats = JSON.parse(localStorage.getItem(storageKey)) || {
      tempo: 0,
      vitorias: 0,
      derrotas: 0,
      empates: 0
    };

    // formata o tempo antes de exibir
    document.getElementById(`${gameKey}-tempo`).textContent = formatDuration(stats.tempo);
    document.getElementById(`${gameKey}-vitorias`).textContent = stats.vitorias;
    document.getElementById(`${gameKey}-derrotas`).textContent = stats.derrotas;
    const empEl = document.getElementById(`${gameKey}-empates`);
    if (empEl) empEl.textContent = stats.empates;
  });
}

/**
 * Remove todas as estatísticas do localStorage e recarrega a exibição.
 */
function resetarStats() {
  ['velha', 'forca', 'ppt'].forEach(gameKey => {
    localStorage.removeItem(`stats_${gameKey}`);
  });
  carregarStats();
}

// Se estivermos em estatisticas.html, carregar dados ao iniciar
if (window.location.pathname.endsWith('estatisticas.html')) {
  document.addEventListener('DOMContentLoaded', carregarStats);
}
