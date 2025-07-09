// --- BLOQUEIO DINÂMICO DE JOGO (admin) --- //
const GAME_NAME = 'Forca';
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

// forca.js
// Integrado ao ranking avançado via API
document.addEventListener('DOMContentLoaded', async () => {
  await checkUserBlocked();
  startBlockedUserPolling();
});

let bancoPalavras = {};
let palavra = "";
let palavraNorm = "";        // versão sem acentos
let dica = "";
let resposta = [];
let letrasUsadas = [];
let tentativasRestantes = 6;
let venceuPartida = false;
let dificuldadeAtual = 'facil';

// Carrega banco de palavras a partir do CSV
async function carregarBancoPalavras() {
  try {
    const respostaCSV = await fetch("../CSV/palavras.csv");
    const texto = await respostaCSV.text();
    const linhas = texto.trim().split("\n");
    // Remove cabeçalho
    linhas.shift();
    linhas.forEach(linha => {
      // Divide nas primeiras vírgulas: dificuldade, palavra, restante como dica
      const [dificuldade, palavraCSV, ...resto] = linha.split(",");
      const dicaCSV = resto.join(",");
      if (!bancoPalavras[dificuldade]) {
        bancoPalavras[dificuldade] = [];
      }
      bancoPalavras[dificuldade].push({ palavra: palavraCSV, dica: dicaCSV });
    });
    console.log("Banco de palavras carregado:", bancoPalavras);
  } catch (err) {
    console.error("Erro ao carregar CSV de palavras:", err);
  }
}

// Inicia sessão de estatísticas ao começar o jogo
function iniciarJogo() {
  if (typeof startGameSession === "function") startGameSession('forca');

  document.getElementById("menu-inicial").style.display = "none";
  document.getElementById("jogo").style.display = "block";

  const dificuldade = document.getElementById("dificuldade").value;
  dificuldadeAtual = dificuldade;

  const lista = bancoPalavras[dificuldade] || bancoPalavras['facil'];
  const escolha = lista[Math.floor(Math.random() * lista.length)];

  palavra = escolha.palavra;               // mantém acentos
  palavraNorm = palavra
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  dica = escolha.dica || "";
  resposta = Array(palavra.length).fill("_");
  letrasUsadas = [];
  tentativasRestantes = 6;
  venceuPartida = false;

  atualizarTela();
  atualizarBoneco();
}

// Aguardar carregamento do CSV antes de permitir iniciar
document.addEventListener("DOMContentLoaded", async () => {
  await carregarBancoPalavras();
  document.getElementById("btn-iniciar").addEventListener("click", iniciarJogo);
  document.getElementById("btn-tentar").addEventListener("click", tentarLetra);
  document.getElementById("btn-reiniciar").addEventListener("click", reiniciarJogo);
});

function tentarLetra() {
  const input = document.getElementById("entrada-letra");
  const letra = input.value.toLowerCase();
  input.value = "";

  // Normaliza acentos para comparação
  const letraNorm = letra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Validação básica de input
  if (!letra.match(/^[a-záéíóúãõâêîôûç]$/i)) return;

  // Aviso para letra repetida
  if (letrasUsadas.includes(letraNorm)) {
    alert("Você já tentou essa letra! Escolha outra.");
    return;
  }

  letrasUsadas.push(letraNorm);

  // Verifica acertos e erros
  if (palavraNorm.includes(letraNorm)) {
    palavra.split('').forEach((char, i) => {
      const charNorm = char
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (charNorm === letraNorm) resposta[i] = char;
    });
  } else {
    tentativasRestantes--;
  }

  atualizarTela();
  atualizarBoneco();
  verificarEstado();
}

function atualizarTela() {
  document.getElementById("dica").textContent = dica || "(sem dica)";
  document.getElementById("palavra-oculta").textContent = resposta.join(" ");
  document.getElementById("letras-usadas").textContent = `Usadas: ${letrasUsadas.join(", ")}`;
  document.getElementById("resultado-forca").textContent = "";
}

function verificarEstado() {
  const resEl = document.getElementById('resultado-forca');
  if (!resposta.includes("_")) {
    resEl.textContent = "Parabéns! Você venceu! 🎉";
    document.body.classList.add("vitoria");
    desativarEntrada();
    venceuPartida = true;
    if (typeof endGameSession === "function") endGameSession('forca', 'vitoria');
    registrarPontuacaoRankingForca();
  } else if (tentativasRestantes <= 0) {
    resEl.textContent = `Você perdeu! A palavra era "${palavra}". 😞`;
    document.body.classList.add("derrota");
    desativarEntrada();
    venceuPartida = false;
    if (typeof endGameSession === "function") endGameSession('forca', 'derrota');
    registrarPontuacaoRankingForca();
  }
}

function desativarEntrada() {
  document.getElementById("entrada-letra").disabled = true;
  document.getElementById("btn-tentar").disabled = true;
}

function atualizarBoneco() {
  const partes = ["cabeca","tronco","braco-esq","braco-dir","perna-esq","perna-dir"];
  partes.forEach((p, i) => {
    document.querySelector(`.boneco.${p}`).style.visibility =
      tentativasRestantes <= 5 - i ? "visible" : "hidden";
  });
}

function reiniciarJogo() {
  document.getElementById("entrada-letra").disabled = false;
  document.getElementById("btn-tentar").disabled = false;
  document.getElementById("jogo").style.display = "none";
  document.getElementById("menu-inicial").style.display = "block";
  document.body.classList.remove("vitoria","derrota");
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

// Função para registrar pontuação no ranking ao final do jogo
async function registrarPontuacaoRankingForca() {
  const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
  // Padroniza label de dificuldade
  let dificuldadeLabel =
    dificuldadeAtual === 'facil' ? 'Fácil' :
    dificuldadeAtual === 'medio' ? 'Médio' : 'Difícil';
  // Padroniza resultado para API (sem acento)
  let resultadoApi = venceuPartida ? 'vitoria' : 'derrota';
  await fetch('http://localhost:3001/api/partida', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jogo: 'Forca',
      resultado: resultadoApi,
      nome: user.nome,
      dificuldade: dificuldadeLabel,
      tempo: typeof tempoForca === 'number' ? tempoForca : null
    })
  });

  let seqKey = `forca_seq_vitoria_${user.nome}_${dificuldadeLabel}`;
  let seqAtual = Number(localStorage.getItem(seqKey)) || 0;
  if (venceuPartida) {
    // Ranking geral
    await window.adicionarPontuacaoRanking("Forca", user.nome, {
      tipo: "mais_vitorias_total",
      dificuldade: "",
      valor: 1
    });
    // Ranking por dificuldade
    await window.adicionarPontuacaoRanking("Forca", user.nome, {
      tipo: "mais_vitorias_dificuldade",
      dificuldade: dificuldadeLabel,
      valor: 1
    });
    // Ranking por sequência de vitórias consecutivas
    seqAtual += 1;
    await window.adicionarPontuacaoRanking("Forca", user.nome, {
      tipo: "mais_vitorias_consecutivas",
      dificuldade: dificuldadeLabel,
      valor: seqAtual
    });
  } else {
    // Zera sequência se perder
    seqAtual = 0;
    // Atualiza ranking de sequência para 0 (opcional, mantém coerência)
    await window.adicionarPontuacaoRanking("Forca", user.nome, {
      tipo: "mais_vitorias_consecutivas",
      dificuldade: dificuldadeLabel,
      valor: seqAtual
    });
  }
  localStorage.setItem(seqKey, seqAtual);
}