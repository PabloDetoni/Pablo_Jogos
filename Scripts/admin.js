// ======================
// UTILIDADES GERAIS
// ======================
function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
  document.getElementById(`section-${id}`).style.display = 'block';
  document.querySelectorAll('.admin-sidebar ul li').forEach(li => li.classList.remove('active'));
  document.querySelector(`.admin-sidebar ul li[data-section="${id}"]`).classList.add('active');
}

function showModal(id) {
  document.getElementById('modal-bg').style.display = 'block';
  document.getElementById(id).style.display = 'block';
}
function closeModal(id) {
  document.getElementById('modal-bg').style.display = 'none';
  document.getElementById(id).style.display = 'none';
}
function closeAllModals() {
  document.querySelectorAll('.modal-admin').forEach(m => m.style.display = 'none');
  document.getElementById('modal-bg').style.display = 'none';
}

function getUserToken() {
  return JSON.parse(sessionStorage.getItem('user'));
}
const API_URL = "http://localhost:3001";

// ======================
// INICIALIZAÇÃO
// ======================
document.addEventListener('DOMContentLoaded', () => {
  // Checa se usuário é admin
  const user = getUserToken();
  if (!user || !user.isAdmin) {
    alert('Acesso restrito! Apenas administradores.');
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('admin-nome').textContent = user.nome;

  // Navegação sidebar
  document.querySelectorAll('.admin-sidebar ul li').forEach(li => {
    li.addEventListener('click', () => showSection(li.dataset.section));
  });

  // Logout
  document.getElementById('admin-logout').onclick = () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  };

  // Modal: fechar
  document.getElementById('modal-bg').onclick = closeAllModals;
  document.querySelectorAll('.modal-close').forEach(x => x.onclick = closeAllModals);
  document.getElementById('btn-confirmar-cancelar').onclick = closeAllModals;

  // DASHBOARD
  renderDashboard();

  // USUÁRIOS
  renderUsuarios();
  document.getElementById('busca-usuario').oninput = renderUsuarios;

  // JOGOS
  renderJogos();

  // RANKINGS
  rankingsAdminInit();

  // LOGS
  renderLogs();

  // "section-dashboard" default
  showSection('dashboard');
});

