// rankings.js - dinâmico, multi-tabela por dificuldade, colunas específicas por tipo, suporte a usuários bloqueados

// Só executa lógica de ranking se os elementos existem (evita erro em memoria.html)
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof checkUserBlocked === 'function') await checkUserBlocked();
  if (typeof startBlockedUserPolling === 'function') startBlockedUserPolling();
  // Só chama preencherSelects se os elementos existem
  if (document.getElementById('jogo-select') && document.getElementById('tipo-ranking')) {
    preencherSelects();
  }
});

const jogosRanking = [
  {
    chave: "Jogo da Velha", nome: "Jogo da Velha",
    dificuldades: ["Fácil", "Médio"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas (Por dificuldade)", porDificuldade: true, colunas: ["Sequência"] }
    ]
  },
  {
    chave: "PPT", nome: "Pedra Papel Tesoura",
    dificuldades: [],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas", colunas: ["Sequência"] }
    ]
  },
  {
    chave: "Forca", nome: "Forca",
    dificuldades: ["Fácil", "Médio", "Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas (Por dificuldade)", porDificuldade: true, colunas: ["Sequência"] }
    ]
  },
  {
    chave: "2048", nome: "2048",
    dificuldades: [],
    tipos: [
      { chave: "pontuacao", label: "Maior pontuação", colunas: ["Pontuação"] }
    ]
  },
  {
    chave: "Memória", nome: "Memória",
    dificuldades: ["Fácil", "Médio", "Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo", "Erros"] }
    ]
  },
  {
    chave: "Sudoku", nome: "Sudoku",
    dificuldades: ["Fácil", "Médio", "Difícil", "Muito Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo", "Erros"] }
    ]
  },
  {
    chave: "Pong", nome: "Pong",
    dificuldades: ["Fácil", "Médio", "Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo", "Erros"] }
    ]
  },
  {
    chave: "Campo Minado", nome: "Campo Minado",
    dificuldades: ["Fácil", "Médio", "Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo"] }
    ]
  }
];

// Função para preencher selects dinâmicos
function preencherSelects() {
  const jogoSelect = document.getElementById('jogo-select');
  const tipoRanking = document.getElementById('tipo-ranking');
  jogoSelect.innerHTML = jogosRanking.map((j, i) => `<option value="${i}">${j.nome}</option>`).join('');
  jogoSelect.onchange = atualizarTipos;
  tipoRanking.onchange = carregarRankingSelecionado;
  atualizarTipos();
  function atualizarTipos() {
    const idx = jogoSelect.value;
    const jogo = jogosRanking[idx];
    tipoRanking.innerHTML = jogo.tipos.map((t, i) => `<option value="${i}">${t.label}</option>`).join('');
    tipoRanking.selectedIndex = 0;
    carregarRankingSelecionado();
  }
}

// Monta e exibe ranking específico
async function carregarRankingSelecionado() {
  const jogoSelect = document.getElementById('jogo-select');
  const tipoRanking = document.getElementById('tipo-ranking');
  const container = document.getElementById('rankings-container');
  const jogoObj = jogosRanking[jogoSelect.value];
  const tipoObj = jogoObj.tipos[tipoRanking.value];

  container.innerHTML = `<div class="ranking-section"><em>Carregando ranking...</em></div>`;

  if (tipoObj.porDificuldade && jogoObj.dificuldades.length > 0) {
    // Múltiplas tabelas, uma para cada dificuldade
    let html = '';
    for (const dificuldade of jogoObj.dificuldades) {
      const params = {
        jogo: jogoObj.chave,
        tipo: tipoObj.chave,
        dificuldade
      };
      const ranking = await obterRankingAvancado(params);
      html += montarTabelaRanking(jogoObj.nome, tipoObj, ranking, dificuldade);
    }
    container.innerHTML = html;
  } else {
    // Única tabela
    const params = {
      jogo: jogoObj.chave,
      tipo: tipoObj.chave,
      dificuldade: null
    };
    const ranking = await obterRankingAvancado(params);
    container.innerHTML = montarTabelaRanking(jogoObj.nome, tipoObj, ranking);
  }
}

