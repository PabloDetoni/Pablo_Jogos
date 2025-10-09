// admin-visualizacao.js - Exemplo de consumo de rankings/logs
// Implemente fetch para /api/rankings/advanced e /api/logs

const API_URL = 'http://localhost:3001';

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
        // Truncar campos longos (email, nome, descricao, etc)
        if (col.key === 'senha' && value.length > 8) {
          value = value.substring(0, 8) + '...';
        } else if ((col.key === 'email' || col.key === 'nome' || col.key === 'descricao') && value.length > 22) {
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
function toggleSection(sectionId, btnId) {
  const section = document.getElementById(sectionId);
  const btn = document.getElementById(btnId);
  if (section.style.display === 'none') {
    section.style.display = 'block';
    btn.classList.add('active');
    btn.innerHTML = '<i class="fa-solid fa-minus"></i>';
  } else {
    section.style.display = 'none';
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('toggle-usuarios').onclick = () => toggleSection('visualizacao-usuarios', 'toggle-usuarios');
  document.getElementById('toggle-jogos').onclick = () => toggleSection('visualizacao-jogos', 'toggle-jogos');
  document.getElementById('toggle-rankings').onclick = () => toggleSection('visualizacao-rankings', 'toggle-rankings');

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
  renderTable(`${API_URL}/ranking`, 'visualizacao-rankings', [
    { key: 'posicao', label: 'Posição' },
    { key: 'id_usuario', label: 'Usuário' },
    { key: 'id_jogo', label: 'Jogo' },
    { key: 'pontuacao', label: 'Pontuação' },
    { key: 'vitorias', label: 'Vitórias' },
    { key: 'menor_tempo', label: 'Menor Tempo' }
  ], 'Ranking', 'fa-solid fa-ranking-star');
});
