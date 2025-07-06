// Novo painel admin.js
// Estrutura principal para painel administrativo moderno
// Requer backend com rotas RESTful compatíveis

window.API_URL = window.API_URL || "http://localhost:3001";

function getUserToken() {
  return JSON.parse(sessionStorage.getItem('user'));
}

// Utilidades de modal
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

// Toast visual para feedback
function showToast(msg, tipo = 'sucesso') {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.style = 'position:fixed;top:24px;right:24px;z-index:9999;padding:16px 28px;border-radius:8px;font-size:1.08em;box-shadow:0 2px 12px #0002;transition:opacity .2s;opacity:0;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = tipo === 'erro' ? '#e53935' : '#43a047';
  toast.style.color = '#fff';
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
  await checkUserBlocked();
  startBlockedUserPolling();
  const user = getUserToken();
  if (!user || !user.isAdmin) {
    alert('Acesso restrito! Apenas administradores.');
    window.location.href = 'index.html';
    return;
  }
  document.getElementById('admin-nome').textContent = user.nome;
  document.getElementById('admin-logout').onclick = () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
  };
  document.getElementById('modal-bg').onclick = closeAllModals;
  document.querySelectorAll('.modal-close').forEach(x => x.onclick = closeAllModals);
  document.getElementById('btn-confirmar-cancelar').onclick = closeAllModals;

  // Navegação
  document.querySelectorAll('.admin-sidebar ul li').forEach(li => {
    li.addEventListener('click', () => showSection(li.dataset.section));
  });
  showSection('dashboard');

  // Renderizações principais
  renderDashboard();
  renderUsuarios();
  renderJogos();
  renderRankings();
  renderLogs();

  // Filtros e busca usuários
  document.getElementById('busca-usuario').oninput = renderUsuarios;
  document.getElementById('filtro-status').onchange = renderUsuarios;
  document.getElementById('filtro-tipo').onchange = renderUsuarios;
  document.getElementById('btn-exportar-usuarios').onclick = exportarUsuariosCSV;
});

function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
  document.getElementById(`section-${id}`).style.display = 'block';
  document.querySelectorAll('.admin-sidebar ul li').forEach(li => li.classList.remove('active'));
  document.querySelector(`.admin-sidebar ul li[data-section="${id}"]`).classList.add('active');
}

