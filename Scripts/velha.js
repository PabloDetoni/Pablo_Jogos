// velha.js
// Integrado ao ranking avançado via API

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
  if (typeof startGameSession === "function") startGameSession('velha');

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

      if (typeof endGameSession === "function") {
        if (vencedor === 'X') endGameSession('velha', 'vitoria');
        else endGameSession('velha', 'derrota');
      }

      registrarPontuacaoRankingVelha(vencedor);
      return;
    }
  }
  if (!tabuleiro.includes('')) {
    jogoEncerrado = true;
    atualizarMensagem('Empate!');
    if (typeof endGameSession === "function") endGameSession('velha', 'empate');
    registrarPontuacaoRankingVelha('empate');
  }
}

// Função para registrar no ranking avançado (três rankings distintos)
async function registrarPontuacaoRankingVelha(resultado) {
  const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
  let dificuldadeLabel = dificuldade === 'facil' ? 'Fácil' : 'Médio';
  let valor = resultado === 'X' ? 1 : 0; // só conta vitória

  // 1. Ranking geral (mais vitórias no Jogo da Velha)
  if (resultado === 'X') {
    await fetch("http://localhost:3001/rankings/advanced/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogo: "Jogo da Velha",
        tipo: "maior_vitoria_total",
        dificuldade: "",
        nome: user.nome,
        valor: 1
      })
    });
  }

  // 2. Ranking por dificuldade (mais vitórias por dificuldade)
  if (resultado === 'X') {
    await fetch("http://localhost:3001/rankings/advanced/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogo: "Jogo da Velha",
        tipo: "maior_vitoria_dificuldade",
        dificuldade: dificuldadeLabel,
        nome: user.nome,
        valor: 1
      })
    });
  }

  // 3. Ranking por sequência de vitórias (consecutivas) por dificuldade
  // Você pode usar localStorage/sessionStorage para armazenar a sequência localmente
  // Exemplo de controle local:
  let seqKey = `velha_seq_vitoria_${user.nome}_${dificuldadeLabel}`;
  let seqAtual = Number(localStorage.getItem(seqKey)) || 0;
  if (resultado === 'X') {
    seqAtual += 1;
    await fetch("http://localhost:3001/rankings/advanced/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogo: "Jogo da Velha",
        tipo: "maior_sequencia_vitoria",
        dificuldade: dificuldadeLabel,
        nome: user.nome,
        valor: seqAtual
      })
    });
  } else {
    seqAtual = 0; // zera a sequência ao perder ou empatar
  }
  localStorage.setItem(seqKey, seqAtual);
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