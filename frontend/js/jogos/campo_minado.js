// --- BLOQUEIO DINÂMICO DE JOGO (admin) --- //
const GAME_NAME = 'Campo Minado';

// Definição global do usuário para evitar duplicidade e garantir consistência
const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
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
// campo_minado.js
// Integrado ao ranking avançado via API

let board = [];
let rows = 0;
let cols = 0;
let totalMines = 0;
let flagsLeft = 0;
let timerSec = 0;
let timerInterval = null;
let gameOver = false;
let firstClick = true;
let dificuldadeAtual = "facil"; // INTEGRAÇÃO ESTATÍSTICAS

document.addEventListener('DOMContentLoaded', async () => {
  await checkUserBlocked();
  startBlockedUserPolling();

  const btnIniciar = document.getElementById('btn-iniciar');
  const btnReiniciar = document.getElementById('btn-reiniciar');

  btnIniciar.addEventListener('click', () => {
    document.getElementById('tela-inicial').style.display = 'none';
    document.getElementById('painel-topo').style.display = 'flex';
    document.getElementById('jogo').style.display = 'block';
    iniciarJogo();
  });

  btnReiniciar.addEventListener('click', () => {
    document.getElementById('painel-topo').style.display = 'none';
    document.getElementById('jogo').style.display = 'none';
    document.getElementById('tela-inicial').style.display = 'flex';
    clearInterval(timerInterval);
  });
});

function iniciarJogo() {
  const dificuldade = document.getElementById('dificuldade').value;
  dificuldadeAtual = dificuldade;

  if (typeof startGameSession === "function") startGameSession('campo_minado');

  const tempoSpan = document.getElementById('tempo');
  const bandeirasSpan = document.getElementById('bandeiras');
  const minasSpan = document.getElementById('minas');
  const tabuleiro = document.getElementById('tabuleiro');

  if (dificuldade === 'facil') {
    rows = 8;
    cols = 8;
    totalMines = 10;
  } else if (dificuldade === 'medio') {
    rows = 12;
    cols = 12;
    totalMines = 20;
  } else {
    rows = 16;
    cols = 16;
    totalMines = 40;
  }
  flagsLeft = totalMines;
  gameOver = false;
  timerSec = 0;
  firstClick = true;

  tempoSpan.textContent = formatTime(timerSec);
  bandeirasSpan.textContent = flagsLeft;
  minasSpan.textContent = totalMines;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameOver) return;
    timerSec++;
    if (timerSec >= 300) {
      endGame(false);
      return;
    }
    tempoSpan.textContent = formatTime(timerSec);
  }, 1000);

  tabuleiro.innerHTML = '';
  tabuleiro.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
  board = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.classList.add('celula');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', onLeftClick);
      cell.addEventListener('contextmenu', onRightClick);
      tabuleiro.appendChild(cell);
      row.push({
        element: cell,
        hasMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      });
    }
    board.push(row);
  }

  tabuleiro.oncontextmenu = e => e.preventDefault();
}

function placeMinesWithSafeCell(safeR, safeC) {
  let placed = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      board[r][c].hasMine = false;
    }
  }
  while (placed < totalMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].hasMine) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    board[r][c].hasMine = true;
    placed++;
  }
}

function calculateNeighbors() {
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let count = 0;
      if (board[r][c].hasMine) {
        board[r][c].neighborMines = -1;
        continue;
      }
      directions.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < rows &&
          nc >= 0 && nc < cols &&
          board[nr][nc].hasMine
        ) {
          count++;
        }
      });
      board[r][c].neighborMines = count;
    }
  }
}

function onLeftClick(e) {
  if (gameOver) return;
  const r = parseInt(this.dataset.row);
  const c = parseInt(this.dataset.col);
  const cellObj = board[r][c];

  if (cellObj.isRevealed || cellObj.isFlagged) return;

  if (firstClick) {
    placeMinesWithSafeCell(r, c);
    calculateNeighbors();
    firstClick = false;
  }

  revealCell(r, c);
  checkWin();
}

function onRightClick(e) {
  e.preventDefault();
  if (gameOver || firstClick) return;
  const r = parseInt(this.dataset.row);
  const c = parseInt(this.dataset.col);
  const cellObj = board[r][c];

  if (cellObj.isRevealed) return;
  if (!cellObj.isFlagged && flagsLeft === 0) return;

  cellObj.isFlagged = !cellObj.isFlagged;
  if (cellObj.isFlagged) {
    this.classList.add('bandeira');
    flagsLeft--;
  } else {
    this.classList.remove('bandeira');
    flagsLeft++;
  }
  document.getElementById('bandeiras').textContent = flagsLeft;
  checkWin();
}

