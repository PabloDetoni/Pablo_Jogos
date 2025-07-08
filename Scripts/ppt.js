// --- BLOQUEIO DINÂMICO DE JOGO (admin) --- //
const GAME_NAME = 'PPT';
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

// ppt.js
// Integrado ao ranking avançado via API
document.addEventListener('DOMContentLoaded', async () => {
  await checkUserBlocked();
  startBlockedUserPolling();
});

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
  // Pega o usuário antes de qualquer uso
  const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
  // Salva partida real para estatísticas
  await fetch('http://localhost:3001/api/partida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jogo: 'PPT',
      resultado,
      nome: user.nome
    })
  });

  // 1. Ranking geral (mais vitórias totais em PPT)
  if (resultado === 'vitoria') {
    await atualizarRankingAdvanced({
      jogo: "PPT",
      tipo: "vitorias",
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