// --- BLOQUEIO DINÂMICO DE JOGO (admin) --- //
const GAME_NAME = 'Pong';
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

// pong.js
// Integrado ao ranking avançado via API
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (typeof checkUserBlocked === 'function') await checkUserBlocked();
    if (typeof startBlockedUserPolling === 'function') startBlockedUserPolling();
  } catch (e) {
    console.error('Erro ao checar usuário bloqueado:', e);
  }
});


let modoIA = false;
let dificuldade = 'facil';
let dificuldadeAtual = 'facil';
let gameInterval;
let jogador1Up = false, jogador1Down = false, jogador2Up = false, jogador2Down = false;

// Definição global do usuário para evitar erro de escopo
const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };

let canvas, ctx;
const largura = 600, altura = 400;
const larguraRaquete = 10, alturaRaquete = 80;
const velocidadeRaquete = 6;
const raioBola = 8;
let raquete1, raquete2, bola, pontos1, pontos2, jogoEncerrado = false;

const VELOCIDADE_INICIAL = 4;
const dificuldadeIA = {
  facil: 2.5,
  medio: 4,
  dificil: 6.5
};

let tempoPong = 0;
let intervaloTempoPong = null;

function alternarDificuldade() {
  const modo = document.getElementById('modoJogo').value;
  document.getElementById('dificuldade-container').style.display = (modo === 'ia') ? 'block' : 'none';
  const spanJ2 = document.getElementById('controles-jogador2');
  if (spanJ2) spanJ2.style.display = (modo === 'ia') ? 'none' : 'inline';
}

function iniciarJogo() {
  const modo = document.getElementById('modoJogo').value;
  modoIA = (modo === 'ia');
  dificuldade = document.getElementById('dificuldadeIA').value;
  dificuldadeAtual = dificuldade;

  document.getElementById('menu-inicial').style.display = 'none';
  document.getElementById('jogo').style.display = 'block';

  const spanJ2 = document.getElementById('controles-jogador2');
  if (spanJ2) spanJ2.style.display = modoIA ? 'none' : 'inline';

  if (typeof startGameSession === "function") startGameSession('pong');
  tempoPong = 0;
  if (intervaloTempoPong) clearInterval(intervaloTempoPong);
  intervaloTempoPong = setInterval(() => { tempoPong++; }, 1000);

  reiniciarJogo();
}

function reiniciarJogo() {
  clearInterval(gameInterval);

  raquete1 = { x: 10, y: altura / 2 - alturaRaquete / 2, w: larguraRaquete, h: alturaRaquete };
  raquete2 = { x: largura - 20, y: altura / 2 - alturaRaquete / 2, w: larguraRaquete, h: alturaRaquete };
  bola = { x: largura / 2, y: altura / 2, vx: 0, vy: 0 };
  pontos1 = 0;
  pontos2 = 0;
  jogoEncerrado = false;
  desenhar();

  setTimeout(() => {
    let dir = (Math.random() > 0.5 ? VELOCIDADE_INICIAL : -VELOCIDADE_INICIAL);
    bola.vx = dir;
    bola.vy = (Math.random() * 4 - 2);
    clearInterval(gameInterval);
    gameInterval = setInterval(atualizar, 1000 / 60);
  }, 1000);
}

function resetarRaquetes() {
  raquete1.y = altura / 2 - alturaRaquete / 2;
  raquete2.y = altura / 2 - alturaRaquete / 2;
}

function resetarBola(direcao) {
  bola.x = largura / 2;
  bola.y = altura / 2;
  bola.vx = 0;
  bola.vy = 0;
  resetarRaquetes();
  desenhar();

  clearInterval(gameInterval);

  setTimeout(() => {
    bola.vx = direcao > 0 ? VELOCIDADE_INICIAL : -VELOCIDADE_INICIAL;
    bola.vy = (Math.random() * 4 - 2);
    clearInterval(gameInterval);
    gameInterval = setInterval(atualizar, 1000 / 60);
  }, 1000);
}

