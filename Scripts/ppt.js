// ppt.js
// Dependência: stats.js (startGameSession, endGameSession)
// Integração: rankings.js (adicionarPontuacaoRanking, getNomeUsuario)

function jogar(jogador) {
  // Inicia sessão de estatísticas
  startGameSession('ppt');

  // Desabilita botões de escolha até o resultado
  const botoes = document.querySelectorAll('.botoes-ppt button');
  botoes.forEach(btn => btn.disabled = true);

  const opcoes = ['pedra', 'papel', 'tesoura'];
  const emojis = {
    pedra: '🪨',
    papel: '📄',
    tesoura: '✂️'
  };

  const maquina = opcoes[Math.floor(Math.random() * 3)];
  const resultadoEl = document.getElementById('resultado-ppt');
  const body = document.body;

  // Exibe contagem enquanto espera
  resultadoEl.textContent = "Contando...";
  body.className = '';

  setTimeout(() => {
    let mensagem = '';
    let classe = '';

    if (jogador === maquina) {
      mensagem = `Empate!<br>Você: ${emojis[jogador]} | Máquina: ${emojis[maquina]}`;
      classe = 'empate';
    } else if (
      (jogador === 'pedra' && maquina === 'tesoura') ||
      (jogador === 'tesoura' && maquina === 'papel') ||
      (jogador === 'papel' && maquina === 'pedra')
    ) {
      mensagem = `Você venceu!<br>Você: ${emojis[jogador]} | Máquina: ${emojis[maquina]}`;
      classe = 'vitoria';
    } else {
      mensagem = `Você perdeu!<br>Você: ${emojis[jogador]} | Máquina: ${emojis[maquina]}`;
      classe = 'derrota';
    }

    // Mostra resultado
    resultadoEl.innerHTML = mensagem;
    body.classList.add(classe);

    // Registra estatísticas
    if (classe === 'vitoria') {
      endGameSession('ppt', 'vitoria');
      registrarPontuacaoRankingPPT('vitoria');
    }
    else if (classe === 'derrota') {
      endGameSession('ppt', 'derrota');
      registrarPontuacaoRankingPPT('derrota');
    }
    else if (classe === 'empate') {
      endGameSession('ppt', 'empate');
      registrarPontuacaoRankingPPT('empate');
    }

    // Reabilita botões para nova partida
    botoes.forEach(btn => btn.disabled = false);
  }, 2000);
}

// INTEGRAÇÃO RANKING - registra score ao final de cada partida
function registrarPontuacaoRankingPPT(resultado) {
  if (typeof adicionarPontuacaoRanking === "function" && typeof getNomeUsuario === "function") {
    // Score: 1 para vitória, 0 para empate, -1 para derrota (ajuste se quiser ranking só de vitórias)
    let score = 0;
    if (resultado === 'vitoria') score = 1;
    else if (resultado === 'empate') score = 0;
    else if (resultado === 'derrota') score = -1;
    adicionarPontuacaoRanking('PPT', getNomeUsuario(), score);
  }
}