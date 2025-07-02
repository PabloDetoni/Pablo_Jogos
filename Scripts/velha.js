// velha.js
// Dependência: stats.js (startGameSession, endGameSession)
// Integração: rankings.js (adicionarPontuacaoRanking, getNomeUsuario)

let jogador = 'X';
let tabuleiro = Array(9).fill('');
let jogoEncerrado = false;
let modoIA = false;
let dificuldade = 'facil';

// Cria visual do tabuleiro
function criarTabuleiro() {
  const container = document.getElementById('tabuleiro-velha');
  container.innerHTML = '';
  tabuleiro.forEach((valor, i) => {
    const celula = document.createElement('div');
    celula.className = 'celula';
    celula.textContent = valor;
    celula.onclick = () => jogar(i);
    container.appendChild(celula);
  });
}

// Inicia o jogo (chamado ao clicar em Iniciar)
function iniciarJogo() {
  // Estatísticas
  startGameSession('velha');

  const modo = document.getElementById('modoJogo').value;
  modoIA = (modo === 'ia');
  dificuldade = document.getElementById('dificuldadeIA').value;

  document.getElementById('menu-inicial').style.display = 'none';
  document.getElementById('jogo').style.display = 'block';

  reiniciarJogo();
}

document.addEventListener('DOMContentLoaded', () => {
  criarTabuleiro();
  atualizarMensagem(`Vez de ${jogador}`);
});

// Jogada para humano ou IA
function jogar(pos, forcado = false) {
  if (tabuleiro[pos] !== '' || jogoEncerrado) return;
  if (modoIA && jogador === 'O' && !forcado) return;

  tabuleiro[pos] = jogador;
  criarTabuleiro();
  verificarVencedor();

  if (jogoEncerrado) return;

  jogador = jogador === 'X' ? 'O' : 'X';
  atualizarMensagem(`Vez de ${jogador}`);

  if (modoIA && jogador === 'O') {
    setTimeout(jogadaIA, 500);
  }
}

// IA joga
function jogadaIA() {
  let posicao;
  if (dificuldade === 'facil') {
    // random
    const vazias = tabuleiro
      .map((v,i) => v === '' ? i : null)
      .filter(i => i !== null);
    posicao = vazias[Math.floor(Math.random() * vazias.length)];

  } else if (dificuldade === 'medio') {
    // estratégia média: ganhar, bloquear, senão random
    posicao = jogadaMedia();

  } else {
    // difícil = Minimax perfeito
    posicao = melhorJogada();
  }

  if (posicao !== undefined) jogar(posicao, true);
}

// Nova função para o nível Médio
function jogadaMedia() {
  // 1) Tenta ganhar
  for (let i = 0; i < 9; i++) {
    if (tabuleiro[i] === '') {
      tabuleiro[i] = 'O';
      if (checarVencedorParaMinimax(tabuleiro) === 'O') {
        tabuleiro[i] = '';
        return i;
      }
      tabuleiro[i] = '';
    }
  }
  // 2) Tenta bloquear o X
  for (let i = 0; i < 9; i++) {
    if (tabuleiro[i] === '') {
      tabuleiro[i] = 'X';
      if (checarVencedorParaMinimax(tabuleiro) === 'X') {
        tabuleiro[i] = '';
        return i;
      }
      tabuleiro[i] = '';
    }
  }
  // 3) Senão, jogada aleatória
  const vazias = tabuleiro
    .map((v,i) => v === '' ? i : null)
    .filter(i => i !== null);
  return vazias[Math.floor(Math.random() * vazias.length)];
}

// Minimax para dificuldade difícil
function melhorJogada() {
  let melhorScore = -Infinity;
  let move = null;
  tabuleiro.forEach((v, i) => {
    if (v === '') {
      tabuleiro[i] = 'O';
      const score = minimax(tabuleiro, 0, false);
      tabuleiro[i] = '';
      if (score > melhorScore) {
        melhorScore = score;
        move = i;
      }
    }
  });
  return move;
}

function minimax(board, depth, isMax) {
  const winner = checarVencedorParaMinimax(board);
  if (winner !== null) {
    const scores = { O: 10, X: -10, empate: 0 };
    return scores[winner];
  }
  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth+1, false));
        board[i] = '';
      }
    }
    return best;
  } else {
    let worst = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        worst = Math.min(worst, minimax(board, depth+1, true));
        board[i] = '';
      }
    }
    return worst;
  }
}

function checarVencedorParaMinimax(board) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (!board.includes('')) return 'empate';
  return null;
}

// Verifica vencedor ou empate
function verificarVencedor() {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of wins) {
    if (tabuleiro[a] && tabuleiro[a] === tabuleiro[b] && tabuleiro[a] === tabuleiro[c]) {
      jogoEncerrado = true;
      const vencedor = tabuleiro[a];
      atualizarMensagem(`Jogador ${vencedor} venceu!`);

      // INTEGRAÇÃO ESTATÍSTICAS
      if (vencedor === 'X') endGameSession('velha', 'vitoria');
      else endGameSession('velha', 'derrota');

      // INTEGRAÇÃO RANKING
      registrarPontuacaoRankingVelha(vencedor);

      return;
    }
  }
  if (!tabuleiro.includes('')) {
    jogoEncerrado = true;
    atualizarMensagem('Empate!');
    endGameSession('velha', 'empate');

    // INTEGRAÇÃO RANKING empate
    registrarPontuacaoRankingVelha('empate');
  }
}

// Função para registrar o resultado no ranking ao final do jogo
function registrarPontuacaoRankingVelha(resultado) {
  if (typeof adicionarPontuacaoRanking === "function" && typeof getNomeUsuario === "function") {
    // Score: 1 para vitória do jogador, 0 para empate, -1 para derrota (ajuste se quiser outro critério)
    let score = 0;
    if (resultado === 'X') score = 1;
    else if (resultado === 'empate') score = 0;
    else score = -1;
    adicionarPontuacaoRanking('Jogo da Velha', getNomeUsuario(), score);
  }
}

// Reinicia o jogo
function reiniciarJogo() {
  jogador = 'X';
  tabuleiro.fill('');
  jogoEncerrado = false;
  atualizarMensagem(`Vez de ${jogador}`);
  criarTabuleiro();
}

// Atualiza mensagem de status
function atualizarMensagem(texto) {
  document.getElementById('mensagem').textContent = texto;
}

// Controla tela inicial / dificuldade
function alternarDificuldade() {
  const modo = document.getElementById('modoJogo').value;
  document.getElementById('dificuldade-container').style.display = (modo === 'ia') ? 'block' : 'none';
}