// 1. Dashboard
async function renderDashboard() {
  const user = getUserToken();
  const [usuarios, statsRes] = await Promise.all([
    fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    }).then(r => r.json()).then(d => d.users || []),
    fetch(`${API_URL}/admin/game-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    }).then(r => r.json()).then(d => d.stats || [])
  ]);
  document.getElementById('card-total-usuarios').textContent = usuarios.length;
  document.getElementById('card-total-admins').textContent = usuarios.filter(u => u.isAdmin).length;
  document.getElementById('card-total-jogos').textContent = statsRes.length;
  document.getElementById('card-total-partidas').textContent = statsRes.reduce((a, b) => a + (b.totalPartidas || 0), 0);
}

// 2. Usuários


// 3. Jogos
// Função única, não duplicada
// (mantém apenas a versão com os botões e status visual)

// 4. Rankings
async function renderRankings() {
  // Implemente renderização de rankings conforme necessário
  document.getElementById('rankings-lista').innerHTML = '<tr><td colspan="3">Funcionalidade de rankings não implementada</td></tr>';
}

// 5. Logs e Auditoria
async function renderLogs() {
  const user = getUserToken();
  const tbody = document.getElementById('logs-lista');
  tbody.innerHTML = '';
  const res = await fetch(`${API_URL}/admin/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  });
  const data = await res.json();
  const logs = data.logs || [];
  logs.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${log.data}</td><td>${log.usuario}</td><td>${log.acao}</td><td>${log.detalhes}</td>`;
    tbody.appendChild(tr);
  });
}

// ======================
// DASHBOARD
// ======================
async function renderDashboard() {
  const user = getUserToken();
  // Busca usuários e estatísticas dos jogos
  const [usuarios, statsRes] = await Promise.all([
    fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    }).then(r => r.json()).then(d => d.users || []),
    fetch(`${API_URL}/admin/game-stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    }).then(r => r.json()).then(d => d.stats || [])
  ]);
  // Quantidade de jogos: pelo statsRes
  const totalJogos = statsRes.length;
  document.getElementById('card-total-usuarios').textContent = usuarios.length;
  document.getElementById('card-total-partidas').textContent = statsRes.reduce((a, b) => a + (b.totalPartidas || 0), 0);
  document.getElementById('card-total-admins').textContent = usuarios.filter(u => u.isAdmin).length;
  // Adiciona card de jogos se existir no HTML
  if (document.getElementById('card-total-jogos')) {
    document.getElementById('card-total-jogos').textContent = totalJogos;
  }
  // Últimos cadastros
  let ultimos = usuarios
    .slice().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, 5)
    .map(u => `<li>${u.nome} <span style=\"color:#90caf9;\">(${u.email})</span></li>`)
    .join('');
  document.getElementById('ultimos-cadastros').innerHTML = ultimos || '<li>Nenhum usuário recente</li>';
  // Últimos logins
  let ultimosLogins = usuarios
    .filter(u => u.ultimoLogin)
    .slice().sort((a, b) => (b.ultimoLogin > a.ultimoLogin ? 1 : -1))
    .slice(0, 5)
    .map(u => `<li>${u.nome} <span style=\"color:#90caf9;\">(${u.ultimoLogin})</span></li>`)
    .join('');
  document.getElementById('ultimos-logins').innerHTML = ultimosLogins || '<li>Nenhum login recente</li>';

  // Dica dinâmica: se não houver admins além do principal, alerta
  if (usuarios.filter(u => u.isAdmin).length <= 1) {
    const dicas = document.querySelector('#section-dashboard ul');
    if (dicas && !document.getElementById('dica-admin-unico')) {
      const li = document.createElement('li');
      li.id = 'dica-admin-unico';
      li.style.color = '#d32f2f';
      li.innerHTML = '<b>Atenção:</b> Só existe 1 administrador cadastrado. Recomenda-se promover outro usuário para garantir acesso ao painel.';
      dicas.appendChild(li);
    }
  }
}