// ======================
// DASHBOARD
// ======================
async function renderDashboard() {
  const user = getUserToken();
  const [usuarios, jogos] = await Promise.all([
    fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    }).then(r => r.json()).then(d => d.users || []),
    fetch(`${API_URL}/admin/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    }).then(r => r.json()).then(d => d.jogos || [])
  ]);
  document.getElementById('card-total-usuarios').textContent = usuarios.length;
  document.getElementById('card-total-partidas').textContent = jogos.reduce((a, b) => a + (b.partidas || 0), 0);
  document.getElementById('card-total-admins').textContent = usuarios.filter(u => u.isAdmin).length;
  let ultimos = usuarios
    .slice().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 5)
    .map(u => `<li>${u.nome} <span style="color:#90caf9;">(${u.email})</span></li>`)
    .join('');
  document.getElementById('ultimos-cadastros').innerHTML = ultimos || '<li>Nenhum usuário recente</li>';
  let ultimosLogins = usuarios
    .filter(u => u.ultimoLogin)
    .slice().sort((a, b) => (b.ultimoLogin > a.ultimoLogin ? 1 : -1))
    .slice(0, 5)
    .map(u => `<li>${u.nome} <span style="color:#90caf9;">(${u.ultimoLogin})</span></li>`)
    .join('');
  document.getElementById('ultimos-logins').innerHTML = ultimosLogins || '<li>Nenhum login recente</li>';
}

// ======================
// USUÁRIOS
// ======================
async function renderUsuarios() {
  const user = getUserToken();
  const busca = document.getElementById('busca-usuario').value.trim().toLowerCase();
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  });
  const data = await res.json();
  let usuarios = data.users || [];
  if (busca) {
    usuarios = usuarios.filter(u =>
      u.nome.toLowerCase().includes(busca) || u.email.toLowerCase().includes(busca)
    );
  }
  const tbody = document.getElementById('usuarios-lista');
  tbody.innerHTML = '';
  usuarios.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>${u.isAdmin ? '<span class="badge-admin">Admin</span>' : ''}</td>
      <td>
        ${u.status === 'ativo'
          ? '<span class="badge-active">Ativo</span>'
          : '<span class="badge-blocked">Bloqueado</span>'}
      </td>
      <td>${u.createdAt || '--'}</td>
      <td>
        ${u.status === 'ativo'
          ? `<button class="action-btn" onclick="bloquearUsuario('${u.email}')">Bloquear</button>`
          : `<button class="action-btn" onclick="desbloquearUsuario('${u.email}')">Desbloquear</button>`}
        ${!u.isAdmin ? `<button class="action-btn" onclick="promoverAdmin('${u.email}')">Promover</button>` : ''}
        ${u.isAdmin && u.email !== 'admin@admin.com'
          ? `<button class="action-btn" onclick="despromoverAdmin('${u.email}')">Despromover</button>`
          : ''}
        ${u.email !== 'admin@admin.com'
          ? `<button class="action-btn" onclick="excluirUsuario('${u.email}')">Excluir</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}
window.bloquearUsuario = function(email) {
  abrirConfirmacao('Bloquear usuário?', 'Tem certeza que deseja bloquear este usuário?', async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/users/${email}/block`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderUsuarios(); renderDashboard(); closeAllModals();
  });
}
window.desbloquearUsuario = function(email) {
  abrirConfirmacao('Desbloquear usuário?', 'Tem certeza que deseja desbloquear este usuário?', async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/users/${email}/unblock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderUsuarios(); renderDashboard(); closeAllModals();
  });
}
window.promoverAdmin = function(email) {
  abrirConfirmacao('Promover para Admin?', 'Tem certeza que deseja promover este usuário para administrador?', async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/users/${email}/promote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderUsuarios(); renderDashboard(); closeAllModals();
  });
}
window.despromoverAdmin = function(email) {
  abrirConfirmacao('Remover Admin?', 'Tem certeza que deseja remover privilégios de administrador deste usuário?', async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/users/${email}/demote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderUsuarios(); renderDashboard(); closeAllModals();
  });
}
window.excluirUsuario = function(email) {
  abrirConfirmacao('Excluir Usuário?', 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.', async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/users/${email}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderUsuarios(); renderDashboard(); closeAllModals();
  });
}

// ======================
// JOGOS (apenas os existentes, 8 jogos estáticos)
// ======================
const jogosEstáticos = [
  { nome: "Jogo da Velha" },
  { nome: "PPT" },
  { nome: "Forca" },
  { nome: "2048" },
  { nome: "Memória" },
  { nome: "Sudoku" },
  { nome: "Pong" },
  { nome: "Campo Minado" }
];
async function renderJogos() {
  const user = getUserToken();
  const res = await fetch(`${API_URL}/admin/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  });
  const data = await res.json();
  const jogosBack = data.jogos || [];
  const tbody = document.getElementById('jogos-lista');
  tbody.innerHTML = '';
  jogosEstáticos.forEach(jogoInfo => {
    const jogo = jogosBack.find(j => j.nome === jogoInfo.nome) || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${jogoInfo.nome}</td>
      <td>
        ${
          jogo.bloqueado
            ? '<span class="badge-blocked" title="Jogo em manutenção">Bloqueado</span>'
            : '<span class="badge-active" title="Jogo disponível">Ativo</span>'
        }
      </td>
      <td>${jogo.partidas ?? '--'}</td>
      <td>${jogo.vitorias ?? '--'}</td>
      <td>${jogo.derrotas ?? '--'}</td>
      <td>${jogo.empates ?? '--'}</td>
      <td>
        <button onclick="resetarJogo('${jogoInfo.nome}')">Resetar</button>
        ${
          jogo.bloqueado
            ? `<button onclick="desbloquearJogo('${jogoInfo.nome}')"><i class="fa fa-lock-open"></i> Desbloquear</button>`
            : `<button onclick="bloquearJogo('${jogoInfo.nome}')"><i class="fa fa-lock"></i> Bloquear</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}
window.resetarJogo = function(nome) {
  abrirConfirmacao('Resetar estatísticas?', `Deseja resetar TODAS as estatísticas do jogo "${nome}"?`, async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/games/${encodeURIComponent(nome)}/reset`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderJogos(); renderDashboard(); closeAllModals();
  });
}
window.bloquearJogo = function(nome) {
  abrirConfirmacao('Bloquear jogo?', `Deseja bloquear o jogo "${nome}"? Usuários verão mensagem de manutenção.`, async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/games/${encodeURIComponent(nome)}/block`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderJogos(); renderDashboard(); closeAllModals();
  });
}
window.desbloquearJogo = function(nome) {
  abrirConfirmacao('Desbloquear jogo?', `Deseja liberar o jogo "${nome}" para os usuários?`, async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/games/${encodeURIComponent(nome)}/unblock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderJogos(); renderDashboard(); closeAllModals();
  });
}

// ======================
// RANKINGS DINÂMICO - ADM POWERS
// ======================
function rankingsAdminInit() {
  const rankingsToolbar = document.querySelector('.rankings-toolbar');
  if (!document.getElementById('ranking-tipo-select')) {
    const tipoSel = document.createElement('select');
    tipoSel.id = 'ranking-tipo-select';
    tipoSel.style.marginLeft = '10px';
    rankingsToolbar.appendChild(tipoSel);
    const difSel = document.createElement('select');
    difSel.id = 'ranking-dificuldade-select';
    difSel.style.marginLeft = '10px';
    difSel.style.display = 'none';
    rankingsToolbar.appendChild(difSel);
  }
  carregarJogosRankingAdmin();
  document.getElementById('btn-exportar-csv').onclick = exportarRankingCSVAdmin;
}

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
    chave: "PPT", nome: "PPT",
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
      { chave: "maior_pontuacao", label: "Maior pontuação", colunas: ["Pontuação"] }
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
    dificuldades: ["Fácil", "Médio", "Difícil"],
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
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo"] }
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

function carregarJogosRankingAdmin() {
  const selectJogo = document.getElementById('ranking-jogo-select');
  selectJogo.innerHTML = jogosRanking.map((j, i) => `<option value="${i}">${j.nome}</option>`).join('');
  selectJogo.onchange = atualizarTiposAdmin;
  atualizarTiposAdmin();
}
function atualizarTiposAdmin() {
  const idx = document.getElementById('ranking-jogo-select').value;
  const jogo = jogosRanking[idx];
  const tipoSel = document.getElementById('ranking-tipo-select');
  tipoSel.innerHTML = jogo.tipos.map((t, i) => `<option value="${i}">${t.label}</option>`).join('');
  tipoSel.selectedIndex = 0;
  tipoSel.onchange = atualizarDificuldadesAdmin;
  atualizarDificuldadesAdmin();
}
function atualizarDificuldadesAdmin() {
  const idxJogo = document.getElementById('ranking-jogo-select').value;
  const idxTipo = document.getElementById('ranking-tipo-select').value;
  const jogo = jogosRanking[idxJogo];
  const tipo = jogo.tipos[idxTipo];
  const difSel = document.getElementById('ranking-dificuldade-select');
  if (tipo.porDificuldade && jogo.dificuldades.length > 0) {
    difSel.innerHTML = jogo.dificuldades.map(d => `<option value="${d}">${d}</option>`).join('');
    difSel.style.display = '';
    difSel.onchange = renderRankingAdminTabela;
  } else {
    difSel.style.display = 'none';
  }
  renderRankingAdminTabela();
}
async function renderRankingAdminTabela() {
  const idxJogo = document.getElementById('ranking-jogo-select').value;
  const idxTipo = document.getElementById('ranking-tipo-select').value;
  const jogoObj = jogosRanking[idxJogo];
  const tipoObj = jogoObj.tipos[idxTipo];
  const dificuldade = (tipoObj.porDificuldade && jogoObj.dificuldades.length > 0)
    ? document.getElementById('ranking-dificuldade-select').value
    : null;
  const rankingsContainer = document.querySelector('.tabela-scroll');
  const loading = document.getElementById('rankings-loading');
  loading.style.display = '';
  const params = { jogo: jogoObj.chave, tipo: tipoObj.chave, dificuldade };
  const ranking = await obterRankingAvancado(params);
  rankingsContainer.innerHTML = montarTabelaRankingAdmin(jogoObj.nome, tipoObj, ranking, dificuldade);
  loading.style.display = 'none';
}
function montarTabelaRankingAdmin(nomeJogo, tipoObj, ranking, dificuldade = null) {
  const colunasExtras = tipoObj.colunas || [];
  let html = `
    ${dificuldade ? `<div class="dificuldade-title">${dificuldade}</div>` : ""}
    <table class="rankings-tabela">
      <thead>
        <tr>
          <th>Posição</th>
          <th>Nome</th>
          ${colunasExtras.map(c => `<th>${c}</th>`).join('')}
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${
          ranking.length === 0
          ? `<tr><td colspan="${4 + colunasExtras.length}"><em>Sem registros</em></td></tr>`
          : ranking.map((item, idx) => `
              <tr${item.status === "bloqueado" ? ' class="bloqueado"' : ''}>
                <td>${item.status === "bloqueado" ? "--" : (idx + 1) + "º"}</td>
                <td>${item.nome}</td>
                ${colunasExtras.map(c => {
                  if (c === "Pontuação") return `<td>${item.valor}</td>`;
                  if (c === "Vitórias") return `<td>${item.valor}</td>`;
                  if (c === "Tempo") return `<td>${formatarTempo(item.tempo)}</td>`;
                  if (c === "Sequência") return `<td>${item.valor}</td>`;
                  if (c === "Erros") return `<td class="erros">${item.erros ?? 0}</td>`;
                  return `<td>-</td>`;
                }).join('')}
                <td>
                  ${item.status === "bloqueado"
                    ? '<span class="badge-blocked">Bloqueado</span>'
                    : '<span class="badge-active">Ativo</span>'
                  }
                </td>
                <td>
                  <button class="btn-remover-ranking" title="Remover" onclick="removerLinhaRanking('${nomeJogo.replace(/'/g, "\\'")}', '${tipoObj.chave}', '${dificuldade ?? ""}', '${item.nome.replace(/'/g, "\\'")}')">
                    <i class="fa fa-trash"></i>
                  </button>
                  ${item.status !== "bloqueado"
                    ? `<button class="btn-remover-ranking" title="Bloquear deste Ranking" onclick="bloquearNoRanking('${nomeJogo.replace(/'/g, "\\'")}', '${tipoObj.chave}', '${dificuldade ?? ""}', '${item.nome.replace(/'/g, "\\'")}')">
                        <i class="fa fa-user-slash"></i>
                      </button>`
                    : `<button class="btn-remover-ranking" title="Desbloquear deste Ranking" onclick="desbloquearNoRanking('${nomeJogo.replace(/'/g, "\\'")}', '${tipoObj.chave}', '${dificuldade ?? ""}', '${item.nome.replace(/'/g, "\\'")}')">
                        <i class="fa fa-user-check"></i>
                      </button>`
                  }
                </td>
              </tr>
            `).join('')
        }
      </tbody>
    </table>
  `;
  return html;
}
async function obterRankingAvancado(params) {
  try {
    const res = await fetch(`${API_URL}/rankings/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return data.ranking || [];
  } catch {
    return [];
  }
}
window.removerLinhaRanking = function(jogo, tipo, dificuldade, nome) {
  abrirConfirmacao(
    'Remover Registro?',
    `Deseja remover o registro de "${nome}" do ranking?`,
    async () => {
      await fetch(`${API_URL}/rankings/remove`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          jogo,
          tipo,
          dificuldade: dificuldade || null,
          nome
        })
      });
      renderRankingAdminTabela();
    }
  );
};
window.bloquearNoRanking = function(jogo, tipo, dificuldade, nome) {
  abrirConfirmacao(
    'Bloquear usuário do ranking?',
    `Deseja bloquear "${nome}" deste ranking? Ele não aparecerá mais como ativo neste ranking.`,
    async () => {
      await fetch(`${API_URL}/rankings/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogo,
          tipo,
          dificuldade: dificuldade || null,
          nome
        })
      });
      renderRankingAdminTabela();
    }
  );
};
window.desbloquearNoRanking = function(jogo, tipo, dificuldade, nome) {
  abrirConfirmacao(
    'Desbloquear usuário do ranking?',
    `Deseja desbloquear "${nome}" deste ranking? Ele voltará a aparecer como ativo.`,
    async () => {
      await fetch(`${API_URL}/rankings/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogo,
          tipo,
          dificuldade: dificuldade || null,
          nome
        })
      });
      renderRankingAdminTabela();
    }
  );
};
function formatarTempo(segundos) {
  if (typeof segundos !== "number" || isNaN(segundos)) return "-";
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}
async function exportarRankingCSVAdmin() {
  const idxJogo = document.getElementById('ranking-jogo-select').value;
  const idxTipo = document.getElementById('ranking-tipo-select').value;
  const jogoObj = jogosRanking[idxJogo];
  const tipoObj = jogoObj.tipos[idxTipo];
  const dificuldade = (tipoObj.porDificuldade && jogoObj.dificuldades.length > 0)
    ? document.getElementById('ranking-dificuldade-select').value
    : null;
  const params = { jogo: jogoObj.chave, tipo: tipoObj.chave, dificuldade };
  const ranking = await obterRankingAvancado(params);
  let csv = "Posição,Nome," + (tipoObj.colunas || []).join(",") + ",Status\n";
  ranking.forEach((item, idx) => {
    let row = [item.status === "bloqueado" ? "--" : (idx + 1), `"${item.nome}"`];
    for (const c of (tipoObj.colunas || [])) {
      if (c === "Pontuação" || c === "Vitórias" || c === "Sequência") row.push(item.valor);
      else if (c === "Tempo") row.push(formatarTempo(item.tempo));
      else if (c === "Erros") row.push(item.erros ?? 0);
      else row.push("-");
    }
    row.push(item.status === "bloqueado" ? "Bloqueado" : "Ativo");
    csv += row.join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ranking_${jogoObj.chave}_${tipoObj.chave}` + (dificuldade ? `_${dificuldade}` : "") + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ======================
// LOGS
// ======================
async function renderLogs() {
  const user = getUserToken();
  const res = await fetch(`${API_URL}/admin/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  });
  const data = await res.json();
  const logs = data.logs || [];
  const tbody = document.getElementById('logs-lista');
  tbody.innerHTML = '';
  logs
    .slice().sort((a, b) => (b.data > a.data ? 1 : -1))
    .forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${log.data}</td><td>${log.usuario}</td><td>${log.acao}</td><td>${log.detalhes}</td>`;
      tbody.appendChild(tr);
    });
}

// ======================
// MODAIS DE CONFIRMAÇÃO
// ======================
function abrirConfirmacao(titulo, msg, cb) {
  document.getElementById('confirmar-titulo').textContent = titulo;
  document.getElementById('confirmar-msg').textContent = msg;
  showModal('modal-confirmar');
  document.getElementById('btn-confirmar-ok').onclick = function () {
    cb();
    closeAllModals();
  };
}