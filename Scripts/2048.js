// --- BLOQUEIO DINÂMICO DE JOGO (admin) --- //
const GAME_NAME = '2048';
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

// 2048.js
// Integrado ao ranking avançado via API
document.addEventListener('DOMContentLoaded', async () => {
  await checkUserBlocked();
  startBlockedUserPolling();
});

const tamanho = 4;
let tabuleiro;
let score = 0;
let gameOver = false;
let novaCelula = null; // Guardar a última célula criada para animar

let bloqueado = false; // Bloqueio para evitar spam
const TEMPO_COOLDOWN = 50; // ms

function iniciarJogo2048() {
  tabuleiro = Array.from({ length: tamanho }, () => Array(tamanho).fill(0));
  score = 0;
  gameOver = false;
  novaCelula = null;
  atualizarScore();
  adicionarNovoNumero();
  adicionarNovoNumero();
  desenharTabuleiro();
  if (typeof startGameSession === "function") startGameSession('2048');
}

function desenharTabuleiro() {
  const board = document.getElementById('tabuleiro-2048');
  board.innerHTML = '';
  for (let i = 0; i < tamanho; i++) {
    for (let j = 0; j < tamanho; j++) {
      const valor = tabuleiro[i][j];
      const celula = document.createElement('div');
      celula.className = 'celula-2048';
      celula.textContent = valor > 0 ? valor : '';
      celula.setAttribute('data-valor', valor);
      if (novaCelula && novaCelula.i === i && novaCelula.j === j) {
        celula.classList.add('nova');
      }
      board.appendChild(celula);
    }
  }
}

function adicionarNovoNumero() {
  const vazios = [];
  for (let i = 0; i < tamanho; i++) {
    for (let j = 0; j < tamanho; j++) {
      if (tabuleiro[i][j] === 0) vazios.push({ i, j });
    }
  }
  if (vazios.length === 0) return false;
  const escolhido = vazios[Math.floor(Math.random() * vazios.length)];
  tabuleiro[escolhido.i][escolhido.j] = Math.random() < 0.9 ? 2 : 4;
  novaCelula = { i: escolhido.i, j: escolhido.j };
  return true;
}

function atualizarScore() {
  document.getElementById('score').textContent = score;
}

function mover(direcao) {
  if (gameOver) return;
  novaCelula = null;

  let anterior = JSON.stringify(tabuleiro);

  for (let k = 0; k < direcao; k++) tabuleiro = girarTabuleiro(tabuleiro);

  for (let i = 0; i < tamanho; i++) {
    let linha = tabuleiro[i].filter(v => v !== 0);
    for (let j = 0; j < linha.length - 1; j++) {
      if (linha[j] === linha[j + 1]) {
        linha[j] *= 2;
        score += linha[j];
        linha[j + 1] = 0;
      }
    }
    linha = linha.filter(v => v !== 0);
    while (linha.length < tamanho) linha.push(0);
    tabuleiro[i] = linha;
  }

  for (let k = direcao; k < 4; k++) tabuleiro = girarTabuleiro(tabuleiro);

  if (JSON.stringify(tabuleiro) !== anterior) {
    if (podeMover()) {
      adicionarNovoNumero();
      desenharTabuleiro();
      atualizarScore();
      if (!podeMover()) {
        desenharTabuleiro();
        mostrarMensagemFinal("Fim de jogo!");
        if (typeof endGameSession === "function") endGameSession('2048', score);
        registrarPontuacaoRanking2048();
        gameOver = true;
      }
    } else {
      desenharTabuleiro();
      mostrarMensagemFinal("Fim de jogo!");
      if (typeof endGameSession === "function") endGameSession('2048', score);
      registrarPontuacaoRanking2048();
      gameOver = true;
    }
  } else {
    desenharTabuleiro();
    if (!podeMover()) {
      mostrarMensagemFinal("Fim de jogo!");
      if (typeof endGameSession === "function") endGameSession('2048', score);
      registrarPontuacaoRanking2048();
      gameOver = true;
    }
  }
}

function girarTabuleiro(matriz) {
  // Gira matriz 90 graus no sentido horário
  return matriz[0].map((_, i) => matriz.map(row => row[i]).reverse());
}

function podeMover() {
  for (let i = 0; i < tamanho; i++)
    for (let j = 0; j < tamanho; j++)
      if (tabuleiro[i][j] === 0) return true;
  for (let i = 0; i < tamanho; i++)
    for (let j = 0; j < tamanho; j++) {
      if (i < tamanho - 1 && tabuleiro[i][j] === tabuleiro[i + 1][j]) return true;
      if (j < tamanho - 1 && tabuleiro[i][j] === tabuleiro[i][j + 1]) return true;
    }
  return false;
}

function mostrarMensagemFinal(msg) {
  alert(msg);
}

function reiniciarJogo() {
  iniciarJogo2048();
}

// Função para registrar a pontuação no ranking ao final do jogo
async function registrarPontuacaoRanking2048() {
  // Salva partida real para estatísticas
  const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
  await fetch('http://localhost:3001/api/partida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jogo: '2048',
      resultado: 'vitoria',
      nome: user.nome,
      pontuacao: typeof score === 'number' ? score : null
    })
  });
  let tipo = "pontuacao";
  let valor = score;

  // Atualiza ranking usando função global
  await window.adicionarPontuacaoRanking("2048", user.nome, {
    tipo,
    dificuldade: "",
    valor
  });
}

document.addEventListener('keydown', function(e) {
  if (gameOver) return;
  if (bloqueado) return;
  let direcao = null;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    direcao = 3; // para cima
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    direcao = 1; // para baixo
  } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    direcao = 0; // para a esquerda
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    direcao = 2; // para a direita
  }
  if (direcao !== null) {
    bloqueado = true;
    mover(direcao);
    setTimeout(() => { bloqueado = false; }, TEMPO_COOLDOWN);
  }
});

document.addEventListener('DOMContentLoaded', iniciarJogo2048);