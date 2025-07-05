// ppt.js
// Integrado ao ranking avançado via API

function jogar(jogador) {
  // Inicia sessão de estatísticas
  if (typeof startGameSession === "function") startGameSession('ppt');

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

    // Registra estatísticas e ranking
    if (classe === 'vitoria') {
      if (typeof endGameSession === "function") endGameSession('ppt', 'vitoria');
      registrarPontuacaoRankingPPT('vitoria');
    }
    else if (classe === 'derrota') {
      if (typeof endGameSession === "function") endGameSession('ppt', 'derrota');
      registrarPontuacaoRankingPPT('derrota');
    }
    else if (classe === 'empate') {
      if (typeof endGameSession === "function") endGameSession('ppt', 'empate');
      registrarPontuacaoRankingPPT('empate');
    }

    // Reabilita botões para nova partida
    botoes.forEach(btn => btn.disabled = false);
  }, 2000);
}

// Helper para atualizar ranking acumulando vitórias
async function atualizarRankingAdvanced({ jogo, tipo, dificuldade, nome, valorNovo }) {
  let valorAntigo = 0;
  try {
    const res = await fetch("http://localhost:3001/rankings/advanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jogo, tipo, dificuldade })
    });
    const data = await res.json();
    if (data.ranking && Array.isArray(data.ranking)) {
      const registro = data.ranking.find(e => e.nome === nome);
      if (registro && typeof registro.valor === "number") valorAntigo = registro.valor;
    }
  } catch (e) {}

  // Para rankings de soma, envie valorAntigo + valorNovo
  try {
    await fetch("http://localhost:3001/rankings/advanced/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jogo, tipo, dificuldade, nome, valor: valorAntigo + valorNovo })
    });
  } catch (e) {}
}

// INTEGRAÇÃO RANKING - registra score ao final de cada partida
async function registrarPontuacaoRankingPPT(resultado) {
  const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };

  // 1. Ranking geral (mais vitórias totais em PPT)
  if (resultado === 'vitoria') {
    await atualizarRankingAdvanced({
      jogo: "PPT",
      tipo: "mais_vitorias_total",
      dificuldade: "",
      nome: user.nome,
      valorNovo: 1
    });
  }

  // 2. Ranking por sequência de vitórias consecutivas
  // Controle local da sequência
  let seqKey = `ppt_seq_vitoria_${user.nome}`;
  let seqAtual = Number(localStorage.getItem(seqKey)) || 0;
  if (resultado === 'vitoria') {
    seqAtual += 1;
    await fetch("http://localhost:3001/rankings/advanced/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogo: "PPT",
        tipo: "mais_vitorias_consecutivas",
        dificuldade: "",
        nome: user.nome,
        valor: seqAtual
      })
    });
  } else {
    seqAtual = 0;
  }
  localStorage.setItem(seqKey, seqAtual);
}