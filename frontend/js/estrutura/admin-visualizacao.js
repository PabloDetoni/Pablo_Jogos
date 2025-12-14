// admin-visualizacao.js - Exemplo de consumo de rankings/logs
// Implemente fetch para /api/rankings/advanced e /api/logs

const API_URL = 'http://localhost:3001';

function formatarDataBR(isoString) {
  const data = new Date(isoString);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function formatarTempo(segundos) {
  if (typeof segundos !== "number" || isNaN(segundos)) return "-";
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

async function fetchAndRender(url, containerId, columns) {
  const container = document.getElementById(containerId);
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!Array.isArray(data)) return container.innerHTML = '<p>Nenhum dado encontrado.</p>';
    if (data.length === 0) return container.innerHTML = '<p>Nenhum dado encontrado.</p>';
    let table = '<table class="visualizacao-table"><thead><tr>';
    columns.forEach(col => table += `<th>${col.label}</th>`);
    table += '</tr></thead><tbody>';
    data.forEach(row => {
      table += '<tr>';
      columns.forEach(col => table += `<td>${row[col.key] ?? ''}</td>`);
      table += '</tr>';
    });
    table += '</tbody></table>';
    container.innerHTML = table;
  } catch (err) {
    container.innerHTML = '<p class="error">Erro ao carregar dados.</p>';
  }
}

