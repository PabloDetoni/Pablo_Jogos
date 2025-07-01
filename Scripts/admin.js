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
  // Retorna o usuário logado armazenado em sessionStorage
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
  document.getElementById('btn-add-jogo').onclick = () => {
    document.getElementById('novo-jogo-nome').value = '';
    showModal('modal-add-jogo');
  };
  document.getElementById('form-add-jogo').onsubmit = addJogo;
  document.getElementById('close-add-jogo').onclick = () => closeModal('modal-add-jogo');

  // RANKINGS
  renderRankings();
  document.getElementById('btn-exportar-csv').onclick = exportarRankingCSV;
  document.getElementById('ranking-jogo-select').onchange = renderRankingsTabela;

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
  // Busca usuários e jogos do backend
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
  document.getElementById('card-total-partidas').textContent = jogos.reduce((a, b) => a + b.partidas, 0);
  document.getElementById('card-total-admins').textContent = usuarios.filter(u => u.isAdmin).length;

  // Últimos cadastros
  let ultimos = usuarios
    .slice().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 5)
    .map(u => `<li>${u.nome} <span style="color:#90caf9;">(${u.email})</span></li>`)
    .join('');
  document.getElementById('ultimos-cadastros').innerHTML = ultimos || '<li>Nenhum usuário recente</li>';

  // Últimos logins
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
// JOGOS
// ======================
async function renderJogos() {
  const user = getUserToken();
  const res = await fetch(`${API_URL}/admin/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  });
  const data = await res.json();
  const jogos = data.jogos || [];
  const tbody = document.getElementById('jogos-lista');
  tbody.innerHTML = '';
  jogos.forEach(jogo => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${jogo.nome}</td>
      <td>${jogo.partidas}</td>
      <td>${jogo.vitorias}</td>
      <td>${jogo.derrotas}</td>
      <td>${jogo.empates}</td>
      <td>
        <button onclick="resetarJogo('${jogo.nome}')">Resetar</button>
        <button onclick="removerJogo('${jogo.nome}')">Remover</button>
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
window.removerJogo = function(nome) {
  abrirConfirmacao('Remover Jogo?', `Deseja remover o jogo "${nome}"?`, async () => {
    const user = getUserToken();
    await fetch(`${API_URL}/admin/games/${encodeURIComponent(nome)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    renderJogos(); renderDashboard(); renderRankings(); closeAllModals();
  });
}
async function addJogo(e) {
  e.preventDefault();
  const nome = document.getElementById('novo-jogo-nome').value.trim();
  if (!nome) return;
  const user = getUserToken();
  const res = await fetch(`${API_URL}/admin/games/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, nome })
  });
  const result = await res.json();
  if (!result.success) {
    alert(result.message || 'Erro ao adicionar jogo!');
    return;
  }
  renderJogos(); renderDashboard(); renderRankings();
  closeModal('modal-add-jogo');
}

// ======================
// RANKINGS
// ======================
async function renderRankings() {
  const user = getUserToken();
  const res = await fetch(`${API_URL}/admin/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  });
  const data = await res.json();
  const jogos = data.jogos || [];
  const select = document.getElementById('ranking-jogo-select');
  select.innerHTML = '';
  jogos.forEach(jogo => {
    let option = document.createElement('option');
    option.value = jogo.nome;
    option.textContent = jogo.nome;
    select.appendChild(option);
  });
  renderRankingsTabela();
}
async function renderRankingsTabela() {
  const user = getUserToken();
  const jogo = document.getElementById('ranking-jogo-select').value;
  if (!jogo) return;
  const res = await fetch(`${API_URL}/admin/rankings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, jogo })
  });
  const data = await res.json();
  const rankings = data.ranking || [];
  const tbody = document.getElementById('rankings-lista');
  tbody.innerHTML = '';
  rankings
    .slice().sort((a, b) => b.pontuacao - a.pontuacao)
    .forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx + 1}</td><td>${r.nome}</td><td>${r.pontuacao}</td>`;
      tbody.appendChild(tr);
    });
}
async function exportarRankingCSV() {
  const user = getUserToken();
  const jogo = document.getElementById('ranking-jogo-select').value;
  if (!jogo) return;
  const res = await fetch(`${API_URL}/admin/rankings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, jogo })
  });
  const data = await res.json();
  const rankings = data.ranking || [];
  let csv = 'Posição,Nome,Pontuação\n';
  rankings
    .slice().sort((a, b) => b.pontuacao - a.pontuacao)
    .forEach((r, idx) => {
      csv += `${idx + 1},"${r.nome}",${r.pontuacao}\n`;
    });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ranking-${jogo}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
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