// --- BLOQUEIO DINÂMICO DE JOGO (admin) --- //
const GAME_NAME = 'Memória';
function checkGameBlocked() {
  fetch('http://localhost:3001/game/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: GAME_NAME })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.bloqueado) {
      showBlockedOverlay();
    } else {
      hideBlockedOverlay();
    }
  });
}
setInterval(checkGameBlocked, 1000);
function showBlockedOverlay() {
  if (!document.getElementById('blocked-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'blocked-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.color = '#fff';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = 9999;
    overlay.innerHTML = '<div style="text-align:center"><h2>Este jogo foi bloqueado pelo administrador.</h2><p>Você será redirecionado.</p></div>';
    document.body.appendChild(overlay);
    // Desabilita todos os elementos interativos da página imediatamente
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => { btn.disabled = true; btn.style.pointerEvents = 'none'; });
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(inp => { inp.disabled = true; inp.style.pointerEvents = 'none'; });
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(a => { a.onclickOld = a.onclick; a.onclick = function(e){e.preventDefault();}; a.style.pointerEvents = 'none'; a.style.opacity = '0.5'; });
    setTimeout(() => { window.location.href = "/Visual/index.html"; }, 3000);
  }
}
function hideBlockedOverlay() {
  const overlay = document.getElementById('blocked-overlay');
  if (overlay) overlay.remove();
  // Reabilita todos os elementos interativos caso o jogo seja desbloqueado sem recarregar
  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(btn => { btn.disabled = false; btn.style.pointerEvents = ''; });
  const allInputs = document.querySelectorAll('input, select, textarea');
  allInputs.forEach(inp => { inp.disabled = false; inp.style.pointerEvents = ''; });
  const allLinks = document.querySelectorAll('a');
  allLinks.forEach(a => { if(a.onclickOld){a.onclick = a.onclickOld; a.onclickOld = null;} a.style.pointerEvents = ''; a.style.opacity = ''; });
}

// memoria.js
// Integrado ao ranking avançado via API
document.addEventListener('DOMContentLoaded', async () => {
  await checkUserBlocked();
  startBlockedUserPolling();
});

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchesFound = 0;
let errorsCount = 0;
let totalPairs = 0;
let timerSec = 0;
let timerInterval = null;
let dificuldadeAtual = 'facil';

function iniciarJogo() {
  const tabuleiro = document.getElementById('tabuleiro');
  const errosSpan = document.getElementById('erros');
  const acertosSpan = document.getElementById('acertos');
  const timerSpan = document.getElementById('timer');

  // Determinar dificuldade
  const dificuldade = document.getElementById('dificuldade').value;
  dificuldadeAtual = dificuldade; // Salva globalmente

  if (typeof startGameSession === "function") startGameSession('memoria');

  // Reset estado do jogo
  tabuleiro.innerHTML = '';
  firstCard = null;
  secondCard = null;
  lockBoard = true; // bloquear clicks durante reveal inicial
  matchesFound = 0;
  errorsCount = 0;
  timerSec = 0;

  // Atualiza UI
  errosSpan.textContent = errorsCount;
  acertosSpan.textContent = matchesFound;
  timerSpan.textContent = formatTime(timerSec);

  // Inicia contador de tempo
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSec++;
    if (timerSec >= 300) { // 5 minutos
      clearInterval(timerInterval);
      lockBoard = true;
      alert('Tempo esgotado! Fim de jogo.');
      if (typeof endGameSession === "function") endGameSession('memoria', 'derrota', dificuldadeAtual);
      return;
    }
    timerSpan.textContent = formatTime(timerSec);
  }, 1000);

  let startIdx, pairCount, cols;
  if (dificuldade === 'facil') {
    startIdx = 1; pairCount = 8; cols = 4;
  } else if (dificuldade === 'medio') {
    startIdx = 9; pairCount = 12; cols = 6;
  } else {
    startIdx = 21; pairCount = 18; cols = 6;
  }
  totalPairs = pairCount;

  // Construir e embaralhar índices
  const indices = [];
  for (let i = 0; i < pairCount; i++) {
    indices.push(startIdx + i, startIdx + i);
  }
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Configurar grid
  tabuleiro.style.gridTemplateColumns = `repeat(${cols}, 80px)`;

  // Criar cartas
  indices.forEach(idx => {
    const card = document.createElement('div');
    card.classList.add('carta');
    card.dataset.index = idx;

    const img = document.createElement('img');
    img.src = `/frontend/img/img${idx}.jpeg`;
    img.alt = `Imagem ${idx}`;
    card.appendChild(img);

    card.addEventListener('click', flipCard);
    tabuleiro.appendChild(card);
  });

  // Reveal inicial por 5s
  const allCards = Array.from(document.querySelectorAll('.carta'));
  allCards.forEach(card => card.classList.add('virada'));

  setTimeout(() => {
    allCards.forEach(card => card.classList.remove('virada'));
    lockBoard = false; // desbloquear clicks após reveal
  }, 5000);
}

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  this.classList.add('virada');

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  lockBoard = true;
  checkForMatch();
}

