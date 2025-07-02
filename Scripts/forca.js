// forca.js
// Dependência: stats.js (startGameSession, endGameSession)
// Integração: rankings.js (adicionarPontuacaoRanking, getNomeUsuario)

let bancoPalavras = {};
let palavra = "";
let palavraNorm = "";        // versão sem acentos
let dica = "";
let resposta = [];
let letrasUsadas = [];
let tentativasRestantes = 6;
let venceuPartida = false;

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
  startGameSession('forca');

  document.getElementById("menu-inicial").style.display = "none";
  document.getElementById("jogo").style.display = "block";

  const dificuldade = document.getElementById("dificuldade").value;
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
    endGameSession('forca', 'vitoria');
    registrarPontuacaoRankingForca();
  } else if (tentativasRestantes <= 0) {
    resEl.textContent = `Você perdeu! A palavra era "${palavra}". 😞`;
    document.body.classList.add("derrota");
    desativarEntrada();
    venceuPartida = false;
    endGameSession('forca', 'derrota');
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
function registrarPontuacaoRankingForca() {
  // Só registra se venceu (padrão). Para registrar derrotas, remova o "venceuPartida" do if.
  if (venceuPartida && typeof adicionarPontuacaoRanking === "function" && typeof getNomeUsuario === "function") {
    // Score pode ser a quantidade de tentativas RESTANTES (ou seja, quanto mais sobrar, melhor)
    // Ou pode ser o número de letras acertadas, ou tempo (se adicionar timer)
    // Aqui vamos usar tentativasRestantes como score
    adicionarPontuacaoRanking('Forca', getNomeUsuario(), tentativasRestantes);
  }
}