// Monta o HTML da tabela de ranking com suporte a usuários bloqueados
function montarTabelaRanking(nomeJogo, tipoObj, ranking, dificuldade = null) {
  const colunasExtras = tipoObj.colunas || [];
  // Calcula posições ignorando bloqueados
  let posicaoReal = 1;
  return `
    <section class="ranking-section">
      <h2>${nomeJogo} - ${tipoObj.label}${dificuldade ? `</h2><div class="dificuldade-title">${dificuldade}</div>` : "</h2>"}
      <table class="ranking-table">
        <thead>
          <tr>
            <th>Posição</th>
            <th>Nome</th>
            ${colunasExtras.map(c => `<th>${c}</th>`).join('')}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.length === 0
            ? `<tr><td colspan="${3 + colunasExtras.length}"><em>Sem registros</em></td></tr>`
            : ranking.map((item, idx) => {
                const isBloqueado = item.status === "bloqueado";
                const isAtivo = item.status === "ativo";
                // Posição só conta usuários ativos
                let posTd = isBloqueado
                  ? `<td class="pos-bloqueado">--</td>`
                  : `<td>${posicaoReal++}º</td>`;
                // Badge de status
                let statusTd = isBloqueado
                  ? `<td class="status-badge status-bloqueado">Bloqueado</td>`
                  : `<td class="status-badge status-ativo">Ativo</td>`;
                // Linha destacada se for o usuário logado
                let trClass = '';
                if (getNomeUsuario() === item.nome) trClass += 'meu-ranking ';
                if (isBloqueado) trClass += 'bloqueado';
                return `
                  <tr class="${trClass.trim()}">
                    ${posTd}
                    <td>${item.nome}</td>
                    ${colunasExtras.map(c => {
                      if (c === "Pontuação") return `<td>${item.valor}</td>`;
                      if (c === "Vitórias") return `<td>${item.valor}</td>`;
                      if (c === "Tempo") return `<td>${formatarTempo(item.tempo)}</td>`;
                      if (c === "Sequência") return `<td>${item.valor}</td>`;
                      if (c === "Erros") return `<td class="erros">${item.erros ?? 0}</td>`;
                      return `<td>-</td>`;
                    }).join('')}
                    ${statusTd}
                  </tr>
                `;
              }).join('')
          }
        </tbody>
      </table>
    </section>
  `;
}

// Busca ranking avançado do backend
async function obterRankingAvancado(params) {
  try {
    const res = await fetch((window.API_URL || 'http://localhost:3001') + '/rankings/advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data.ranking || [];
  } catch (e) {
    console.error('Erro ao obter ranking:', e);
    return [];
  }
}

// Função para adicionar pontuação/dados ao ranking (chame no fim do jogo)
async function adicionarPontuacaoRanking(jogo, nome, dados) {
  try {
    // Sanitiza dificuldade: nunca undefined ou string vazia
    let novoDados = { ...dados };
    if (novoDados.dificuldade === undefined || novoDados.dificuldade === '' || novoDados.dificuldade === 'null') {
      novoDados.dificuldade = null;
    }
    await fetch((window.API_URL || 'http://localhost:3001') + '/rankings/advanced/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jogo, nome, ...novoDados })
    });
  } catch (e) {
    console.error('Erro ao adicionar pontuação ao ranking:', e, { jogo, nome, dados });
    // pode exibir alerta se desejar
  }
}

// Torna a função global para uso em outros scripts
window.adicionarPontuacaoRanking = adicionarPontuacaoRanking;

// Utilitário para obter o nome do usuário logado (sessionStorage)
function getNomeUsuario() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (user && user.nome) return user.nome;
  if (sessionStorage.getItem('guest') === 'true') return 'Convidado';
  return 'Desconhecido';
}

// Formata tempo em segundos para mm:ss
function formatarTempo(segundos) {
  if (typeof segundos !== "number" || isNaN(segundos)) return "-";
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

// Inicialização da página de rankings
document.addEventListener('DOMContentLoaded', () => {
  preencherSelects();
});