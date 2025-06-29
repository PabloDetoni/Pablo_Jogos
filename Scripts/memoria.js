// memoria.js

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchesFound = 0;
let errorsCount = 0;
let totalPairs = 0;
let timerSec = 0;
let timerInterval = null;

function iniciarJogo() {
  const tabuleiro = document.getElementById('tabuleiro');
  const errosSpan = document.getElementById('erros');
  const acertosSpan = document.getElementById('acertos');
  const timerSpan = document.getElementById('timer');

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
      return;
    }
    timerSpan.textContent = formatTime(timerSec);
  }, 1000);

  // Determinar dificuldade
  const dificuldade = document.getElementById('dificuldade').value;
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
    img.src = `../Imagens/img${idx}.jpeg`;
    img.alt = `Imagem ${idx}`;
    card.appendChild(img);

    card.addEventListener('click', flipCard);
    tabuleiro.appendChild(card);
  });

  // Reveal inicial por 3s
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
