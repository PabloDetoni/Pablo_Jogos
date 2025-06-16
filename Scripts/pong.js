// pong.js
// Dependência: stats.js (startGameSession, endGameSession)

// Variáveis do jogo
let modoIA = false;
let dificuldade = 'facil';
let gameInterval;
let jogador1Up = false, jogador1Down = false, jogador2Up = false, jogador2Down = false;

// Variáveis do Pong
let canvas, ctx;
const largura = 600, altura = 400;
const larguraRaquete = 10, alturaRaquete = 80;
const velocidadeRaquete = 6;
const raioBola = 8;
let raquete1, raquete2, bola, pontos1, pontos2, jogoEncerrado = false;

// Controle de dificuldade IA
const dificuldadeIA = {
  facil: 2.5,
  medio: 4,
  dificil: 6.5
};

// Alterna exibição das dificuldades e controles do Jogador 2
function alternarDificuldade() {
  const modo = document.getElementById('modoJogo').value;
  document.getElementById('dificuldade-container').style.display = (modo === 'ia') ? 'block' : 'none';
  // Esconde/mostra controles Jogador 2
  const spanJ2 = document.getElementById('controles-jogador2');
  if (spanJ2) {
    spanJ2.style.display = (modo === 'ia') ? 'none' : 'inline';
  }
}

// Inicializa o jogo
function iniciarJogo() {
  // Estatísticas
  startGameSession('pong');

  const modo = document.getElementById('modoJogo').value;
  modoIA = (modo === 'ia');
  dificuldade = document.getElementById('dificuldadeIA').value;

  document.getElementById('menu-inicial').style.display = 'none';
  document.getElementById('jogo').style.display = 'block';

  // Ajusta controles Jogador 2 para o modo escolhido
  const spanJ2 = document.getElementById('controles-jogador2');
  if (spanJ2) {
    spanJ2.style.display = modoIA ? 'none' : 'inline';
  }

  reiniciarJogo();
}

// Reinicia o jogo
function reiniciarJogo() {
  raquete1 = { x: 10, y: altura / 2 - alturaRaquete / 2, w: larguraRaquete, h: alturaRaquete };
  raquete2 = { x: largura - 20, y: altura / 2 - alturaRaquete / 2, w: larguraRaquete, h: alturaRaquete };
  bola = { x: largura / 2, y: altura / 2, vx: (Math.random() > 0.5 ? 4 : -4), vy: (Math.random() * 4 - 2) };
  pontos1 = 0;
  pontos2 = 0;
  jogoEncerrado = false;
  clearInterval(gameInterval);
  desenhar();
  gameInterval = setInterval(atualizar, 1000 / 60);
}

// Atualiza o jogo
function atualizar() {
  moverRaquetes();
  moverBola();
  desenhar();
  checarVencedor();
}

// Movimento das raquetes
function moverRaquetes() {
  // Jogador 1 (W/S)
  if (jogador1Up) raquete1.y -= velocidadeRaquete;
  if (jogador1Down) raquete1.y += velocidadeRaquete;
  raquete1.y = Math.max(0, Math.min(altura - alturaRaquete, raquete1.y));

  // Jogador 2
  if (modoIA) {
    iaMove();
  } else {
    if (jogador2Up) raquete2.y -= velocidadeRaquete;
    if (jogador2Down) raquete2.y += velocidadeRaquete;
    raquete2.y = Math.max(0, Math.min(altura - alturaRaquete, raquete2.y));
  }
}

// IA movimenta raquete 2
function iaMove() {
  const alvo = bola.y - (alturaRaquete / 2);
  if (raquete2.y < alvo) {
    raquete2.y += dificuldadeIA[dificuldade];
  } else if (raquete2.y > alvo) {
    raquete2.y -= dificuldadeIA[dificuldade];
  }
  raquete2.y = Math.max(0, Math.min(altura - alturaRaquete, raquete2.y));
}

// Movimento da bola
function moverBola() {
  bola.x += bola.vx;
  bola.y += bola.vy;

  // Colisão com topo/baixo
  if (bola.y - raioBola < 0 || bola.y + raioBola > altura) {
    bola.vy *= -1;
  }

  // Colisão com raquete 1
  if (
    bola.x - raioBola < raquete1.x + raquete1.w &&
    bola.y > raquete1.y &&
    bola.y < raquete1.y + raquete1.h
  ) {
    bola.vx *= -1.1;
    bola.x = raquete1.x + raquete1.w + raioBola;
    bola.vy += ((bola.y - (raquete1.y + raquete1.h / 2)) / alturaRaquete) * 5;
  }

  // Colisão com raquete 2
  if (
    bola.x + raioBola > raquete2.x &&
    bola.y > raquete2.y &&
    bola.y < raquete2.y + raquete2.h
  ) {
    bola.vx *= -1.1;
    bola.x = raquete2.x - raioBola;
    bola.vy += ((bola.y - (raquete2.y + raquete2.h / 2)) / alturaRaquete) * 5;
  }

  // Ponto jogador 2
  if (bola.x - raioBola < 0) {
    pontos2++;
    resetarBola(-4);
  }

  // Ponto jogador 1
  if (bola.x + raioBola > largura) {
    pontos1++;
    resetarBola(4);
  }
}

// Reseta bola após ponto
function resetarBola(direcao) {
  bola.x = largura / 2;
  bola.y = altura / 2;
  bola.vx = direcao;
  bola.vy = (Math.random() * 4 - 2);
}

// Renderiza jogo
function desenhar() {
  if (!ctx) return;
  ctx.clearRect(0, 0, largura, altura);

  // Fundo
  ctx.fillStyle = '#e8eaf6';
  ctx.fillRect(0, 0, largura, altura);

  // Linha central
  ctx.strokeStyle = '#b0bec5';
  ctx.beginPath();
  ctx.setLineDash([8, 16]);
  ctx.moveTo(largura / 2, 0);
  ctx.lineTo(largura / 2, altura);
  ctx.stroke();
  ctx.setLineDash([]);

  // Raquetes
  ctx.fillStyle = '#3949ab';
  ctx.fillRect(raquete1.x, raquete1.y, raquete1.w, raquete1.h);
  ctx.fillRect(raquete2.x, raquete2.y, raquete2.w, raquete2.h);

  // Bola
  ctx.beginPath();
  ctx.arc(bola.x, bola.y, raioBola, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a237e';
  ctx.fill();

  // Placar
  ctx.fillStyle = '#222';
  ctx.font = '32px Segoe UI, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${pontos1}   ${pontos2}`, largura / 2, 50);
}

// Checa vencedor (primeiro a 10 pontos)
function checarVencedor() {
  if (!jogoEncerrado && (pontos1 >= 10 || pontos2 >= 10)) {
    jogoEncerrado = true;
    clearInterval(gameInterval);
    let resultado = '';
    if (pontos1 >= 10) {
      resultado = modoIA ? "Você venceu!" : "Jogador 1 venceu!";
      endGameSession('pong', 'vitoria');
    } else if (pontos2 >= 10) {
      resultado = modoIA ? "IA venceu!" : "Jogador 2 venceu!";
      endGameSession('pong', modoIA ? 'derrota' : 'derrota');
    }
    setTimeout(() => {
      alert(resultado);
      document.getElementById('menu-inicial').style.display = 'block';
      document.getElementById('jogo').style.display = 'none';
    }, 250);
  }
}

// Controles teclado
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

// Inicializa tela inicial e referências
document.addEventListener('DOMContentLoaded', () => {
  alternarDificuldade();
  canvas = document.getElementById('pong-canvas');
  ctx = canvas ? canvas.getContext('2d') : null;
});