// ======================
// USUÁRIOS
// ======================
async function renderUsuarios() {
  const user = getUserToken();
  const tbody = document.getElementById('usuarios-lista');
  const erroDiv = document.getElementById('usuarios-erro');
  if (!tbody) return;
  if (erroDiv) erroDiv.style.display = 'none';
  try {
    const busca = document.getElementById('busca-usuario') ? document.getElementById('busca-usuario').value.trim().toLowerCase() : '';
    const filtroStatus = document.getElementById('filtro-status') ? document.getElementById('filtro-status').value : '';
    const filtroTipo = document.getElementById('filtro-tipo') ? document.getElementById('filtro-tipo').value : '';
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    if (!res.ok) throw new Error('Erro ao buscar usuários');
    const data = await res.json();
    let usuariosOriginais = data.users || [];
    let usuarios = usuariosOriginais;
    if (busca) {
      usuarios = usuarios.filter(u =>
        u.nome.toLowerCase().includes(busca) || u.email.toLowerCase().includes(busca)
      );
    }
    if (filtroStatus) {
      usuarios = usuarios.filter(u => u.status === filtroStatus);
    }
    if (filtroTipo) {
      if (filtroTipo === 'admin') usuarios = usuarios.filter(u => u.isAdmin);
      if (filtroTipo === 'comum') usuarios = usuarios.filter(u => !u.isAdmin);
    }
    tbody.innerHTML = '';
    const userLogged = getUserToken();
    usuarios.forEach(u => {
      const tr = document.createElement('tr');
      let btns = '';
      // Não permite editar/excluir o próprio admin logado
      const isSelf = u.email === userLogged.email;
      // Não permite excluir admin principal
      const isAdminPrincipal = u.email === 'admin@admin.com';
      if (!isSelf && !isAdminPrincipal) {
        btns += `<button class="action-btn btn-delete" data-action="excluir" data-email="${u.email}"><i class='fa fa-trash'></i> Excluir</button>`;
      }
      if (!isSelf) {
        // Botão promover/despromover
        if (u.isAdmin) {
          btns += `<button class="action-btn btn-promote" data-action="despromover" data-email="${u.email}"><i class='fa fa-user-minus'></i> Remover Admin</button>`;
        } else {
          btns += `<button class="action-btn btn-promote" data-action="promover" data-email="${u.email}"><i class='fa fa-user-plus'></i> Promover</button>`;
        }
        // Botão bloquear/desbloquear
        if (u.status === 'ativo') {
          btns += `<button class="action-btn btn-block" data-action="bloquear" data-email="${u.email}"><i class='fa fa-ban'></i> Bloquear</button>`;
        } else {
          btns += `<button class="action-btn btn-block" data-action="desbloquear" data-email="${u.email}"><i class='fa fa-check'></i> Ativar</button>`;
        }
      }
      tr.innerHTML = `
        <td><span class="user-detail-link" title="Ver detalhes" onclick="mostrarDetalhesUsuario('${u.email}')">${u.nome}</span></td>
        <td><span class="user-detail-link" title="Ver detalhes" onclick="mostrarDetalhesUsuario('${u.email}')">${u.email}</span></td>
        <td>
          ${u.status === 'ativo'
            ? '<span class="badge-active">Ativo</span>'
            : '<span class="badge-blocked">Bloqueado</span>'}
        </td>
        <td>${u.ultimaAcao || u.ultimoLogin || '--'}</td>
        <td>
          <div class="user-actions-col">
            ${btns}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Delegação de eventos para botões de ação
    document.querySelectorAll('.user-actions-col .action-btn').forEach(btn => {
      btn.onclick = function(e) {
        const email = this.getAttribute('data-email');
        const action = this.getAttribute('data-action');
        if (action === 'bloquear') window.bloquearUsuario(email);
        if (action === 'desbloquear') window.desbloquearUsuario(email);
        if (action === 'promover') window.promoverAdmin(email);
        if (action === 'despromover') window.despromoverAdmin(email);
        if (action === 'excluir') window.excluirUsuario(email);
        if (action === 'editar') {
          // Modal de edição de usuário funcional
          const user = getUserToken();
          if (email === user.email) {
            showToast('Você não pode editar seus próprios dados por segurança.', 'erro');
            return;
          }
          // Captura o email original para garantir update correto
          const emailOriginal = email;
          fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email })
          })
            .then(r => r.json())
            .then(data => {
              const u = (data.users || []).find(u => u.email === emailOriginal);
              if (!u) return;
              let modal = document.getElementById('modal-edit-user');
              if (!modal) {
                modal = document.createElement('div');
                modal.id = 'modal-edit-user';
                modal.className = 'modal-admin';
                modal.style = 'display:block;z-index:1005;min-width:340px;';
                modal.innerHTML = `<div class="modal-content">
                  <span class="modal-close" onclick="document.getElementById('modal-edit-user').remove()">&times;</span>
                  <h3>Editar Usuário</h3>
                  <form id="form-edit-user">
                    <label>Nome:<br><input type="text" id="edit-user-nome" value="${u.nome}" required></label><br><br>
                    <label>Email:<br><input type="email" id="edit-user-email" value="${u.email}" required></label><br><br>
                    <label>Status:<br>
                      <select id="edit-user-status">
                        <option value="ativo" ${u.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="bloqueado" ${u.status === 'bloqueado' ? 'selected' : ''}>Bloqueado</option>
                      </select>
                    </label><br><br>
                    <button type="submit" class="action-btn btn-save"><i class='fa fa-save'></i> Salvar</button>
                  </form>
                </div>`;
                document.body.appendChild(modal);
              } else {
                modal.style.display = 'block';
              }
              const form = modal.querySelector('#form-edit-user');
              form.onsubmit = function(e) {
                e.preventDefault();
                const nome = document.getElementById('edit-user-nome').value.trim();
                const novoEmail = document.getElementById('edit-user-email').value.trim();
                const status = document.getElementById('edit-user-status').value;
                if (!nome || !novoEmail) {
                  showToast('Preencha todos os campos!', 'erro');
                  return;
                }
                fetch(`${API_URL}/admin/users/${encodeURIComponent(emailOriginal)}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nome, name: nome, email: novoEmail, status, adminEmail: user.email })
                })
                .then(res => res.json())
                .then(data => {
                  if (!data.success) {
                    showToast(data.message || 'Erro ao atualizar usuário.', 'erro');
                  } else {
                    showToast('Usuário atualizado!', 'sucesso');
                    renderUsuarios();
                    renderDashboard();
                    document.getElementById('modal-edit-user').remove();
                  }
                })
                .catch(() => {
                  showToast('Erro de conexão ao atualizar usuário.', 'erro');
                });
              };
            });
        }
      };
    });

    // Exibe total filtrado
    let totalInfo = document.getElementById('usuarios-total-info');
    if (!totalInfo) {
      totalInfo = document.createElement('div');
      totalInfo.id = 'usuarios-total-info';
      totalInfo.style = 'margin: 8px 0 0 0; color: #374785; font-size: 1.01em;';
      tbody.parentElement.parentElement.insertBefore(totalInfo, tbody.parentElement.nextSibling);
    }
    totalInfo.textContent = `Exibindo ${usuarios.length} de ${usuariosOriginais.length} usuários`;

    // Atualiza contadores no dashboard se existirem
    if (document.getElementById('card-total-usuarios')) {
      document.getElementById('card-total-usuarios').textContent = usuariosOriginais.length;
    }
    if (document.getElementById('card-total-admins')) {
      document.getElementById('card-total-admins').textContent = usuariosOriginais.filter(u => u.isAdmin).length;
    }
  } catch (err) {
    if (erroDiv) {
      erroDiv.textContent = 'Erro ao carregar usuários: ' + (err.message || err);
      erroDiv.style.display = 'block';
    }
    if (tbody) tbody.innerHTML = '';
  }
}

