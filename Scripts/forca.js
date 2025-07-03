// forca.js
// Integrado ao ranking avançado via API

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

// Função para registrar pontuação no ranking ao final do jogo
async function registrarPontuacaoRankingForca() {
  const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
  let dificuldadeLabel =
    dificuldadeAtual === 'facil' ? 'Fácil' :
    dificuldadeAtual === 'medio' ? 'Médio' : 'Difícil';

  // 1. Ranking geral (mais vitórias totais)
  if (venceuPartida) {
    await fetch("http://localhost:3001/rankings/advanced/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogo: "Forca",
        tipo: "maior_vitoria_total",
        dificuldade: "",
        nome: user.nome,
        valor: 1
      })
    });
  }

  // 2. Ranking por dificuldade (mais vitórias por dificuldade)
  if (venceuPartida) {
    await fetch("http://localhost:3001/rankings/advanced/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogo: "Forca",
        tipo: "maior_vitoria_dificuldade",
        dificuldade: dificuldadeLabel,
        nome: user.nome,
        valor: 1
      })
    });
  }

  // 3. Ranking por sequência de vitórias consecutivas por dificuldade
  // Controle local da sequência
  let seqKey = `forca_seq_vitoria_${user.nome}_${dificuldadeLabel}`;
  let seqAtual = Number(localStorage.getItem(seqKey)) || 0;
  if (venceuPartida) {
    seqAtual += 1;
    await fetch("http://localhost:3001/rankings/advanced/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogo: "Forca",
        tipo: "maior_sequencia_vitoria",
        dificuldade: dificuldadeLabel,
        nome: user.nome,
        valor: seqAtual
      })
    });
  } else {
    seqAtual = 0;
  }
  localStorage.setItem(seqKey, seqAtual);
}