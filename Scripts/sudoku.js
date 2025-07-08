// --- BLOQUEIO DINÂMICO DE JOGO (admin) --- //
const GAME_NAME = 'Sudoku';
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

// sudoku.js
// Integrado ao ranking avançado via API
document.addEventListener('DOMContentLoaded', async () => {
  await checkUserBlocked();
  startBlockedUserPolling();
});

const sudoku = (() => {
  const dificuldades = {
    facil:     { dicasIniciais: 38, nome: "Fácil" },
    medio:     { dicasIniciais: 32, nome: "Médio" },
    dificil:   { dicasIniciais: 26, nome: "Difícil" },
    mtDificil: { dicasIniciais: 22, nome: "Muito Difícil" }
  };
  const MAX_ERROS = 3;
  const MAX_DICAS = 3;
  const TAM = 9;

  let puzzle = null, solucao = null, fixas = null, notas = null;
  let celulaSelecionada = 0;
  let modoRascunho = false;
  let erros = 0, dicasUsadas = 0, jogoEncerrado = false, timer = 0, cronometroInterval = null, dificuldadeAtual = "facil";

  const boardEl = () => document.getElementById('sudoku-board');
  const errosEl = () => document.getElementById('erros-atual');
  const dicasEl = () => document.getElementById('dicas-restantes');
  const cronoEl = () => document.getElementById('sudoku-cronometro');
  const difEl = () => document.getElementById('sudoku-dificuldade');
  const btnRascunho = () => document.getElementById('btn-rascunho');
  const btnApagar = () => document.getElementById('btn-apagar');
  const btnDica = () => document.getElementById('btn-dica');
  const numerosEl = () => document.getElementById('sudoku-numeros');

  function iniciarJogo(dificuldade = "facil") {
    dificuldadeAtual = dificuldade;
    const difInfo = dificuldades[dificuldade] || dificuldades["facil"];
    difEl().textContent = difInfo.nome;
    puzzle = gerarSudoku(difInfo.dicasIniciais);
    solucao = resolverSudoku([...puzzle.map(r => [...r])]);
    fixas = puzzle.map(linha => linha.map(v => v !== 0));
    notas = Array(TAM).fill(0).map(()=>Array(TAM).fill(0).map(()=>[]));
    celulaSelecionada = 0;
    modoRascunho = false;
    erros = 0;
    dicasUsadas = 0;
    jogoEncerrado = false;
    timer = 0;
    document.getElementById('novo-jogo-footer').style.display = "none";
    atualizaErros();
    atualizaDicas();
    criaBotoesNumeros();
    renderizarTabuleiro();
    atualizarSelecionada(0);
    atualizaNumerosCompletos();
    if (cronometroInterval) clearInterval(cronometroInterval);
    cronometroInterval = setInterval(() => {
      timer++;
      atualizarCronometro();
    }, 1000);
    atualizarCronometro();
    btnRascunho().setAttribute("aria-pressed", "false");
    btnRascunho().classList.remove('ativo');
    document.body.classList.remove('vitoria', 'derrota');
    if (typeof startGameSession === "function") startGameSession('sudoku');
  }

  function finalizarJogo(vitoria) {
    jogoEncerrado = true;
    clearInterval(cronometroInterval);

    if (typeof endGameSession === "function") {
      endGameSession('sudoku', vitoria ? 'vitoria' : 'derrota', dificuldadeAtual);
    }

    registrarPontuacaoRankingSudoku(vitoria);

    const resultado = vitoria ? "Vitória!" : "Derrota!";
    const tempo = formatarTempo(timer);
    const estatisticas = `Tempo: ${tempo} | Erros: ${erros}`;

    alert(`${resultado}\n${estatisticas}`);

    document.getElementById('novo-jogo-footer').style.display = "flex";
  }

  function gerarSudoku(numDicas) {
    let tab = Array(TAM).fill(0).map(()=>Array(TAM).fill(0));
    preencherSudoku(tab);

    let removidos = 0, tentativas = 0;
    while (removidos < (TAM*TAM - numDicas) && tentativas < 200) {
      let i = Math.floor(Math.random()*TAM), j = Math.floor(Math.random()*TAM);
      if (tab[i][j] === 0) continue;
      let backup = tab[i][j];
      tab[i][j] = 0;
      let contador = { n: 0 };
      encontrarSolucoes([...tab.map(r=>[...r])], contador, 2);
      if (contador.n !== 1) {
        tab[i][j] = backup;
        tentativas++;
      } else {
        removidos++;
      }
    }
    return tab;
  }

  function preencherSudoku(tab) {
    let nums = [1,2,3,4,5,6,7,8,9];
    function helper(pos) {
      if (pos === TAM*TAM) return true;
      let row = Math.floor(pos/TAM), col = pos%TAM;
      if (tab[row][col] !== 0) return helper(pos+1);
      nums = nums.sort(()=>Math.random()-0.5);
      for (let n of nums) {
        if (podeColocar(tab, row, col, n)) {
          tab[row][col] = n;
          if (helper(pos+1)) return true;
          tab[row][col] = 0;
        }
      }
      return false;
    }
    helper(0);
  }

  function encontrarSolucoes(tab, contador, limite=2, pos=0) {
    if (contador.n >= limite) return;
    if (pos === TAM*TAM) { contador.n++; return; }
    let row = Math.floor(pos/TAM), col = pos%TAM;
    if (tab[row][col] !== 0) { encontrarSolucoes(tab, contador, limite, pos+1); return; }
    for (let n=1; n<=9; n++) {
      if (podeColocar(tab, row, col, n)) {
        tab[row][col] = n;
        encontrarSolucoes(tab, contador, limite, pos+1);
        tab[row][col] = 0;
      }
      if (contador.n >= limite) break;
    }
  }

  function podeColocar(tab, i, j, n) {
    for (let x=0; x<TAM; x++) if (tab[i][x]===n || tab[x][j]===n) return false;
    let bi = Math.floor(i/3)*3, bj = Math.floor(j/3)*3;
    for (let x=0; x<3; x++) for (let y=0; y<3; y++) if (tab[bi+x][bj+y]===n) return false;
    return true;
  }

  function resolverSudoku(tab) {
    function solve(pos) {
      if (pos === TAM*TAM) return true;
      let row = Math.floor(pos/TAM), col = pos%TAM;
      if (tab[row][col] !== 0) return solve(pos+1);
      for (let n=1; n<=9; n++) {
        if (podeColocar(tab, row, col, n)) {
          tab[row][col] = n;
          if (solve(pos+1)) return true;
          tab[row][col] = 0;
        }
      }
      return false;
    }
    solve(0);
    return tab;
  }

  function renderizarTabuleiro() {
    boardEl().innerHTML = "";
    for (let i=0; i<TAM; i++) {
      for (let j=0; j<TAM; j++) {
        let idx = i*TAM+j;
        let val = puzzle[i][j];
        let cell = document.createElement("div");
        cell.className = "sudoku-cell";
        if (fixas[i][j]) cell.classList.add("fixa");
        if ((j+1)%3===0 && j!==8) cell.classList.add("block-right");
        if ((i+1)%3===0 && i!==8) cell.classList.add("block-bottom");
        cell.tabIndex = 0;
        cell.setAttribute("data-idx", idx);
        if (val !== 0) cell.textContent = val;
        if (notas[i][j].length > 0 && val === 0) {
          let notasDiv = document.createElement("div");
          notasDiv.className = "notas";
          for (let k=1; k<=9; k++) notasDiv.innerHTML += `<span>${notas[i][j].includes(k)?k:""}</span>`;
          cell.appendChild(notasDiv);
          cell.classList.add('rascunho');
        }
        cell.addEventListener("click", ()=>selecionarCelula(idx));
        cell.addEventListener("keydown", e=>tratarTeclaCelula(e, idx));
        boardEl().appendChild(cell);
      }
    }
    atualizarAtivos();
  }

  function clearDestacaAnimado() {
    let cells = [...boardEl().children];
    for (let c of cells) c.classList.remove('destaca-correta', 'destaca-errada');
  }
  function clearDestacaIguais() {
    let cells = [...boardEl().children];
    for (let c of cells) c.classList.remove('destaca-igual');
  }

  function selecionarCelula(idx) {
    if (jogoEncerrado) return;
    clearDestacaAnimado();
    clearDestacaIguais();
    atualizarSelecionada(idx);
    destacarIguais(idx);
  }
  function atualizarSelecionada(idx) {
    celulaSelecionada = idx;
    let cells = [...boardEl().children];
    for (let k=0; k<cells.length; k++)
      cells[k].classList.toggle('selecionada', k===idx);
    atualizarAtivos();
  }
  function atualizarAtivos() {
    let i = Math.floor(celulaSelecionada/TAM), j = celulaSelecionada%TAM;
    let cells = [...boardEl().children];
    for (let k=0; k<cells.length; k++) {
      let x = Math.floor(k/TAM), y = k%TAM;
      let ativo = (x===i || y===j || (Math.floor(x/3)===Math.floor(i/3)&&Math.floor(y/3)===Math.floor(j/3)));
      cells[k].classList.toggle('ativa', ativo && k!==celulaSelecionada);
    }
  }

  function tratarTeclaCelula(e, idx) {
    if (jogoEncerrado) return;
    let i = Math.floor(idx/TAM), j = idx%TAM;
    if (["ArrowUp","w"].includes(e.key)) { e.preventDefault(); if (i>0) selecionarCelula(idx-TAM);}
    if (["ArrowDown","s"].includes(e.key)) {e.preventDefault(); if (i<8) selecionarCelula(idx+TAM);}
    if (["ArrowLeft","a"].includes(e.key)) {e.preventDefault(); if (j>0) selecionarCelula(idx-1);}
    if (["ArrowRight","d"].includes(e.key)) {e.preventDefault(); if (j<8) selecionarCelula(idx+1);}
    if (/^[1-9]$/.test(e.key)) { e.preventDefault(); inserirNumero(Number(e.key));}
    if (e.key==="Backspace"||e.key==="Delete") { e.preventDefault(); apagarCelula();}
    if (e.key==="n"||e.key==="N") { e.preventDefault(); alternarRascunho();}
    if (e.key==="h"||e.key==="H") { e.preventDefault(); usarDica();}
    if (e.key===" ") { e.preventDefault(); alternarRascunho();}
    if (e.key==="Tab") { e.preventDefault(); selecionarCelula((idx+1)%81);}
  }

  function inserirNumero(n) {
    if (jogoEncerrado) return;
    let i = Math.floor(celulaSelecionada/TAM), j = celulaSelecionada%TAM;
    if (fixas[i][j]) { mostrarAvisoCelula(); return; }

    if (modoRascunho) {
      if (notas[i][j].includes(n)) notas[i][j] = notas[i][j].filter(x=>x!==n);
      else notas[i][j].push(n);
      renderizarTabuleiro();
      atualizarSelecionada(celulaSelecionada);
      return;
    }

    if (puzzle[i][j] === n && n !== solucao[i][j]) return;
    if (puzzle[i][j] !== 0) { mostrarAvisoCelula(); return; }

    puzzle[i][j] = n;
    notas[i][j] = [];
    renderizarTabuleiro();

    clearDestacaAnimado();
    clearDestacaIguais();

    let cells = [...boardEl().children];
    if (solucao[i][j] === n) {
      puzzle[i][j] = n;
      notas[i][j] = [];
      fixas[i][j] = true;
      for (let idx=0; idx<cells.length; idx++) {
        let x = Math.floor(idx/TAM), y = idx%TAM;
        if (puzzle[x][y] === n && solucao[x][y] === n) {
          cells[idx].classList.add('destaca-correta');
        }
      }
    } else {
      for (let idx=0; idx<cells.length; idx++) {
        let x = Math.floor(idx/TAM), y = idx%TAM;
        if (puzzle[x][y] === n) {
          cells[idx].classList.add('destaca-errada');
        }
      }
    }

    atualizarSelecionada(celulaSelecionada);
    atualizaNumerosCompletos();

    if (solucao[i][j] === n) {
      if (checarVitoria()) finalizarJogo(true);
    } else {
      erros++;
      atualizaErros();
      if (erros >= MAX_ERROS) finalizarJogo(false);
    }
  }

  function apagarCelula() {
    if (jogoEncerrado) return;
    let i = Math.floor(celulaSelecionada/TAM), j = celulaSelecionada%TAM;
    if (fixas[i][j]) { mostrarAvisoCelula(); return; }
    if (modoRascunho) {
      notas[i][j] = [];
      renderizarTabuleiro();
      atualizarSelecionada(celulaSelecionada);
      return;
    }
    puzzle[i][j] = 0;
    notas[i][j] = [];
    renderizarTabuleiro();
    clearDestacaAnimado();
    clearDestacaIguais();
    atualizarSelecionada(celulaSelecionada);
    atualizaNumerosCompletos();
  }
  function alternarRascunho() {
    modoRascunho = !modoRascunho;
    btnRascunho().setAttribute("aria-pressed", modoRascunho ? "true" : "false");
    btnRascunho().classList.toggle('ativo', modoRascunho);
  }
  function usarDica() {
    if (jogoEncerrado || dicasUsadas>=MAX_DICAS) return;
    let vazias = [];
    for (let i=0;i<TAM;i++) for (let j=0;j<TAM;j++)
      if (!fixas[i][j] && puzzle[i][j]===0) vazias.push([i,j]);
    if (!vazias.length) return;
    let [i,j] = vazias[Math.floor(Math.random()*vazias.length)];
    puzzle[i][j] = solucao[i][j];
    notas[i][j] = [];
    dicasUsadas++;
    atualizaDicas();
    fixas[i][j] = true;
    renderizarTabuleiro();

    clearDestacaAnimado();
    clearDestacaIguais();

    let cells = [...boardEl().children];
    for (let idx=0; idx<cells.length; idx++) {
      let x = Math.floor(idx/TAM), y = idx%TAM;
      if (puzzle[x][y] === solucao[i][j] && solucao[x][y] === solucao[i][j]) {
        cells[idx].classList.add('destaca-correta');
      }
    }
    atualizarSelecionada(i*TAM+j);
    atualizaNumerosCompletos();
    if (checarVitoria()) finalizarJogo(true);
  }

  function atualizaErros() { errosEl().textContent = erros; }
  function atualizaDicas() { dicasEl().textContent = MAX_DICAS-dicasUsadas; btnDica().disabled = dicasUsadas>=MAX_DICAS; }
  function atualizaNumerosCompletos() {
    let contar = Array(10).fill(0);
    for (let i=0;i<TAM;i++) for (let j=0;j<TAM;j++) if (puzzle[i][j]>0) contar[puzzle[i][j]]++;
    for (let n=1;n<=9;n++) {
      let btn = document.getElementById('num-btn-'+n);
      if (btn) btn.disabled = (contar[n]>=9);
      btn && btn.classList.toggle('completo', contar[n]>=9);
    }
  }
  function checarVitoria() {
    for (let i=0;i<TAM;i++) for (let j=0;j<TAM;j++)
      if (puzzle[i][j] !== solucao[i][j]) return false;
    return true;
  }
  function mostrarAvisoCelula() {
    let c = boardEl().children[celulaSelecionada];
    c.classList.add('erro');
    setTimeout(()=>c.classList.remove('erro'), 350);
  }

  function destacarIguais(idx) {
    let i = Math.floor(idx/TAM), j = idx%TAM;
    let val = puzzle[i][j];
    let cells = [...boardEl().children];
    for (let k=0; k<cells.length; k++) {
      let x = Math.floor(k/TAM), y = k%TAM;
      let match = (val>0 && puzzle[x][y]===val);
      let cell = cells[k];
      cell.classList.remove('destaca-igual');
      if (match && puzzle[x][y]) {
        void cell.offsetWidth;
        cell.classList.add('destaca-igual');
      }
    }
  }

  boardEl().addEventListener("click", e => {
    if (!e.target.classList.contains('sudoku-cell')) {
      clearDestacaAnimado();
      clearDestacaIguais();
    }
  });

  function criaBotoesNumeros() {
    numerosEl().innerHTML = "";
    for (let n=1; n<=9; n++) {
      let btn = document.createElement("button");
      btn.id = 'num-btn-'+n;
      btn.textContent = n;
      btn.tabIndex = 0;
      btn.addEventListener("click", ()=>inserirNumero(n));
      numerosEl().appendChild(btn);
    }
  }

  function atualizarCronometro() {
    cronoEl().textContent = formatarTempo(timer);
  }
  function formatarTempo(seg) {
    let m = Math.floor(seg/60), s = seg%60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  btnRascunho().addEventListener("click", alternarRascunho);
  btnApagar().addEventListener("click", apagarCelula);
  btnDica().addEventListener("click", usarDica);

  document.addEventListener("keydown", function(e) {
    if (document.activeElement.tagName === "INPUT" || jogoEncerrado) return;
    if (/^[1-9]$/.test(e.key)) inserirNumero(Number(e.key));
    if (["Backspace","Delete"].includes(e.key)) apagarCelula();
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].includes(e.key))
      tratarTeclaCelula(e, celulaSelecionada);
    if (e.key==="n"||e.key==="N"||e.key===" ") alternarRascunho();
    if (e.key==="h"||e.key==="H") usarDica();
    if (e.key==="Tab") { e.preventDefault(); selecionarCelula((celulaSelecionada+1)%81);}
  });

  // --- INTEGRAÇÃO RANKING - registra score ao terminar o jogo ---
  async function registrarPontuacaoRankingSudoku(vitoria) {
    // Salva partida real para estatísticas
    const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
    await fetch('http://localhost:3001/api/partida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jogo: 'Sudoku',
        resultado: vitoria ? 'vitoria' : 'derrota',
        nome: user.nome,
        tempo: typeof timer === 'number' ? timer : null
      })
    });
    if (vitoria) {
      const user = JSON.parse(sessionStorage.getItem("user")) || { nome: "Convidado" };
      let dificuldadeLabel = 
        dificuldadeAtual === "facil" ? "Fácil" :
        dificuldadeAtual === "medio" ? "Médio" :
        dificuldadeAtual === "dificil" ? "Difícil" : "Muito Difícil";

      // 1. Ranking geral (mais vitórias totais)
      await atualizarRankingAdvanced({
        jogo: "Sudoku",
        tipo: "mais_vitorias_total",
        dificuldade: "",
        nome: user.nome,
        valorNovo: 1
      });

      // 2. Ranking por dificuldade (mais vitórias por dificuldade)
      await atualizarRankingAdvanced({
        jogo: "Sudoku",
        tipo: "mais_vitorias_dificuldade",
        dificuldade: dificuldadeLabel,
        nome: user.nome,
        valorNovo: 1
      });

      // 3. Ranking menor tempo por dificuldade: só atualiza se for o menor tempo
      await atualizarRankingMenorTempo({
        jogo: "Sudoku",
        tipo: "menor_tempo",
        dificuldade: dificuldadeLabel,
        nome: user.nome,
        tempo: timer,
        erros: erros
      });
    }
  }

  // Helper para vitórias acumuladas (total e por dificuldade)
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

    try {
      await fetch("http://localhost:3001/rankings/advanced/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jogo,
          tipo,
          dificuldade,
          nome,
          valor: valorAntigo + valorNovo
        })
      });
    } catch (e) {}
  }

  // Helper para ranking de menor tempo (só salva se for o menor tempo do usuário)
  async function atualizarRankingMenorTempo({ jogo, tipo, dificuldade, nome, tempo, erros }) {
    let tempoAntigo = null;
    try {
      const res = await fetch("http://localhost:3001/rankings/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jogo, tipo, dificuldade })
      });
      const data = await res.json();
      if (data.ranking && Array.isArray(data.ranking)) {
        const registro = data.ranking.find(e => e.nome === nome);
        if (registro && typeof registro.tempo === "number") tempoAntigo = registro.tempo;
      }
    } catch (e) {}

    // Só envia se tempo for menor (ou se não existe registro)
    if (tempoAntigo === null || tempo < tempoAntigo) {
      try {
        await fetch("http://localhost:3001/rankings/advanced/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jogo,
            tipo,
            dificuldade,
            nome,
            tempo,
            erros,
            valor: 1 // valor só para indicar vitória, ranking é pelo tempo
          })
        });
      } catch (e) {}
    }
  }

  return {
    iniciarJogo,
    reiniciarJogo: ()=>iniciarJogo(dificuldadeAtual)
  };
})();

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById('btn-iniciar').addEventListener('click', () => {
    const dif = document.getElementById('dificuldade').value;
    document.getElementById('menu-inicial').style.display = 'none';
    document.getElementById('sudoku-bloco-principal').style.display = 'flex';
    sudoku.iniciarJogo(dif);
  });
});