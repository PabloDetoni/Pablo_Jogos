// campo_minado.js

let board = [];
let rows = 0;
let cols = 0;
let totalMines = 0;
let flagsLeft = 0;
let timerSec = 0;
let timerInterval = null;
let gameOver = false;
let firstClick = true;

// Vincula evento ao carregar DOM
window.addEventListener('DOMContentLoaded', () => {
  const btnIniciar = document.getElementById('btn-iniciar');
  const btnReiniciar = document.getElementById('btn-reiniciar');

  btnIniciar.addEventListener('click', () => {
    // Esconde toda a tela inicial (incluindo botões de rodapé)
    document.getElementById('tela-inicial').style.display = 'none';

    // Exibe painel superior e área do jogo
    document.getElementById('painel-topo').style.display = 'flex';
    document.getElementById('jogo').style.display = 'block';

    iniciarJogo();
  });

  btnReiniciar.addEventListener('click', () => {
    // Ao reiniciar, esconde painel e área de jogo...
    document.getElementById('painel-topo').style.display = 'none';
    document.getElementById('jogo').style.display = 'none';

    // ...e exibe novamente toda a tela inicial
    document.getElementById('tela-inicial').style.display = 'flex';

    clearInterval(timerInterval);
  });
});

function iniciarJogo() {
  const dificuldade = document.getElementById('dificuldade').value;
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
  setTimeout(() => {
    alert(vencedor ? 'Parabéns! Você venceu!' : 'Você perdeu!');
    document.getElementById('btn-reiniciar').style.display = 'block';
  }, 200);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mDisplay = String(mins).padStart(2, '0') + ':';
  const sDisplay = String(secs).padStart(2, '0');
  return mDisplay + sDisplay;
}