function showLoading(container) {
  container.innerHTML = '<div class="loading">Carregando...</div>';
}
function showError(container, msg) {
  container.innerHTML = `<div class="error">${msg}</div>`;
}
function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  let csv = [];
  for (let row of table.rows) {
    let rowData = [];
    for (let cell of row.cells) rowData.push('"' + cell.innerText.replace(/"/g, '""') + '"');
    csv.push(rowData.join(','));
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
async function renderTable(url, containerId, columns, title, icon) {
  const container = document.getElementById(containerId);
  showLoading(container);
  try {
    const res = await fetch(url);
    let data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p>Nenhum dado encontrado.</p>';
      return;
    }
    // Ordena por ID crescente se houver campo 'id'
    if (data.length > 0 && data[0].id !== undefined) {
      data = data.slice().sort((a, b) => Number(a.id) - Number(b.id));
    }
    let tableId = `table-${containerId}`;
    let html = `<div class='table-title'><i class='${icon}'></i> ${title} <button class='btn-export' onclick="exportTableToCSV('${tableId}','${containerId}.csv')"><i class='fa-solid fa-file-csv'></i> Exportar CSV</button></div>`;
    html += `<div class='table-responsive'><table id='${tableId}' class='visualizacao-table'><thead><tr>`;
    columns.forEach(col => html += `<th>${col.label}</th>`);
    html += '</tr></thead><tbody>';
    data.forEach(row => {
      html += '<tr>';
      columns.forEach(col => {
        let value = row[col.key] ?? '';
        // Formata campos de data
        if ((col.key === 'criado_em' || col.key === 'data' || col.key === 'data_criacao' || col.key === 'data_registro') && value) {
          value = formatarDataBR(value);
        }
        // Truncar campos longos (email, nome, descricao, etc)
        if (col.key === 'senha' && value.length > 8) {
          value = value.substring(0, 8) + '...';
        } else if ((col.key === 'email' || col.key === 'nome' || 
          col.key === 'descricao') && value.length > 22) {
          value = value.substring(0, 19) + '...';
        }
        html += `<td title="${row[col.key] ?? ''}">${value}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (err) {
    showError(container, 'Erro ao carregar dados.');
  }
}

// Função para buscar e renderizar o ranking avançado
async function fetchRankingAvancadoAdmin(filtros = {}) {
  const tabelaContainer = document.getElementById('container-tabela-ranking');
  if (!tabelaContainer) return;
  tabelaContainer.innerHTML = '<div class="loading">Carregando...</div>';
  try {
    const res = await fetch(`${API_URL}/rankings/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtros)
    });
    const data = await res.json();
    const ranking = data.ranking || [];
    let html = `<div class='table-title'><i class='fa-solid fa-star'></i> ${filtros.jogo || ''} ${filtros.tipo ? '('+filtros.tipo.replace(/_/g, ' ')+')' : ''}</div>`;
    if (ranking.length === 0) {
      html += '<p>Nenhum dado encontrado.</p>';
    } else {
      html += `<div class='table-responsive'><table class='visualizacao-table'><thead><tr>
        <th style='text-align:center;'>#</th>
        <th style='text-align:center;'>Nome</th>
        <th style='text-align:center;'>Valor</th>
        <th style='text-align:center;'>Tempo</th>
        <th style='text-align:center;'>Erros</th>
        <th style='text-align:center;'>Status</th>
        <th style='text-align:center;'>Data</th>
      </tr></thead><tbody>`;
      ranking.forEach((row, idx) => {
        let statusBadge = row.status === 'ativo'
          ? '<span class="status-badge status-ativo">Ativo</span>'
          : '<span class="status-badge status-bloqueado">Bloqueado</span>';
        let nomeTd = `<td title="${row.nome}" style='text-align:center;'>${row.nome.length > 18 ? row.nome.substring(0, 16) + '...' : row.nome}</td>`;
        let valorTd = `<td style='text-align:center;'>${row.valor ?? '-'}</td>`;
        let tempoTd = `<td style='text-align:center;'>${row.tempo !== null && row.tempo !== undefined ? formatarTempo(row.tempo) : '-'}</td>`;
        let errosTd = `<td style='text-align:center;'>${row.erros ?? '-'}</td>`;
        let dataTd = `<td style='text-align:center;'>${row.created_at ? formatarDataBR(row.created_at) : '-'}</td>`;
        let trClass = '';
        html += `<tr class="${trClass}"><td style='text-align:center;'>${idx + 1}</td>${nomeTd}${valorTd}${tempoTd}${errosTd}<td style='text-align:center;'>${statusBadge}</td>${dataTd}</tr>`;
      });
      html += '</tbody></table></div>';
    }
    tabelaContainer.innerHTML = html;
    tabelaContainer.style.display = 'block';
  } catch (err) {
    tabelaContainer.innerHTML = '<p class="error">Erro ao carregar ranking avançado.</p>';
    tabelaContainer.style.display = 'block';
  }
}

// --- Filtros avançados para Ranking Avançado (Admin) ---
const jogosRanking = [
  {
    chave: "Jogo da Velha", nome: "Jogo da Velha",
    dificuldades: ["Fácil", "Médio"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)" },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas (Por dificuldade)" }
    ]
  },
  { chave: "PPT", nome: "Pedra Papel Tesoura", dificuldades: [], tipos: [ { chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas" } ] },
  { chave: "Forca", nome: "Forca", dificuldades: ["Fácil", "Médio", "Difícil"], tipos: [ { chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas (Por dificuldade)" } ] },
  { chave: "2048", nome: "2048", dificuldades: [], tipos: [ { chave: "pontuacao", label: "Maior pontuação" } ] },
  { chave: "Memória", nome: "Memória", dificuldades: ["Fácil", "Médio", "Difícil"], tipos: [ { chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)" } ] },
  { chave: "Sudoku", nome: "Sudoku", dificuldades: ["Fácil", "Médio", "Difícil", "Muito Difícil"], tipos: [ { chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)" } ] },
  { chave: "Pong", nome: "Pong", dificuldades: ["Fácil", "Médio", "Difícil"], tipos: [ { chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)" } ] },
  { chave: "Campo Minado", nome: "Campo Minado", dificuldades: ["Fácil", "Médio", "Difícil"], tipos: [ { chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)" } ] }
];

function preencherFiltrosRankingAdmin() {
  const jogoSel = document.getElementById('filtro-jogo');
  const tipoSel = document.getElementById('filtro-tipo');
  const difSel = document.getElementById('filtro-dificuldade');
  if (!jogoSel || !tipoSel || !difSel) return; // Evita erro se algum filtro não existe
  // Preenche jogos
  jogoSel.innerHTML = jogosRanking.map((j, i) => `<option value="${i}">${j.nome}</option>`).join('');
  // Atualiza tipos e dificuldades ao trocar jogo
  function atualizarTiposEDificuldades() {
    const idx = jogoSel.value;
    const jogo = jogosRanking[idx];
    tipoSel.innerHTML = jogo.tipos.map((t, i) => `<option value="${i}">${t.label}</option>`).join('');
    // Dificuldades
    if (jogo.dificuldades.length > 0) {
      difSel.innerHTML = '<option value="">Todas</option>' + jogo.dificuldades.map(d => `<option value="${d}">${d}</option>`).join('');
      difSel.disabled = false;
    } else {
      difSel.innerHTML = '<option value="">N/A</option>';
      difSel.disabled = true;
    }
  }
  jogoSel.onchange = atualizarTiposEDificuldades;
  tipoSel.onchange = atualizarTiposEDificuldades;
  atualizarTiposEDificuldades();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toggle-usuarios').onclick = () => toggleSection('visualizacao-usuarios', 'toggle-usuarios');
  document.getElementById('toggle-jogos').onclick = () => toggleSection('visualizacao-jogos', 'toggle-jogos');
  document.getElementById('toggle-rankings').onclick = () => toggleSection('visualizacao-rankings', 'toggle-rankings');
  document.getElementById('toggle-rankings-avancados').onclick = () => toggleSection('visualizacao-rankings-avancados', 'toggle-rankings-avancados');

  renderTable(`${API_URL}/usuario`, 'visualizacao-usuarios', [
    { key: 'id', label: 'ID' },
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'senha', label: 'Senha' },
    { key: 'status', label: 'Status' },
    { key: 'criado_em', label: 'Criado em' }
  ], 'Usuários', 'fa-solid fa-users');
  renderTable(`${API_URL}/jogo`, 'visualizacao-jogos', [
    { key: 'id', label: 'ID' },
    { key: 'titulo', label: 'Título' },
    { key: 'genero', label: 'Gênero' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'criado_em', label: 'Criado em' }
  ], 'Jogos', 'fa-solid fa-gamepad');

  // --- NOVO: Ranking Avançado ---
  fetchRankingAvancadoAdmin();
});

// Ao expandir ranking avançado, mostra filtros e mensagem inicial
function mostrarRankingAvancado() {
  const tabelaContainer = document.getElementById('container-tabela-ranking');
  if (!tabelaContainer) return;
  tabelaContainer.innerHTML = '<div class="ranking-msg-inicial">Aplique a filtragem para ver os dados</div>';
  preencherFiltrosRankingAdmin();
  const btnFiltros = document.getElementById('btn-filtros-avancados');
  if (btnFiltros) btnFiltros.onclick = () => {
    document.getElementById('modal-filtros-avancados').style.display = 'flex';
  };
  const btnClose = document.getElementById('close-modal-filtros');
  if (btnClose) btnClose.onclick = () => {
    document.getElementById('modal-filtros-avancados').style.display = 'none';
  };
  const btnAplicar = document.getElementById('btn-aplicar-filtros-avancados');
  if (btnAplicar) btnAplicar.onclick = () => {
    filtrarRankingAvancadoAdmin();
    document.getElementById('modal-filtros-avancados').style.display = 'none';
  };
}

// Substitui toggleSection para ranking avançado
function toggleSection(sectionId, btnId) {
  const section = document.getElementById(sectionId);
  const btn = document.getElementById(btnId);
  if (section.style.display === 'none') {
    section.style.display = 'block';
    btn.classList.add('active');
    btn.innerHTML = '<i class="fa-solid fa-minus"></i>';
    if (sectionId === 'visualizacao-rankings-avancados') mostrarRankingAvancado();
  } else {
    section.style.display = 'none';
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
  }
}

// Ao aplicar filtro, remove mensagem inicial e mostra tabela normalmente
async function filtrarRankingAvancadoAdmin() {
  const tabelaContainer = document.getElementById('container-tabela-ranking');
  if (!tabelaContainer) return;
  tabelaContainer.innerHTML = '';
  const jogoIdx = document.getElementById('filtro-jogo').value;
  const tipoIdx = document.getElementById('filtro-tipo').value;
  const dificuldade = document.getElementById('filtro-dificuldade').value || null;
  const usuario = document.getElementById('filtro-usuario').value.trim();
  const status = document.getElementById('filtro-status').value;
  const dataInicial = document.getElementById('filtro-data-inicial').value;
  const dataFinal = document.getElementById('filtro-data-final').value;
  const jogoObj = jogosRanking[jogoIdx];
  const tipoObj = jogoObj.tipos[tipoIdx];
  const params = {
    jogo: jogoObj.chave,
    tipo: tipoObj.chave,
    dificuldade: dificuldade || null,
    usuario,
    status,
    dataInicial,
    dataFinal
  };
  await fetchRankingAvancadoAdmin(params);
}
