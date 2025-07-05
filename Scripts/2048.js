// 2048.js
// Integrado ao ranking avançado via API

const tamanho = 4;
let tabuleiro;
let score = 0;
let gameOver = false;
let novaCelula = null; // Guardar a última célula criada para animar

let bloqueado = false; // Bloqueio para evitar spam
const TEMPO_COOLDOWN = 500; // ms

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
  const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
  let tipo = "maior_pontuacao";
  let valor = score;

  // Busca o valor atual do ranking para este usuário
  let valorAntigo = 0;
  try {
    const res = await fetch("http://localhost:3001/rankings/advanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jogo: "2048", tipo, dificuldade: "" })
    });
    const data = await res.json();
    if (data.ranking && Array.isArray(data.ranking)) {
      const registro = data.ranking.find(e => e.nome === user.nome);
      if (registro && typeof registro.valor === "number") valorAntigo = registro.valor;
    }
  } catch (e) {}

  // Só atualiza se o valor atual for maior que o antigo
  if (valor > valorAntigo) {
    try {
      await fetch("http://localhost:3001/rankings/advanced/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jogo: "2048",
          tipo,
          dificuldade: "",
          nome: user.nome,
          valor
        })
      });
    } catch (e) {}
  }
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