function atualizar() {
  moverRaquetes();
  moverBola();
  desenhar();
  checarVencedor();
}

function moverRaquetes() {
  if (jogador1Up) raquete1.y -= velocidadeRaquete;
  if (jogador1Down) raquete1.y += velocidadeRaquete;
  raquete1.y = Math.max(0, Math.min(altura - alturaRaquete, raquete1.y));

  if (modoIA) {
    iaMove();
  } else {
    if (jogador2Up) raquete2.y -= velocidadeRaquete;
    if (jogador2Down) raquete2.y += velocidadeRaquete;
    raquete2.y = Math.max(0, Math.min(altura - alturaRaquete, raquete2.y));
  }
}

function iaMove() {
  const alvo = bola.y - (alturaRaquete / 2);
  if (raquete2.y < alvo) {
    raquete2.y += dificuldadeIA[dificuldade];
  } else if (raquete2.y > alvo) {
    raquete2.y -= dificuldadeIA[dificuldade];
  }
  raquete2.y = Math.max(0, Math.min(altura - alturaRaquete, raquete2.y));
}

function moverBola() {
  bola.x += bola.vx;
  bola.y += bola.vy;

  if (bola.y - raioBola < 0 || bola.y + raioBola > altura) {
    bola.vy *= -1;
  }

  if (
    bola.x - raioBola < raquete1.x + raquete1.w &&
    bola.y > raquete1.y &&
    bola.y < raquete1.y + raquete1.h
  ) {
    bola.vx *= -1.1;
    bola.x = raquete1.x + raquete1.w + raioBola;
    bola.vy += ((bola.y - (raquete1.y + raquete1.h / 2)) / alturaRaquete) * 5;
  }

  if (
    bola.x + raioBola > raquete2.x &&
    bola.y > raquete2.y &&
    bola.y < raquete2.y + raquete2.h
  ) {
    bola.vx *= -1.1;
    bola.x = raquete2.x - raioBola;
    bola.vy += ((bola.y - (raquete2.y + raquete2.h / 2)) / alturaRaquete) * 5;
  }

  if (bola.x - raioBola < 0) {
    pontos2++;
    resetarBola(-1);
  }
  if (bola.x + raioBola > largura) {
    pontos1++;
    resetarBola(1);
  }
}