function revealCell(r, c) {
  const cellObj = board[r][c];
  const cellEl = cellObj.element;
  if (cellObj.isRevealed || cellObj.isFlagged) return;
  cellObj.isRevealed = true;
  cellEl.classList.add('revelada');

  if (cellObj.hasMine) {
    cellEl.classList.add('bomba');
    endGame(false);
    return;
  }

  if (cellObj.neighborMines > 0) {
    cellEl.textContent = cellObj.neighborMines;
    return;
  }

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  directions.forEach(([dr, dc]) => {
    const nr = r + dr;
    const nc = c + dc;
    if (
      nr >= 0 && nr < rows &&
      nc >= 0 && nc < cols
    ) {
      revealCell(nr, nc);
    }
  });
}

function revealAllMines() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellObj = board[r][c];
      if (cellObj.hasMine) {
        cellObj.element.classList.add('bomba');
      }
    }
  }
}

function checkWin() {
  let revealedCount = 0;
  let correctFlags = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellObj = board[r][c];
      if (cellObj.isRevealed && !cellObj.hasMine) revealedCount++;
      if (cellObj.isFlagged && cellObj.hasMine) correctFlags++;
    }
  }

  if (
    revealedCount === rows * cols - totalMines ||
    correctFlags === totalMines
  ) {
    endGame(true);
  }
}

function endGame(vencedor) {
  gameOver = true;
  clearInterval(timerInterval);
  revealAllMines();

  if (typeof endGameSession === "function") {
    endGameSession('campo_minado', vencedor ? 'vitoria' : 'derrota', dificuldadeAtual);
  }

  registrarPontuacaoRankingCampoMinado(vencedor);

  setTimeout(async () => {
    if (vencedor) {
      // Busca menor tempo do usuário para a dificuldade atual
      // user já está definido globalmente
      let dificuldadeLabel =
        dificuldadeAtual === 'facil' ? 'Fácil' :
        dificuldadeAtual === 'medio' ? 'Médio' : 'Difícil';
      let menorTempo = null;
      try {
        const res = await fetch("http://localhost:3001/rankings/advanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jogo: "Campo Minado",
            tipo: "menor_tempo",
            dificuldade: dificuldadeLabel
          })
        });
        const data = await res.json();
        if (data.ranking && Array.isArray(data.ranking)) {
          const registro = data.ranking.find(e => e.nome === user.nome);
          if (registro && typeof registro.tempo === "number") menorTempo = registro.tempo;
        }
      } catch {}
      let tempoMsg = menorTempo !== null ? `\nSeu melhor tempo nesta dificuldade: ${formatTime(menorTempo)}` : '';
      alert('Parabéns! Você venceu!' + tempoMsg);
    } else {
      alert('Você perdeu!');
    }
    document.getElementById('btn-reiniciar').style.display = 'block';
  }, 200);
}

// INTEGRAÇÃO RANKING AVANÇADO
async function registrarPontuacaoRankingCampoMinado(vitoria) {
  // Salva partida real para estatísticas
  // user já está definido globalmente
  let dificuldadeLabel = 
    dificuldadeAtual === 'facil' ? 'Fácil' : 
    dificuldadeAtual === 'medio' ? 'Médio' : 'Difícil';
  await fetch('http://localhost:3001/api/partida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jogo: 'Campo Minado',
      resultado: vitoria ? 'vitoria' : 'derrota',
      nome: user.nome,
      tempo: typeof timerSec === 'number' ? timerSec : null,
      erros: 0, // Se quiser implementar contagem de erros, troque aqui
      dificuldade: dificuldadeLabel
    })
  });
  if (vitoria) {
    // 1. Ranking geral (mais vitórias totais)
    await window.adicionarPontuacaoRanking("Campo Minado", user.nome, {
      tipo: "mais_vitorias_total",
      dificuldade: "",
      valor: 1
    });
    // 2. Ranking por dificuldade (mais vitórias por dificuldade)
    await window.adicionarPontuacaoRanking("Campo Minado", user.nome, {
      tipo: "mais_vitorias_dificuldade",
      dificuldade: dificuldadeLabel,
      valor: 1
    });
    // 3. Ranking menor tempo por dificuldade (só envia se tempo > 0)
    if (typeof timerSec === 'number' && timerSec > 0) {
      await window.adicionarPontuacaoRanking("Campo Minado", user.nome, {
        tipo: "menor_tempo",
        dificuldade: dificuldadeLabel,
        tempo: timerSec,
        erros: 0,
        valor: 1
      });
    }
  }
}

// Chame esta função ao finalizar o jogo para registrar a pontuação no ranking
// Exemplo:
// adicionarPontuacaoRanking('Campo Minado', user.nome, { tipo: 'menor_tempo', valor: null, dificuldade: dificuldadeSelecionada, tempo: tempoFinal, erros: errosCometidos });

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mDisplay = String(mins).padStart(2, '0') + ':';
  const sDisplay = String(secs).padStart(2, '0');
  return mDisplay + sDisplay;
}