// Toast visual para feedback de ações
function showToast(msg, tipo = 'sucesso') {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.style = 'position:fixed;top:24px;right:24px;z-index:9999;padding:16px 28px;border-radius:8px;font-size:1.08em;box-shadow:0 2px 12px #0002;transition:opacity .2s;opacity:0;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = tipo === 'erro' ? '#e53935' : '#43a047';
  toast.style.color = '#fff';
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}

// Detalhes rápidos do usuário (mini-modal)
window.mostrarDetalhesUsuario = function(email) {
  const user = JSON.parse(sessionStorage.getItem('user'));
  fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  })
    .then(r => r.json())
    .then(data => {
      const u = (data.users || []).find(u => u.email === email);
      if (!u) return;
      let modal = document.getElementById('modal-user-detail');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-user-detail';
        modal.className = 'modal-admin';
        modal.style = 'display:block;z-index:1004;min-width:320px;';
        modal.innerHTML = `<div class="modal-content">
          <span class="modal-close" onclick="document.getElementById('modal-user-detail').remove()">&times;</span>
          <h3>Detalhes do Usuário</h3>
          <div id="user-detail-content"></div>
        </div>`;
        document.body.appendChild(modal);
      }
      const content = modal.querySelector('#user-detail-content');
      content.innerHTML = `
        <b>Nome:</b> ${u.nome}<br>
        <b>Email:</b> ${u.email}<br>
        <b>Tipo:</b> ${u.isAdmin ? 'Administrador' : 'Comum'}<br>
        <b>Status:</b> ${u.status}<br>
        <b>Data de Cadastro:</b> ${u.createdAt || '--'}<br>
        <b>Última Ação:</b> ${u.ultimaAcao || u.ultimoLogin || '--'}<br>
      `;
      modal.style.display = 'block';
    });
}

// Adiciona feedback visual nas ações administrativas

// Adiciona feedback visual nas ações administrativas (deve ser executado APÓS definir as funções no window)
function wrapAdminActionsWithToast() {
  ['bloquearUsuario','desbloquearUsuario','promoverAdmin','despromoverAdmin','excluirUsuario'].forEach(fn => {
    const original = window[fn];
    window[fn] = function(email) {
      showToast('Processando...', 'sucesso');
      setTimeout(() => {
        original(email);
      }, 200);
    }
  });
}