function desenhar() {
  if (!ctx) return;
  ctx.clearRect(0, 0, largura, altura);

  ctx.fillStyle = '#e8eaf6';
  ctx.fillRect(0, 0, largura, altura);

  ctx.strokeStyle = '#b0bec5';
  ctx.beginPath();
  ctx.setLineDash([8, 16]);
  ctx.moveTo(largura / 2, 0);
  ctx.lineTo(largura / 2, altura);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#3949ab';
  ctx.fillRect(raquete1.x, raquete1.y, raquete1.w, raquete1.h);
  ctx.fillRect(raquete2.x, raquete2.y, raquete2.w, raquete2.h);

  ctx.beginPath();
  ctx.arc(bola.x, bola.y, raioBola, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a237e';
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.font = '32px Segoe UI, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${pontos1}   ${pontos2}`, largura / 2, 50);
}

function checarVencedor() {
  if (jogoEncerrado) return;
  if (pontos1 >= 10 && pontos1 - pontos2 >= 2) {
    jogoEncerrado = true;
    clearInterval(gameInterval);
    if (intervaloTempoPong) clearInterval(intervaloTempoPong);
    if (typeof endGameSession === "function") endGameSession('pong', 'vitoria', dificuldadeAtual, tempoPong);
    // Só registra pontuação no ranking se for contra IA
    if (modoIA) registrarPontuacaoRankingPong(true);
    setTimeout(() => {
      alert(modoIA ? "Você venceu!" : "Jogador 1 venceu!");
      document.getElementById('menu-inicial').style.display = 'block';
      document.getElementById('jogo').style.display = 'none';
    }, 250);
  } else if (pontos2 >= 10 && pontos2 - pontos1 >= 2) {
    jogoEncerrado = true;
    clearInterval(gameInterval);
    if (intervaloTempoPong) clearInterval(intervaloTempoPong);
    if (typeof endGameSession === "function") endGameSession('pong', 'derrota', dificuldadeAtual, tempoPong);
    // Só registra pontuação no ranking se for contra IA
    if (modoIA) registrarPontuacaoRankingPong(false);
    setTimeout(() => {
      alert(modoIA ? "IA venceu!" : "Jogador 2 venceu!");
      document.getElementById('menu-inicial').style.display = 'block';
      document.getElementById('jogo').style.display = 'none';
    }, 250);
  }
}

// INTEGRAÇÃO RANKING - envia score ao terminar jogo
async function registrarPontuacaoRankingPong(vitoria) {
  // Salva partida real para estatísticas
  let dificuldadeLabel =
    dificuldadeAtual === 'facil' ? 'Fácil' :
    dificuldadeAtual === 'medio' ? 'Médio' :
    dificuldadeAtual === 'dificil' ? 'Difícil' : dificuldadeAtual;

  let resultadoApi = vitoria ? 'vitoria' : 'derrota';
  await fetch('http://localhost:3001/api/partida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jogo: 'Pong',
      resultado: resultadoApi,
      nome: user.nome,
      tempo: typeof tempoPong === 'number' ? tempoPong : null,
      dificuldade: dificuldadeLabel
    })
  });

  if (vitoria) {
    // 1. Ranking geral (mais vitórias totais)
    await window.adicionarPontuacaoRanking("Pong", user.nome, {
      tipo: "mais_vitorias_total",
      dificuldade: null,
      valor: 1
    });
    // 2. Ranking por dificuldade (mais vitórias por dificuldade)
    await window.adicionarPontuacaoRanking("Pong", user.nome, {
      tipo: "mais_vitorias_dificuldade",
      dificuldade: dificuldadeLabel,
      valor: 1
    });
    // 3. Ranking menor tempo por dificuldade (só envia se tempoPong > 0)
    if (typeof tempoPong === 'number' && tempoPong > 0) {
      await window.adicionarPontuacaoRanking("Pong", user.nome, {
        tipo: "menor_tempo",
        dificuldade: dificuldadeLabel,
        tempo: tempoPong,
        valor: 1
      });
    }
  }
}

// Chame esta função ao finalizar o jogo para registrar a pontuação no ranking
// Exemplo:
// adicionarPontuacaoRanking('Pong', user.nome, { tipo: 'mais_vitorias_total', valor: 1, dificuldade: dificuldadeSelecionada, tempo: tempoFinal, erros: errosCometidos });

document.addEventListener('keydown', e => {
  if (document.getElementById('jogo').style.display === 'none') return;
  if (e.key === 'w' || e.key === 'W') jogador1Up = true;
  if (e.key === 's' || e.key === 'S') jogador1Down = true;
  if (!modoIA) {
    if (e.key === 'ArrowUp') {
      jogador2Up = true;
      e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
      jogador2Down = true;
      e.preventDefault();
    }
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'w' || e.key === 'W') jogador1Up = false;
  if (e.key === 's' || e.key === 'S') jogador1Down = false;
  if (!modoIA) {
    if (e.key === 'ArrowUp') {
      jogador2Up = false;
      e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
      jogador2Down = false;
      e.preventDefault();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  alternarDificuldade();
  canvas = document.getElementById('pong-canvas');
  ctx = canvas ? canvas.getContext('2d') : null;
});

function voltarAoMenuInicial() {
  clearInterval(gameInterval);
  if (intervaloTempoPong) clearInterval(intervaloTempoPong);
  document.getElementById('jogo').style.display = 'none';
  document.getElementById('menu-inicial').style.display = 'block';
}