function checkForMatch() {
  const isMatch = firstCard.dataset.index === secondCard.dataset.index;
  const errosSpan = document.getElementById('erros');
  const acertosSpan = document.getElementById('acertos');

  if (isMatch) {
    // Acerto
    disableCards();
    matchesFound++;
    acertosSpan.textContent = matchesFound;

    if (matchesFound === totalPairs) {
      clearInterval(timerInterval);
      setTimeout(() => {
        alert(`Parabéns! Você venceu em ${formatTime(timerSec)} com ${errorsCount} erros.`);
        if (typeof endGameSession === "function") endGameSession('memoria', 'vitoria', dificuldadeAtual);
        registrarPontuacaoRankingMemoria();
      }, 500);
    } else {
      lockBoard = false;
    }
  } else {
    // Erro
    errorsCount++;
    errosSpan.textContent = errorsCount;
    unflipCards();
  }
}

function disableCards() {
  firstCard.removeEventListener('click', flipCard);
  secondCard.removeEventListener('click', flipCard);
  resetBoard();
}

function unflipCards() {
  setTimeout(() => {
    firstCard.classList.remove('virada');
    secondCard.classList.remove('virada');
    resetBoard();
  }, 1000);
}

function resetBoard() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

// Formata segundos em HH:MM:SS
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const hDisplay = hrs > 0 ? String(hrs).padStart(2, '0') + ':' : '';
  const mDisplay = String(mins).padStart(2, '0') + ':';
  const sDisplay = String(secs).padStart(2, '0');
  return hDisplay + mDisplay + sDisplay;
}

// INTEGRAÇÃO RANKING - registra score ao vencer
async function registrarPontuacaoRankingMemoria() {
  // Pega o usuário antes de qualquer uso
  const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
  let dificuldadeLabel = dificuldadeAtual === 'facil' ? 'Fácil' :
                         dificuldadeAtual === 'medio' ? 'Médio' : 'Difícil';

  // Salva partida real para estatísticas (painel admin)
  await fetch('http://localhost:3001/api/partida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jogo: 'Memória',
      resultado: 'vitoria',
      nome: user.nome,
      tempo: typeof timerSec === 'number' ? timerSec : null,
      dificuldade: dificuldadeLabel,
      erros: errorsCount
    })
  });

  // 1. Ranking geral (mais vitórias totais)
  await window.adicionarPontuacaoRanking("Memória", user.nome, {
    tipo: "mais_vitorias_total",
    dificuldade: "",
    valor: 1
  });

  // 2. Ranking por dificuldade (mais vitórias por dificuldade)
  await window.adicionarPontuacaoRanking("Memória", user.nome, {
    tipo: "mais_vitorias_dificuldade",
    dificuldade: dificuldadeLabel,
    valor: 1
  });

  // 3. Ranking menor tempo por dificuldade (só envia se tempo > 0)
  if (typeof timerSec === 'number' && timerSec > 0) {
    await window.adicionarPontuacaoRanking("Memória", user.nome, {
      tipo: "menor_tempo",
      dificuldade: dificuldadeLabel,
      tempo: timerSec,
      erros: errorsCount,
      valor: 1
    });
  }
}

// Chame esta função ao finalizar o jogo para registrar a pontuação no ranking
// Exemplo:
// adicionarPontuacaoRanking('Memória', user.nome, { tipo: 'mais_vitorias_total', valor: 1, dificuldade: dificuldadeSelecionada, tempo: tempoFinal, erros: errosCometidos });