// Executa o wrap após todas as funções serem definidas
wrapAdminActionsWithToast();

// Exportação de usuários para CSV
async function exportarUsuariosCSV() {
  const user = getUserToken();
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  });
  const data = await res.json();
  let usuarios = data.users || [];
  let csv = 'Nome,Email,Tipo,Status,Data de Cadastro,Última Ação\n';
  usuarios.forEach(u => {
    csv += `"${u.nome}","${u.email}",${u.isAdmin ? 'Admin' : 'Comum'},${u.status},${u.createdAt || '--'},${u.ultimaAcao || u.ultimoLogin || '--'}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'usuarios.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.bloquearUsuario = function(email) {
  abrirConfirmacao('Bloquear usuário?', 'Tem certeza que deseja bloquear este usuário?', async () => {
    const user = getUserToken();
    const res = await fetch(`${API_URL}/admin/users/${email}/block`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Ação não permitida.', 'erro');
    } else {
      renderUsuarios(); renderDashboard(); closeAllModals();
    }
  });
}
window.desbloquearUsuario = function(email) {
  abrirConfirmacao('Desbloquear usuário?', 'Tem certeza que deseja desbloquear este usuário?', async () => {
    const user = getUserToken();
    const res = await fetch(`${API_URL}/admin/users/${email}/unblock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Ação não permitida.', 'erro');
    } else {
      renderUsuarios(); renderDashboard(); closeAllModals();
    }
  });
}
window.promoverAdmin = function(email) {
  abrirConfirmacao('Promover para Admin?', 'Tem certeza que deseja promover este usuário para administrador?', async () => {
    const user = getUserToken();
    const res = await fetch(`${API_URL}/admin/users/${email}/promote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Ação não permitida.', 'erro');
    } else {
      renderUsuarios(); renderDashboard(); closeAllModals();
    }
  });
}
window.despromoverAdmin = function(email) {
  abrirConfirmacao('Remover Admin?', 'Tem certeza que deseja remover privilégios de administrador deste usuário?', async () => {
    const user = getUserToken();
    const res = await fetch(`${API_URL}/admin/users/${email}/demote`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Ação não permitida.', 'erro');
    } else {
      renderUsuarios(); renderDashboard(); closeAllModals();
    }
  });
}
window.excluirUsuario = function(email) {
  abrirConfirmacao('Excluir Usuário?', 'Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.', async () => {
    const user = getUserToken();
    const res = await fetch(`${API_URL}/admin/users/${email}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || 'Ação não permitida.', 'erro');
    } else {
      renderUsuarios(); renderDashboard(); closeAllModals();
    }
  });
}

// ======================
// JOGOS (informações reais e bloqueio)
// ======================
async function renderJogos() {
  const user = getUserToken();
  const res = await fetch(`${API_URL}/admin/game-stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email })
  });
  const data = await res.json();
  const stats = data.stats || [];
  const tbody = document.getElementById('jogos-lista');
  tbody.innerHTML = '';
  stats.forEach(jogo => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${jogo.nome}</td>
      <td>
        ${
          jogo.bloqueado
            ? '<span class="badge-blocked" title="Jogo em manutenção">Bloqueado</span>'
            : '<span class="badge-active" title="Jogo disponível">Ativo</span>'
        }
      </td>
      <td>${jogo.totalPartidas ?? '--'}</td>
      <td>${jogo.mediaVitorias ?? '--'}</td>
      <td>${jogo.mediaDerrotas ?? '--'}</td>
      <td>${jogo.mediaEmpates ?? '--'}</td>
      <td>
        ${
          jogo.bloqueado
            ? `<button onclick="desbloquearJogo('${jogo.nome}')"><i class="fa fa-lock-open"></i> Desbloquear</button>`
            : `<button onclick="bloquearJogo('${jogo.nome}')"><i class="fa fa-lock"></i> Bloquear</button>`
        }
      </td>
    `;
    tbody.appendChild(tr);
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
// LOGS e AUDITORIA
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