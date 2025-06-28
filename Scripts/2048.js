// 2048.js

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
  // Não mostra mais mensagem final na tela
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
      // Adiciona classe "nova" se a célula acabou de ser criada
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
  
    // Rotaciona para mover sempre para a esquerda
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
  
    // Rotaciona de volta
    for (let k = direcao; k < 4; k++) tabuleiro = girarTabuleiro(tabuleiro);
  
    if (JSON.stringify(tabuleiro) !== anterior) {
      // Só adiciona novo número SE ainda há movimentos após a jogada!
      if (podeMover()) {
        adicionarNovoNumero();
        desenharTabuleiro();
        atualizarScore();
        // Agora verifica novamente: se após adicionar não tem mais movimentos, avisa fim de jogo
        if (!podeMover()) {
          desenharTabuleiro();
          mostrarMensagemFinal("Fim de jogo!");
          if (typeof endGameSession === "function") endGameSession('2048', 'derrota');
          gameOver = true;
        }
      } else {
        desenharTabuleiro();
        mostrarMensagemFinal("Fim de jogo!");
        if (typeof endGameSession === "function") endGameSession('2048', 'derrota');
        gameOver = true;
      }
    } else {
      desenharTabuleiro();
      // Mesmo se nada mudou, checa se tem movimentos possíveis ainda
      if (!podeMover()) {
        mostrarMensagemFinal("Fim de jogo!");
        if (typeof endGameSession === "function") endGameSession('2048', 'derrota');
        gameOver = true;
      }
    }
  }

function girarTabuleiro(matriz) {
  // Rotaciona 90 graus para a direita
  return matriz[0].map((_, i) => matriz.map(row => row[i]).reverse());
}

function podeMover() {
  // Tem espaço vazio?
  for (let i = 0; i < tamanho; i++)
    for (let j = 0; j < tamanho; j++)
      if (tabuleiro[i][j] === 0) return true;
  // Tem movimentos possíveis?
  for (let i = 0; i < tamanho; i++)
    for (let j = 0; j < tamanho; j++) {
      if (i < tamanho - 1 && tabuleiro[i][j] === tabuleiro[i + 1][j]) return true;
      if (j < tamanho - 1 && tabuleiro[i][j] === tabuleiro[i][j + 1]) return true;
    }
  return false;
}

function mostrarMensagemFinal(msg) {
  // Apenas mostra um aviso simples sem botão ou caixa decorada
  alert(msg);
}

function reiniciarJogo() {
  iniciarJogo2048();
}

// Eventos de teclado - todas direções funcionam e estão mapeadas corretamente
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

// Inicializa ao carregar a página
document.addEventListener('DOMContentLoaded', iniciarJogo2048);