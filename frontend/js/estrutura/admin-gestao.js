// admin-gestao.js - Troca de abas e estrutura para integração CRUD

const API_URL = 'http://localhost:3001';

// Troca de abas
document.querySelectorAll('.gestao-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.gestao-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.gestao-section').forEach(s => s.classList.remove('active'));
    this.classList.add('active');
    document.getElementById(this.dataset.tab).classList.add('active');
  });
});

// ============================================================================
// FUNÇÕES DE UI MELHORADAS
// ============================================================================

// Função para atualizar barra de status do CRUD
function updateStatusBar(barId, icon, message, statusClass = '') {
  const bar = document.getElementById(barId);
  if (!bar) return;
  
  bar.className = 'crud-status-bar';
  if (statusClass) bar.classList.add(statusClass);
  
  bar.innerHTML = `
    <span class="status-icon">${icon}</span>
    <span class="status-text">${message}</span>
  `;
}

// Toggle visibilidade da senha
function toggleSenhaVisibility() {
  const senhaInput = document.getElementById('senha_usuario');
  const btn = document.querySelector('.btn-toggle-password');
  if (senhaInput.type === 'password') {
    senhaInput.type = 'text';
    btn.textContent = '🙈';
  } else {
    senhaInput.type = 'password';
    btn.textContent = '👁️';
  }
}

// Expor funções globalmente
window.toggleSenhaVisibility = toggleSenhaVisibility;

// --- CRUD Usuários ---
const usuarioMessageContainer = document.getElementById('usuarioMessageContainer');
const usuarioForm = document.getElementById('usuarioForm');
const formFieldsUsuario = document.getElementById('formFieldsUsuario');
const idBuscaInput = document.getElementById('searchUsuarioId');
const idUsuarioInput = document.getElementById('id_usuario');
const btnBuscarUsuario = document.getElementById('btnBuscarUsuario');
const btnAlterarUsuario = document.getElementById('btnAlterarUsuario');
const btnExcluirUsuario = document.getElementById('btnExcluirUsuario');
const btnSalvarUsuario = document.getElementById('btnSalvarUsuario');
const btnCancelarUsuario = document.getElementById('btnCancelarUsuario');
const btnVoltarUsuario = document.getElementById('btnVoltarUsuario');
let usuarioEditando = null;
let usuarioAnterior = null;
let acaoUsuario = null; // 'editar', 'excluir', 'novo' ou null

function showUsuarioMessage(msg, type = 'success') {
  usuarioMessageContainer.innerHTML = `<div class="msg ${type}">${msg}</div>`;
  setTimeout(() => usuarioMessageContainer.innerHTML = '', 3000);
}

function preencherUsuarioForm(usuario) {
  idBuscaInput.value = usuario.id || '';
  idUsuarioInput.value = usuario.id || '';
  document.getElementById('nome_usuario').value = usuario.nome || '';
  document.getElementById('status_usuario').value = usuario.status || '';
  document.getElementById('email_usuario').value = usuario.email || '';
  document.getElementById('senha_usuario').value = usuario.senha || '';
  formFieldsUsuario.style.display = '';
  idUsuarioInput.readOnly = true;
}

function validarEmail(email) {
  // Regex simples para e-mail válido
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email) && email.includes('.com');
}

function validarCamposUsuario() {
  const nome = document.getElementById('nome_usuario').value.trim();
  const email = document.getElementById('email_usuario').value.trim();
  const senha = document.getElementById('senha_usuario').value.trim();
  const id = idUsuarioInput.value.trim();
  if (!nome || nome.length > 20) {
    setUsuarioStatus('Nome deve ter até 20 letras.', 'error');
    return false;
  }
  if (!validarEmail(email)) {
    setUsuarioStatus('Digite um e-mail válido (ex: usuario@email.com).', 'error');
    return false;
  }
  if (senha.length < 8 || senha.length > 20) {
    setUsuarioStatus('Senha deve ter entre 8 e 20 caracteres.', 'error');
    return false;
  }
  if (!id || Number(id) < 1) {
    setUsuarioStatus('ID deve ser maior que 0.', 'error');
    return false;
  }
  return true;
}

function setUsuarioFormEditable(editable) {
  document.getElementById('nome_usuario').readOnly = !editable;
  document.getElementById('status_usuario').readOnly = !editable;
  document.getElementById('email_usuario').readOnly = !editable;
  document.getElementById('senha_usuario').readOnly = !editable;
}

// Mensagem fixa de status do CRUD Usuário
let usuarioStatusMsg = null;
function setUsuarioStatus(msg, type = 'info') {
  usuarioStatusMsg = { msg, type };
  usuarioMessageContainer.innerHTML = `<div class="msg ${type}">${msg}</div>`;
  
  // Atualizar também a barra de status visual
  const icons = { info: '💡', success: '✅', error: '❌', warning: '⚠️' };
  const statusClasses = { info: '', success: 'status-success', error: 'status-error', warning: 'status-warning' };
  updateStatusBar('usuarioStatusBar', icons[type] || '💡', msg, statusClasses[type] || '');
}
function clearUsuarioStatus() {
  usuarioStatusMsg = null;
  usuarioMessageContainer.innerHTML = '';
  updateStatusBar('usuarioStatusBar', '💡', 'Digite um ID e clique em Buscar para começar', '');
}

function estadoBusca() {
  idBuscaInput.style.display = '';
  formFieldsUsuario.style.display = 'none';
  btnBuscarUsuario.style.display = '';
  btnAlterarUsuario.style.display = 'none';
  btnExcluirUsuario.style.display = 'none';
  btnSalvarUsuario.style.display = 'none';
  btnCancelarUsuario.style.display = '';
  btnVoltarUsuario.style.display = 'none';
  idBuscaInput.readOnly = false;
  idUsuarioInput.value = '';
  idUsuarioInput.readOnly = true;
  setUsuarioFormEditable(false);
  updateStatusBar('usuarioStatusBar', '🔍', 'Digite um ID maior que 0 e clique em Buscar', '');
}

function estadoNovo() {
  idBuscaInput.style.display = '';
  formFieldsUsuario.style.display = '';
  btnBuscarUsuario.style.display = 'none';
  btnAlterarUsuario.style.display = 'none';
  btnExcluirUsuario.style.display = 'none';
  btnSalvarUsuario.style.display = '';
  btnCancelarUsuario.style.display = '';
  btnVoltarUsuario.style.display = 'none';
  idUsuarioInput.value = idBuscaInput.value;
  idUsuarioInput.readOnly = true;
  setUsuarioFormEditable(true);
  updateStatusBar('usuarioStatusBar', '✨', 'Usuário não encontrado — preencha os dados para criar um novo', 'status-editing');
}

function estadoEncontrado() {
  idBuscaInput.style.display = '';
  formFieldsUsuario.style.display = '';
  btnBuscarUsuario.style.display = 'none';
  btnAlterarUsuario.style.display = '';
  btnExcluirUsuario.style.display = '';
  btnSalvarUsuario.style.display = 'none';
  btnCancelarUsuario.style.display = '';
  btnVoltarUsuario.style.display = 'none';
  idUsuarioInput.readOnly = true;
  setUsuarioFormEditable(false);
  updateStatusBar('usuarioStatusBar', '✅', 'Usuário encontrado! Escolha: Editar ou Excluir', 'status-success');
}

function estadoEditando() {
  idBuscaInput.style.display = '';
  formFieldsUsuario.style.display = '';
  btnBuscarUsuario.style.display = 'none';
  btnAlterarUsuario.style.display = 'none';
  btnExcluirUsuario.style.display = 'none';
  btnSalvarUsuario.style.display = '';
  btnCancelarUsuario.style.display = '';
  btnVoltarUsuario.style.display = '';
  idUsuarioInput.readOnly = true;
  setUsuarioFormEditable(true);
  updateStatusBar('usuarioStatusBar', '✏️', 'Modo edição: altere os campos e clique em Salvar', 'status-editing');
}

// --- INÍCIO DO FLUXO ---
estadoBusca();

btnBuscarUsuario.onclick = async () => {
  const id = idBuscaInput.value;
  if (!id || Number(id) < 1) return setUsuarioStatus('Informe um ID válido para buscar', 'error');
  idBuscaInput.readOnly = true;
  try {
    const res = await fetch(`${API_URL}/usuario/${id}`);
    if (!res.ok) throw new Error('Usuário não encontrado');
    const usuario = await res.json();
    usuarioEditando = usuario;
    preencherUsuarioForm(usuario);
    estadoEncontrado();
    acaoUsuario = null;
  } catch (err) {
    // Salva o valor antes do reset
    const idDigitado = idBuscaInput.value;
    usuarioForm.reset();
    usuarioEditando = null;
    idBuscaInput.value = idDigitado;
    idUsuarioInput.value = idDigitado;
    estadoNovo();
    acaoUsuario = 'novo';
  }
};

btnAlterarUsuario.onclick = () => {
  if (!usuarioEditando) return;
  usuarioAnterior = { ...usuarioEditando };
  acaoUsuario = 'editar';
  estadoEditando();
};

btnExcluirUsuario.onclick = () => {
  if (!usuarioEditando) return;
  if (idUsuarioInput.value === '1') return setUsuarioStatus('Não é permitido excluir o admin!', 'error');
  usuarioAnterior = { ...usuarioEditando };
  acaoUsuario = 'excluir';
  btnSalvarUsuario.style.display = '';
  btnVoltarUsuario.style.display = '';
  btnCancelarUsuario.style.display = '';
  btnAlterarUsuario.style.display = 'none';
  btnExcluirUsuario.style.display = 'none';
  setUsuarioStatus('Excluindo usuário: clique em Salvar para confirmar a exclusão.', 'warning');
  setUsuarioFormEditable(false);
};

btnVoltarUsuario.onclick = () => {
  const idDigitado = idBuscaInput.value;
  if (usuarioAnterior) {
    preencherUsuarioForm(usuarioAnterior);
    usuarioEditando = { ...usuarioAnterior };
    usuarioAnterior = null;
    idBuscaInput.value = idDigitado;
    estadoEncontrado();
    acaoUsuario = null;
  } else {
    usuarioForm.reset();
    idBuscaInput.value = idDigitado;
    estadoBusca();
    acaoUsuario = null;
  }
};

btnSalvarUsuario.onclick = async () => {
  if (acaoUsuario === 'excluir') {
    if (!usuarioEditando) return setUsuarioStatus('Nenhum usuário selecionado', 'error');
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const res = await fetch(`${API_URL}/usuario/${idUsuarioInput.value}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir usuário');
      setUsuarioStatus('Usuário excluído com sucesso!', 'success');
      usuarioEditando = null;
      idBuscaInput.value = idUsuarioInput.value;
      estadoBusca();
      clearUsuarioStatus();
      acaoUsuario = null;
    } catch (err) {
      setUsuarioStatus(err.message, 'error');
    }
    return;
  }
  if (acaoUsuario === 'editar') {
    if (!validarCamposUsuario()) return;
    const id = idUsuarioInput.value;
    const nome = document.getElementById('nome_usuario').value;
    const status = document.getElementById('status_usuario').value || 'user';
    const email = document.getElementById('email_usuario').value;
    const senha = document.getElementById('senha_usuario').value;
    try {
      const res = await fetch(`${API_URL}/usuario/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, status, email, senha }) // status enviado
      });
      if (!res.ok) throw new Error('Erro ao salvar usuário');
      setUsuarioStatus('Usuário alterado com sucesso!', 'success');
      usuarioEditando = null;
      idBuscaInput.value = idUsuarioInput.value;
      estadoBusca();
      clearUsuarioStatus();
      acaoUsuario = null;
    } catch (err) {
      setUsuarioStatus(err.message, 'error');
    }
    return;
  }
  if (acaoUsuario === 'novo') {
    if (!validarCamposUsuario()) return;
    const id = idUsuarioInput.value;
    const nome = document.getElementById('nome_usuario').value;
    // const status = document.getElementById('status_usuario').value; // status sempre será 'usuario'
    const email = document.getElementById('email_usuario').value;
    const senha = document.getElementById('senha_usuario').value;
    try {
      const res = await fetch(`${API_URL}/usuario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nome, status: 'user', email, senha }) // status fixo para 'user'
      });
      if (!res.ok) throw new Error('Erro ao incluir usuário');
      setUsuarioStatus('Usuário incluído com sucesso!', 'success');
      usuarioEditando = null;
      idBuscaInput.value = idUsuarioInput.value;
      estadoBusca();
      clearUsuarioStatus();
      acaoUsuario = null;
    } catch (err) {
      setUsuarioStatus(err.message, 'error');
    }
    return;
  }
  setUsuarioStatus('Escolha uma ação: Alterar ou Excluir.', 'info');
};

btnCancelarUsuario.onclick = () => {
  const idDigitado = idBuscaInput.value;
  usuarioEditando = null;
  usuarioForm.reset();
  idBuscaInput.value = idDigitado;
  estadoBusca();
  clearUsuarioStatus();
  acaoUsuario = null;
};

// Ajustes de restrição e validação dos campos do CRUD Usuário
idUsuarioInput.setAttribute('type', 'number');
idUsuarioInput.setAttribute('min', '1');
idUsuarioInput.addEventListener('input', function() {
  if (this.value < 1) this.value = 1;
});

document.getElementById('nome_usuario').setAttribute('maxlength', '20');
document.getElementById('nome_usuario').addEventListener('input', function() {
  if (this.value.length > 20) this.value = this.value.slice(0, 20);
});

document.getElementById('senha_usuario').setAttribute('maxlength', '20');
document.getElementById('senha_usuario').addEventListener('input', function() {
  if (this.value.length > 20) this.value = this.value.slice(0, 20);
});

// Esconde o campo status_usuario
const statusUsuarioInput = document.getElementById('status_usuario');
if (statusUsuarioInput) statusUsuarioInput.parentElement.style.display = 'none';

function validarEmail(email) {
  // Regex simples para e-mail válido
  return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email) && email.includes('.com');
}

function validarCamposUsuario() {
  const nome = document.getElementById('nome_usuario').value.trim();
  const email = document.getElementById('email_usuario').value.trim();
  const senha = document.getElementById('senha_usuario').value.trim();
  const id = idUsuarioInput.value.trim();
  if (!nome || nome.length > 20) {
    setUsuarioStatus('Nome deve ter até 20 letras.', 'error');
    return false;
  }
  if (!validarEmail(email)) {
    setUsuarioStatus('Digite um e-mail válido (ex: usuario@email.com).', 'error');
    return false;
  }
  if (senha.length < 8 || senha.length > 20) {
    setUsuarioStatus('Senha deve ter entre 8 e 20 caracteres.', 'error');
    return false;
  }
  if (!id || Number(id) < 1) {
    setUsuarioStatus('ID deve ser maior que 0.', 'error');
    return false;
  }
  return true;
}

// --- CRUD Jogos ---
const jogoMessageContainer = document.getElementById('jogoMessageContainer');
const jogoForm = document.getElementById('jogoForm');
const formFieldsJogo = document.getElementById('formFieldsJogo');
const searchJogoIdInput = document.getElementById('searchJogoId');
const btnBuscarJogo = document.getElementById('btnBuscarJogo');
const btnIncluirJogo = document.getElementById('btnIncluirJogo');
const btnAlterarJogo = document.getElementById('btnAlterarJogo');
const btnExcluirJogo = document.getElementById('btnExcluirJogo');
const btnSalvarJogo = document.getElementById('btnSalvarJogo');
const btnCancelarJogo = document.getElementById('btnCancelarJogo');
const btnVoltarJogo = document.getElementById('btnVoltarJogo');
let jogoEditando = null;
let acaoJogo = null;

function showJogoMessage(msg, type = 'success') {
  jogoMessageContainer.innerHTML = `<div class="msg ${type}">${msg}</div>`;
  setTimeout(() => jogoMessageContainer.innerHTML = '', 4000);
  
  // Atualizar também a barra de status visual
  const icons = { info: '💡', success: '✅', error: '❌', warning: '⚠️' };
  const statusClasses = { info: '', success: 'status-success', error: 'status-error', warning: 'status-warning' };
  updateStatusBar('jogoStatusBar', icons[type] || '💡', msg, statusClasses[type] || '');
}
function limparJogoForm() {
  jogoForm.reset();
  // Não limpar o campo de busca de ID
  // jogoEditando = null;
  acaoJogo = null;
  btnAlterarJogo.style.display = 'none';
  btnExcluirJogo.style.display = 'none';
  btnSalvarJogo.style.display = 'none';
  btnIncluirJogo.style.display = '';
}
function preencherJogoForm(jogo) {
  document.getElementById('id_jogo').value = jogo.id || searchJogoIdInput.value || '';
  document.getElementById('titulo_jogo').value = jogo.titulo || '';
  document.getElementById('genero_jogo').value = jogo.genero || '';
  document.getElementById('descricao_jogo').value = jogo.descricao || '';
}
// ESTADOS DO CRUD JOGO
function safeDisplay(element, value) {
  if (element) element.style.display = value;
}
function estadoBuscaJogo() {
  safeDisplay(searchJogoIdInput, '');
  safeDisplay(formFieldsJogo, 'none');
  safeDisplay(btnBuscarJogo, '');
  safeDisplay(btnAlterarJogo, 'none');
  safeDisplay(btnExcluirJogo, 'none');
  safeDisplay(btnSalvarJogo, 'none');
  safeDisplay(btnCancelarJogo, '');
  safeDisplay(btnIncluirJogo, 'none');
  safeDisplay(btnVoltarJogo, 'none');
  if (searchJogoIdInput) {
    searchJogoIdInput.readOnly = false;
  }
  updateStatusBar('jogoStatusBar', '🔍', 'Digite um ID e clique em Buscar para começar', '');
}
function estadoNovoJogo() {
  safeDisplay(searchJogoIdInput, '');
  safeDisplay(formFieldsJogo, '');
  safeDisplay(btnBuscarJogo, 'none');
  safeDisplay(btnAlterarJogo, 'none');
  safeDisplay(btnExcluirJogo, 'none');
  safeDisplay(btnSalvarJogo, '');
  safeDisplay(btnCancelarJogo, '');
  safeDisplay(btnIncluirJogo, 'none');
  safeDisplay(btnVoltarJogo, 'none');
  if (searchJogoIdInput) {
    searchJogoIdInput.readOnly = false;
    searchJogoIdInput.style.display = '';
  }
  const idBusca = searchJogoIdInput.value;
  const idJogoInput = document.getElementById('id_jogo');
  if (idJogoInput) idJogoInput.value = idBusca;
  updateStatusBar('jogoStatusBar', '✨', 'Jogo não encontrado — preencha os dados para criar um novo', 'status-editing');
}
function estadoEncontradoJogo() {
  safeDisplay(searchJogoIdInput, '');
  safeDisplay(formFieldsJogo, '');
  safeDisplay(btnBuscarJogo, 'none');
  safeDisplay(btnAlterarJogo, '');
  safeDisplay(btnExcluirJogo, '');
  safeDisplay(btnSalvarJogo, 'none');
  safeDisplay(btnCancelarJogo, '');
  safeDisplay(btnIncluirJogo, 'none');
  safeDisplay(btnVoltarJogo, 'none');
  if (searchJogoIdInput) searchJogoIdInput.readOnly = true;
  updateStatusBar('jogoStatusBar', '✅', 'Jogo encontrado! Escolha: Editar ou Excluir', 'status-success');
}
function estadoEditandoJogo() {
  safeDisplay(searchJogoIdInput, '');
  safeDisplay(formFieldsJogo, '');
  safeDisplay(btnBuscarJogo, 'none');
  safeDisplay(btnAlterarJogo, 'none');
  safeDisplay(btnExcluirJogo, 'none');
  safeDisplay(btnSalvarJogo, '');
  safeDisplay(btnCancelarJogo, '');
  safeDisplay(btnIncluirJogo, 'none');
  safeDisplay(btnVoltarJogo, '');
  if (searchJogoIdInput) searchJogoIdInput.readOnly = true;
  updateStatusBar('jogoStatusBar', '✏️', 'Modo edição: altere os campos e clique em Salvar', 'status-editing');
}
function estadoExcluindoJogo() {
  safeDisplay(searchJogoIdInput, '');
  safeDisplay(formFieldsJogo, '');
  safeDisplay(btnBuscarJogo, 'none');
  safeDisplay(btnAlterarJogo, 'none');
  safeDisplay(btnExcluirJogo, 'none');
  safeDisplay(btnSalvarJogo, '');
  safeDisplay(btnCancelarJogo, '');
  safeDisplay(btnIncluirJogo, 'none');
  safeDisplay(btnVoltarJogo, '');
  if (searchJogoIdInput) searchJogoIdInput.readOnly = true;
  updateStatusBar('jogoStatusBar', '⚠️', 'Confirmar exclusão: clique em Salvar para excluir ou Cancelar para desistir', 'status-warning');
}
if (btnVoltarJogo) {
  btnVoltarJogo.onclick = () => {
    if (jogoEditando) {
      preencherJogoForm(jogoEditando);
      estadoEncontradoJogo();
      acaoJogo = null;
    } else {
      jogoForm.reset();
      estadoBuscaJogo();
      acaoJogo = null;
    }
  };
}

// INICIO DO FLUXO CRUD JOGO
estadoBuscaJogo();

btnBuscarJogo.onclick = async () => {
  const id = searchJogoIdInput.value;
  if (!id) return showJogoMessage('Informe o ID para buscar', 'error');
  searchJogoIdInput.readOnly = true;
  try {
    const res = await fetch(`${API_URL}/jogo/${id}`);
    if (!res.ok) throw new Error('Jogo não encontrado');
    const jogo = await res.json();
    jogoEditando = jogo;
    preencherJogoForm(jogo);
    estadoEncontradoJogo();
    acaoJogo = null;
  } catch (err) {
    // Não limpar o campo de busca, apenas preparar para novo jogo
    jogoEditando = null;
    jogoForm.reset();
    // Mantém o valor digitado no campo de busca
    searchJogoIdInput.value = id;
    // Preenche o campo id_jogo com o valor buscado
    const idJogoInput = document.getElementById('id_jogo');
    if (idJogoInput) idJogoInput.value = id;
    estadoNovoJogo();
    acaoJogo = 'novo';
  }
};
btnIncluirJogo.onclick = () => {
  jogoEditando = null;
  jogoForm.reset();
  // Sempre atribui o valor do campo de busca ao campo id_jogo
  const idBusca = searchJogoIdInput.value;
  const idJogoInput = document.getElementById('id_jogo');
  if (idJogoInput) idJogoInput.value = idBusca;
  btnSalvarJogo.style.display = '';
  btnIncluirJogo.style.display = 'none';
  btnAlterarJogo.style.display = 'none';
  btnExcluirJogo.style.display = 'none';
  acaoJogo = 'novo';
  estadoNovoJogo();
};
btnAlterarJogo.onclick = () => {
  if (!jogoEditando) return;
  acaoJogo = 'editar';
  estadoEditandoJogo();
};
btnExcluirJogo.onclick = () => {
  if (!jogoEditando) return;
  acaoJogo = 'excluir';
  estadoExcluindoJogo();
};
btnSalvarJogo.onclick = async () => {
  const idInput = document.getElementById('id_jogo');
  const id = idInput.value.trim();
  const titulo = document.getElementById('titulo_jogo').value.trim();
  const genero = document.getElementById('genero_jogo').value.trim();
  const descricao = document.getElementById('descricao_jogo').value.trim();
  // Validação do campo id
  if (!id || isNaN(id) || Number(id) < 1) {
    idInput.value = searchJogoIdInput.value;
    return showJogoMessage('Informe um ID válido (número maior que 0)', 'error');
  }
  if (!titulo) return showJogoMessage('Preencha o título', 'error');
  if (acaoJogo === 'excluir') {
    if (!jogoEditando) return showJogoMessage('Nenhum jogo selecionado', 'error');
    if (!confirm('Tem certeza que deseja excluir este jogo?')) return;
    try {
      const res = await fetch(`${API_URL}/jogo/${jogoEditando.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (data.error && data.error.includes('padrão')) {
        return showJogoMessage('Esse é um jogo padrão do sistema e não pode ser excluído.', 'error');
      }
      if (data.error && data.error.includes('Falha ao remover arquivos')) {
        return showJogoMessage('Falha ao remover arquivos do jogo!', 'error');
      }
      if (!res.ok) return showJogoMessage('Erro ao excluir jogo', 'error');
      showJogoMessage('Jogo excluído com sucesso!', 'success');
      limparJogoForm();
      estadoBuscaJogo();
      acaoJogo = null;
    } catch (err) {
      showJogoMessage('Erro ao excluir jogo', 'error');
    }
    return;
  }
  if (acaoJogo === 'editar') {
    if (!jogoEditando) return showJogoMessage('Nenhum jogo selecionado', 'error');
    try {
      const res = await fetch(`${API_URL}/jogo/${jogoEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, genero, descricao })
      });
      const data = await res.json();
      if (!res.ok) {
        return showJogoMessage('Erro ao atualizar jogo', 'error');
      }
      showJogoMessage('Jogo alterado com sucesso!', 'success');
      limparJogoForm();
      estadoBuscaJogo();
      acaoJogo = null;
    } catch (err) {
      showJogoMessage('Erro ao atualizar jogo', 'error');
    }
    return;
  }
  if (acaoJogo === 'novo') {
    // Garante que o campo id_jogo sempre recebe o valor do campo de busca
    document.getElementById('id_jogo').value = searchJogoIdInput.value;
    try {
      const res = await fetch(`${API_URL}/jogo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, titulo, genero, descricao })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes('Slug duplicado')) {
          return showJogoMessage('Já existe um jogo com esse nome!', 'error');
        }
        if (data.error && data.error.includes('Falha ao criar arquivos')) {
          return showJogoMessage('Falha ao criar arquivos do jogo!', 'error');
        }
        return showJogoMessage('Erro ao incluir jogo', 'error');
      }
      showJogoMessage('Jogo incluído com sucesso!', 'success');
      limparJogoForm();
      estadoBuscaJogo();
      acaoJogo = null;
      if (res.ok) {
        searchJogoIdInput.value = id;
        document.getElementById('id_jogo').value = id;
      }
    } catch (err) {
      showJogoMessage('Erro ao incluir jogo', 'error');
    }
    return;
  }
  showJogoMessage('Escolha uma ação: Alterar ou Excluir.', 'info');
};
btnCancelarJogo.onclick = () => {
  limparJogoForm();
  estadoBuscaJogo();
  acaoJogo = null;
};
// --- CRUD Estatísticas ---
const estatisticaMessageContainer = document.getElementById('estatisticaMessageContainer');
const estatisticaForm = document.getElementById('estatisticaForm');
const formFieldsEstatistica = document.getElementById('formFieldsEstatistica');
const btnBuscarEstatistica = document.getElementById('btnBuscarEstatistica');
const btnIncluirEstatistica = document.getElementById('btnIncluirEstatistica');
const btnAlterarEstatistica = document.getElementById('btnAlterarEstatistica');
const btnExcluirEstatistica = document.getElementById('btnExcluirEstatistica');
const btnSalvarEstatistica = document.getElementById('btnSalvarEstatistica');
const btnCancelarEstatistica = document.getElementById('btnCancelarEstatistica');
let estatisticaEditando = null;
function showEstatisticaMessage(msg, type = 'success') {
  estatisticaMessageContainer.innerHTML = `<div class="msg ${type}">${msg}</div>`;
  setTimeout(() => estatisticaMessageContainer.innerHTML = '', 3000);
}
function limparEstatisticaForm() {
  estatisticaForm.reset();
  estatisticaEditando = null;
  formFieldsEstatistica.style.display = 'none';
  btnAlterarEstatistica.style.display = 'none';
  btnExcluirEstatistica.style.display = 'none';
  btnSalvarEstatistica.style.display = 'none';
  btnIncluirEstatistica.style.display = '';
}
function preencherEstatisticaForm(est) {
  document.getElementById('id_usuario_estatistica').value = est.id_usuario || '';
  document.getElementById('id_jogo_estatistica').value = est.id_jogo || '';
  document.getElementById('id_dificuldade_estatistica').value = est.id_dificuldade || '';
  document.getElementById('vitorias_estatistica').value = est.vitorias || '';
  document.getElementById('vitorias_consecutivas_estatistica').value = est.vitorias_consecutivas || '';
  document.getElementById('pontuacao_estatistica').value = est.pontuacao || '';
  document.getElementById('menor_tempo_estatistica').value = est.menor_tempo || '';
  document.getElementById('erros_estatistica').value = est.erros || '';
  formFieldsEstatistica.style.display = '';
}
// Proteção para event listeners em elementos que podem não existir
if (btnBuscarEstatistica) {
  btnBuscarEstatistica.onclick = async () => {
    const id = document.getElementById('searchEstatisticaId').value;
    if (!id) return showEstatisticaMessage('Informe o ID para buscar', 'error');
    try {
      const res = await fetch(`${API_URL}/estatistica/${id}`);
      if (!res.ok) throw new Error('Estatística não encontrada');
      const est = await res.json();
      estatisticaEditando = est;
      preencherEstatisticaForm(est);
      btnAlterarEstatistica.style.display = '';
      btnExcluirEstatistica.style.display = '';
      btnSalvarEstatistica.style.display = 'none';
      btnIncluirEstatistica.style.display = 'none';
    } catch (err) {
      showEstatisticaMessage('Estatística não encontrada', 'error');
    }
  };
}
if (btnIncluirEstatistica) {
  btnIncluirEstatistica.onclick = () => {
    estatisticaEditando = null;
    estatisticaForm.reset();
    formFieldsEstatistica.style.display = '';
    btnSalvarEstatistica.style.display = '';
    btnIncluirEstatistica.style.display = 'none';
    btnAlterarEstatistica.style.display = 'none';
    btnExcluirEstatistica.style.display = 'none';
  };
}
if (btnSalvarEstatistica) {
  btnSalvarEstatistica.onclick = async () => {
    const id_usuario = document.getElementById('id_usuario_estatistica').value;
    const id_jogo = document.getElementById('id_jogo_estatistica').value;
    const id_dificuldade = document.getElementById('id_dificuldade_estatistica').value;
    const vitorias = document.getElementById('vitorias_estatistica').value;
    const vitorias_consecutivas = document.getElementById('vitorias_consecutivas_estatistica').value;
    const pontuacao = document.getElementById('pontuacao_estatistica').value;
    const menor_tempo = document.getElementById('menor_tempo_estatistica').value;
    const erros = document.getElementById('erros_estatistica').value;
    if (!id_usuario || !id_jogo) return showEstatisticaMessage('Preencha os campos obrigatórios', 'error');
    try {
      const res = await fetch(`${API_URL}/estatistica`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros })
      });
      if (!res.ok) throw new Error('Erro ao incluir estatística');
      showEstatisticaMessage('Estatística incluída com sucesso!');
      limparEstatisticaForm();
    } catch (err) {
      showEstatisticaMessage('Erro ao incluir estatística', 'error');
    }
  };
}
if (btnAlterarEstatistica) {
  btnAlterarEstatistica.onclick = async () => {
    if (!estatisticaEditando) return showEstatisticaMessage('Nenhum estatística selecionada', 'error');
    const id_usuario = document.getElementById('id_usuario_estatistica').value;
    const id_jogo = document.getElementById('id_jogo_estatistica').value;
    const id_dificuldade = document.getElementById('id_dificuldade_estatistica').value;
    const vitorias = document.getElementById('vitorias_estatistica').value;
    const vitorias_consecutivas = document.getElementById('vitorias_consecutivas_estatistica').value;
    const pontuacao = document.getElementById('pontuacao_estatistica').value;
    const menor_tempo = document.getElementById('menor_tempo_estatistica').value;
    const erros = document.getElementById('erros_estatistica').value;
    try {
      const res = await fetch(`${API_URL}/estatistica/${estatisticaEditando.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros })
      });
      if (!res.ok) throw new Error('Erro ao atualizar estatística');
      showEstatisticaMessage('Estatística atualizada com sucesso!');
      limparEstatisticaForm();
    } catch (err) {
      showEstatisticaMessage('Erro ao atualizar estatística', 'error');
    }
  };
}
if (btnExcluirEstatistica) {
  btnExcluirEstatistica.onclick = async () => {
    if (!estatisticaEditando) return;
    if (!confirm('Tem certeza que deseja excluir esta estatística?')) return;
    try {
      const res = await fetch(`${API_URL}/estatistica/${estatisticaEditando.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir estatística');
      showEstatisticaMessage('Estatística excluída com sucesso!');
      limparEstatisticaForm();
    } catch (err) {
      showEstatisticaMessage('Erro ao excluir estatística', 'error');
    }
  };
}
if (btnCancelarEstatistica) {
  btnCancelarEstatistica.onclick = () => {
    limparEstatisticaForm();
  };
}
// --- CRUD Admins (Nova Interface) ---
const adminMessageContainer = document.getElementById('adminMessageContainer');
const adminListContainer = document.getElementById('adminListContainer');
const modalEditarAdmin = document.getElementById('modal-editar-admin');
const modalEditarAdminContent = document.getElementById('modalEditarAdminContent');

let adminEditando = null;

function showAdminMessage(msg, type = 'success') {
  if (adminMessageContainer) {
    adminMessageContainer.innerHTML = `<div class="msg ${type}">${msg}</div>`;
    setTimeout(() => adminMessageContainer.innerHTML = '', 4000);
  }
}

// Carregar lista de admins
async function carregarListaAdmins() {
  if (!adminListContainer) return;
  
  adminListContainer.innerHTML = '<p class="loading-text">Carregando lista de admins...</p>';
  
  try {
    const res = await fetch(`${API_URL}/admin`);
    if (!res.ok) throw new Error('Erro ao carregar admins');
    const admins = await res.json();
    
    if (!admins || admins.length === 0) {
      adminListContainer.innerHTML = '<p class="nenhum-resultado">Nenhum administrador cadastrado.</p>';
      return;
    }
    
    adminListContainer.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Nível</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${admins.map(admin => {
            const nivelClass = admin.nivel_permissao >= 8 ? 'nivel-alto' : 
                              admin.nivel_permissao >= 4 ? 'nivel-medio' : 'nivel-baixo';
            const nivelIcon = admin.nivel_permissao >= 8 ? '👑' : 
                             admin.nivel_permissao >= 4 ? '⭐' : '🔹';
            const isPrincipal = admin.id_usuario === 1;
            
            return `
              <tr data-id="${admin.id_usuario}">
                <td>${admin.id_usuario}</td>
                <td><strong>${admin.usuario_nome || 'N/A'}</strong></td>
                <td>${admin.usuario_email || 'N/A'}</td>
                <td>
                  <span class="nivel-badge ${nivelClass}">
                    ${nivelIcon} Nível ${admin.nivel_permissao}
                  </span>
                </td>
                <td>
                  <div class="admin-actions">
                    <button class="btn-edit-admin" onclick="abrirModalEditarAdmin(${admin.id_usuario})" title="Editar permissão">
                      ✏️ Editar
                    </button>
                    <button class="btn-demote-admin" onclick="rebaixarAdmin(${admin.id_usuario}, '${admin.usuario_nome}')" 
                            title="${isPrincipal ? 'Admin principal não pode ser rebaixado' : 'Rebaixar admin'}"
                            ${isPrincipal ? 'disabled' : ''}>
                      👤 Rebaixar
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Erro ao carregar admins:', err);
    adminListContainer.innerHTML = '<p class="nenhum-resultado" style="color:#ef4444;">Erro ao carregar lista de administradores.</p>';
  }
}

// Abrir modal para editar admin
async function abrirModalEditarAdmin(idUsuario) {
  try {
    const res = await fetch(`${API_URL}/admin/${idUsuario}`);
    if (!res.ok) throw new Error('Admin não encontrado');
    const admin = await res.json();
    
    adminEditando = admin;
    
    modalEditarAdminContent.innerHTML = `
      <h3>✏️ Editar Permissão do Admin</h3>
      <div class="user-preview">
        <div class="user-avatar">${(admin.usuario_nome || 'A').charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <strong>${admin.usuario_nome || 'N/A'}</strong>
          <span>ID: ${admin.id_usuario} • ${admin.usuario_email || ''}</span>
        </div>
      </div>
      <form id="formEditarAdmin" class="form-trofeu" style="margin-top: 16px;">
        <div class="form-group">
          <label for="editNivelAdmin">Nível de Permissão:</label>
          <select id="editNivelAdmin">
            <option value="1" ${admin.nivel_permissao === 1 ? 'selected' : ''}>1 - Básico</option>
            <option value="2" ${admin.nivel_permissao === 2 ? 'selected' : ''}>2 - Intermediário</option>
            <option value="3" ${admin.nivel_permissao === 3 ? 'selected' : ''}>3 - Avançado</option>
            <option value="5" ${admin.nivel_permissao === 5 ? 'selected' : ''}>5 - Moderador</option>
            <option value="8" ${admin.nivel_permissao === 8 ? 'selected' : ''}>8 - Admin Sênior</option>
            <option value="10" ${admin.nivel_permissao === 10 ? 'selected' : ''}>10 - Super Admin</option>
          </select>
        </div>
      </form>
      <div id="editAdminMsg"></div>
      <div class="modal-actions">
        <button class="btn-save" onclick="salvarEdicaoAdmin()">💾 Salvar</button>
        <button class="btn-cancel" onclick="closeModalEditarAdmin()">Cancelar</button>
      </div>
    `;
    
    modalEditarAdmin.style.display = 'flex';
  } catch (err) {
    showAdminMessage('Erro ao carregar dados do admin', 'error');
  }
}

function closeModalEditarAdmin() {
  modalEditarAdmin.style.display = 'none';
  adminEditando = null;
}

// Salvar edição de admin
async function salvarEdicaoAdmin() {
  if (!adminEditando) return;
  
  const nivel = document.getElementById('editNivelAdmin')?.value;
  const msgDiv = document.getElementById('editAdminMsg');
  
  if (!nivel || Number(nivel) < 1 || Number(nivel) > 10) {
    if (msgDiv) msgDiv.innerHTML = '<div class="msg error">Nível inválido</div>';
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/admin/${adminEditando.id_usuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nivel_permissao: Number(nivel) })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro ao atualizar');
    }
    
    showAdminMessage('Permissão atualizada com sucesso!', 'success');
    closeModalEditarAdmin();
    await carregarListaAdmins();
  } catch (err) {
    if (msgDiv) msgDiv.innerHTML = `<div class="msg error">${err.message}</div>`;
  }
}

// Rebaixar admin
async function rebaixarAdmin(idUsuario, nome) {
  if (idUsuario === 1) {
    showAdminMessage('Não é permitido rebaixar o admin principal', 'error');
    return;
  }
  
  if (!confirm(`Tem certeza que deseja REBAIXAR "${nome}" de admin?\n\nO usuário permanecerá no sistema, apenas perderá os privilégios de administrador.`)) {
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/admin/${idUsuario}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro ao rebaixar');
    }
    
    showAdminMessage('Admin rebaixado com sucesso! O usuário permanece no sistema.', 'success');
    await carregarListaAdmins();
  } catch (err) {
    showAdminMessage(err.message || 'Erro ao rebaixar admin', 'error');
  }
}

// Preview do usuário ao digitar ID para promoção
const promoteUserIdInput = document.getElementById('promoteUserId');
const promoteUserPreview = document.getElementById('promoteUserPreview');
let promoteTimeout = null;

if (promoteUserIdInput) {
  promoteUserIdInput.addEventListener('input', () => {
    clearTimeout(promoteTimeout);
    const id = promoteUserIdInput.value;
    
    if (!id || Number(id) < 1) {
      if (promoteUserPreview) promoteUserPreview.style.display = 'none';
      return;
    }
    
    promoteTimeout = setTimeout(async () => {
      try {
        // Verifica se usuário existe
        const userRes = await fetch(`${API_URL}/usuario/${id}`);
        if (!userRes.ok) {
          if (promoteUserPreview) {
            promoteUserPreview.style.display = 'block';
            promoteUserPreview.innerHTML = '<span style="color:#ef4444;">❌ Usuário não encontrado</span>';
          }
          return;
        }
        const usuario = await userRes.json();
        
        // Verifica se já é admin
        const adminRes = await fetch(`${API_URL}/admin/${id}`);
        const adminData = await adminRes.json();
        const jaEAdmin = adminRes.ok && adminData.isAdmin;
        
        if (promoteUserPreview) {
          promoteUserPreview.style.display = 'block';
          if (jaEAdmin) {
            promoteUserPreview.innerHTML = `
              <div class="user-avatar">${(usuario.nome || 'U').charAt(0).toUpperCase()}</div>
              <div class="user-info">
                <strong>${usuario.nome}</strong>
                <span style="color:#f59e0b;">⚠️ Este usuário já é admin (Nível ${adminData.nivel_permissao})</span>
              </div>
            `;
          } else {
            promoteUserPreview.innerHTML = `
              <div class="user-avatar">${(usuario.nome || 'U').charAt(0).toUpperCase()}</div>
              <div class="user-info">
                <strong>${usuario.nome}</strong>
                <span>✅ Usuário comum - pode ser promovido</span>
              </div>
            `;
          }
        }
      } catch (err) {
        if (promoteUserPreview) {
          promoteUserPreview.style.display = 'block';
          promoteUserPreview.innerHTML = '<span style="color:#ef4444;">❌ Erro ao buscar usuário</span>';
        }
      }
    }, 500);
  });
}

// Promover novo admin
const btnPromoverNovoAdmin = document.getElementById('btnPromoverNovoAdmin');
if (btnPromoverNovoAdmin) {
  btnPromoverNovoAdmin.addEventListener('click', async () => {
    const idUsuario = document.getElementById('promoteUserId')?.value;
    const nivel = document.getElementById('promoteNivel')?.value || 1;
    
    if (!idUsuario || Number(idUsuario) < 1) {
      showAdminMessage('Digite um ID de usuário válido', 'error');
      return;
    }
    
    try {
      // Verifica se usuário existe
      const userRes = await fetch(`${API_URL}/usuario/${idUsuario}`);
      if (!userRes.ok) {
        showAdminMessage('Usuário não encontrado', 'error');
        return;
      }
      const usuario = await userRes.json();
      
      // Verifica se já é admin
      const adminRes = await fetch(`${API_URL}/admin/${idUsuario}`);
      const adminData = await adminRes.json();
      if (adminRes.ok && adminData.isAdmin) {
        showAdminMessage('Este usuário já é admin', 'error');
        return;
      }
      
      // Confirmação
      if (!confirm(`Promover "${usuario.nome}" a administrador com Nível ${nivel}?`)) return;
      
      // Promove
      const res = await fetch(`${API_URL}/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: Number(idUsuario), nivel_permissao: Number(nivel) })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao promover');
      }
      
      showAdminMessage(`"${usuario.nome}" foi promovido a admin com sucesso!`, 'success');
      
      // Limpa formulário
      document.getElementById('promoteUserId').value = '';
      if (promoteUserPreview) promoteUserPreview.style.display = 'none';
      
      // Atualiza lista
      await carregarListaAdmins();
      
    } catch (err) {
      showAdminMessage(err.message || 'Erro ao promover admin', 'error');
    }
  });
}

// Expor funções globalmente
window.abrirModalEditarAdmin = abrirModalEditarAdmin;
window.closeModalEditarAdmin = closeModalEditarAdmin;
window.salvarEdicaoAdmin = salvarEdicaoAdmin;
window.rebaixarAdmin = rebaixarAdmin;

// ============================================================================
// MODAL: ALTERAR PARTIDAS (CRUD COMPLETO)
// ============================================================================

const modalPartidas = document.getElementById('modal-alterar-partidas');
const modalPartidasContent = document.getElementById('modalPartidasContent');

// Estado do modal de partidas
let partidasState = {
  step: 'selecao', // selecao | jogo | usuario | lista | editar | criar
  jogo: null,
  usuario: null,
  partidas: [],
  partidaSelecionada: null,
  partidasSelecionadas: [],
  paginaAtual: 1,
  totalPaginas: 1,
  camposJogo: [], // campos válidos para o jogo selecionado
};

// Função para obter campos permitidos por jogo
function getCamposParaJogo(jogoTitulo) {
  if (!jogoTitulo) return ['resultado', 'pontuacao', 'tempo', 'erros', 'dificuldade'];
  const key = jogoTitulo.toLowerCase();
  if (key.includes('velha')) return ['resultado', 'dificuldade'];
  if (key.includes('forca')) return ['resultado', 'erros', 'dificuldade'];
  if (key.includes('memoria') || key.includes('memória')) return ['resultado', 'tempo', 'erros', 'dificuldade'];
  if (key === 'ppt' || key.includes('pedra') || key.includes('p.p.t')) return ['resultado'];
  if (key.includes('2048')) return ['pontuacao'];
  if (key.includes('sudoku')) return ['resultado', 'tempo', 'erros', 'dificuldade'];
  if (key.includes('pong')) return ['resultado', 'tempo', 'dificuldade'];
  if (key.includes('campo') && key.includes('minado')) return ['resultado', 'tempo', 'dificuldade'];
  return ['resultado', 'pontuacao', 'tempo', 'erros', 'dificuldade'];
}

function openModalPartidas() {
  partidasState = {
    step: 'selecao',
    jogo: null,
    usuario: null,
    partidas: [],
    partidaSelecionada: null,
    partidasSelecionadas: [],
    paginaAtual: 1,
    totalPaginas: 1,
    camposJogo: [],
  };
  modalPartidas.style.display = 'flex';
  renderModalPartidas();
}

function closeModalPartidas() {
  modalPartidas.style.display = 'none';
}

// Mensagem no modal de partidas
function showPartidasMsg(msg, type = 'info') {
  const msgDiv = document.getElementById('partidasMsg');
  if (msgDiv) {
    msgDiv.innerHTML = `<div class="msg ${type}">${msg}</div>`;
    setTimeout(() => msgDiv.innerHTML = '', 4000);
  }
}

async function carregarPartidas() {
  if (!partidasState.jogo || !partidasState.usuario) return;
  try {
    const res = await fetch(`${API_URL}/api/partida?userId=${partidasState.usuario.id}&gameId=${partidasState.jogo.id}&page=${partidasState.paginaAtual}&limit=20`);
    if (!res.ok) throw new Error('Erro ao buscar partidas');
    const data = await res.json();
    partidasState.partidas = data.partidas || [];
    partidasState.totalPaginas = data.totalPages || 1;
    partidasState.camposJogo = getCamposParaJogo(partidasState.jogo.titulo);
  } catch (err) {
    partidasState.partidas = [];
    showPartidasMsg('Erro ao carregar partidas', 'error');
  }
}

function renderModalPartidas() {
  let html = '';
  
  if (partidasState.step === 'selecao') {
    html = `
      <h3>📊 Alterar Partidas</h3>
      <p>Selecione um jogo e um usuário para gerenciar as partidas.</p>
      <div class="modal-summary">
        <div class="selecao-item ${partidasState.jogo ? 'selecionado' : ''}">
          <b>🎮 Jogo:</b> ${partidasState.jogo ? partidasState.jogo.titulo : '<em>Não selecionado</em>'}
          <button class="btn-secondary btn-small" id="btnSelecionarJogo">${partidasState.jogo ? 'Alterar' : 'Selecionar'}</button>
        </div>
        <div class="selecao-item ${partidasState.usuario ? 'selecionado' : ''}">
          <b>👤 Usuário:</b> ${partidasState.usuario ? partidasState.usuario.nome : '<em>Não selecionado</em>'}
          <button class="btn-secondary btn-small" id="btnSelecionarUsuario">${partidasState.usuario ? 'Alterar' : 'Selecionar'}</button>
        </div>
      </div>
      <div id="partidasMsg"></div>
      <div class="modal-actions">
        ${partidasState.jogo && partidasState.usuario ? '<button class="btn-save" id="btnBuscarPartidas">🔍 Buscar Partidas</button>' : ''}
        <button class="btn-cancel" id="btnFecharPartidas">Fechar</button>
      </div>
    `;
  } else if (partidasState.step === 'jogo') {
    html = `
      <h3>🎮 Selecionar Jogo</h3>
      <input type="text" id="buscaJogoInput" placeholder="Digite o nome do jogo..." class="modal-input">
      <ul class="modal-list" id="listaJogos"></ul>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnVoltarSelecao">Voltar</button>
      </div>
    `;
  } else if (partidasState.step === 'usuario') {
    html = `
      <h3>👤 Selecionar Usuário</h3>
      <input type="text" id="buscaUsuarioInput" placeholder="Digite o nome do usuário..." class="modal-input">
      <ul class="modal-list" id="listaUsuarios"></ul>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnVoltarSelecao">Voltar</button>
      </div>
    `;
  } else if (partidasState.step === 'lista') {
    const campos = partidasState.camposJogo;
    html = `
      <h3>📋 Partidas de ${partidasState.usuario.nome} em ${partidasState.jogo.titulo}</h3>
      <div id="partidasMsg"></div>
      <div class="partidas-toolbar">
        <button class="btn-primary btn-small" id="btnNovaPartida">➕ Nova Partida</button>
        <button class="btn-secondary btn-small" id="btnEditarSelecionadas" style="display:none;">✏️ Editar Selecionadas</button>
        <button class="btn-danger btn-small" id="btnExcluirSelecionadas" style="display:none;">🗑️ Excluir Selecionadas</button>
        <button class="btn-danger btn-small" id="btnExcluirTodas">🗑️ Excluir Todas</button>
      </div>
      <div class="partidas-lista-container">
        ${partidasState.partidas.length === 0 ? '<p class="nenhum-resultado">Nenhuma partida encontrada.</p>' : `
          <table class="partidas-tabela">
            <thead>
              <tr>
                <th><input type="checkbox" id="checkTodas"></th>
                <th>ID</th>
                <th>Data</th>
                ${campos.includes('resultado') ? '<th>Resultado</th>' : ''}
                ${campos.includes('pontuacao') ? '<th>Pontuação</th>' : ''}
                ${campos.includes('tempo') ? '<th>Tempo</th>' : ''}
                ${campos.includes('erros') ? '<th>Erros</th>' : ''}
                ${campos.includes('dificuldade') ? '<th>Dificuldade</th>' : ''}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${partidasState.partidas.map(p => `
                <tr data-id="${p.id}">
                  <td><input type="checkbox" class="check-partida" data-id="${p.id}"></td>
                  <td>${p.id}</td>
                  <td>${new Date(p.data).toLocaleString('pt-BR')}</td>
                  ${campos.includes('resultado') ? `<td>${p.resultado || '-'}</td>` : ''}
                  ${campos.includes('pontuacao') ? `<td>${p.pontuacao !== null ? p.pontuacao : '-'}</td>` : ''}
                  ${campos.includes('tempo') ? `<td>${p.tempo !== null ? p.tempo + 's' : '-'}</td>` : ''}
                  ${campos.includes('erros') ? `<td>${p.erros !== null ? p.erros : '-'}</td>` : ''}
                  ${campos.includes('dificuldade') ? `<td>${p.dificuldade || '-'}</td>` : ''}
                  <td>
                    <button class="btn-small btn-secondary btn-editar-partida" data-id="${p.id}">✏️</button>
                    <button class="btn-small btn-danger btn-excluir-partida" data-id="${p.id}">🗑️</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="paginacao">
            <button class="btn-small" id="btnPaginaAnterior" ${partidasState.paginaAtual <= 1 ? 'disabled' : ''}>← Anterior</button>
            <span>Página ${partidasState.paginaAtual} de ${partidasState.totalPaginas}</span>
            <button class="btn-small" id="btnProximaPagina" ${partidasState.paginaAtual >= partidasState.totalPaginas ? 'disabled' : ''}>Próxima →</button>
          </div>
        `}
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnVoltarSelecao">Voltar</button>
      </div>
    `;
  } else if (partidasState.step === 'criar' || partidasState.step === 'editar') {
    const campos = partidasState.camposJogo;
    const p = partidasState.partidaSelecionada || {};
    const isEditar = partidasState.step === 'editar';
    html = `
      <h3>${isEditar ? '✏️ Editar' : '➕ Nova'} Partida</h3>
      <form id="formPartida" class="form-partida">
        ${isEditar ? `<div class="form-group"><label>ID:</label><input type="text" value="${p.id}" disabled></div>` : ''}
        <div class="form-group">
          <label>Data:</label>
          <input type="datetime-local" id="partidaData" value="${isEditar && p.data ? new Date(p.data).toISOString().slice(0,16) : new Date().toISOString().slice(0,16)}">
        </div>
        ${campos.includes('resultado') ? `
          <div class="form-group">
            <label>Resultado:</label>
            <select id="partidaResultado">
              <option value="">Selecione</option>
              <option value="vitoria" ${p.resultado === 'vitoria' ? 'selected' : ''}>Vitória</option>
              <option value="derrota" ${p.resultado === 'derrota' ? 'selected' : ''}>Derrota</option>
              <option value="empate" ${p.resultado === 'empate' ? 'selected' : ''}>Empate</option>
            </select>
          </div>
        ` : ''}
        ${campos.includes('pontuacao') ? `
          <div class="form-group">
            <label>Pontuação:</label>
            <input type="number" id="partidaPontuacao" min="0" value="${p.pontuacao || ''}">
          </div>
        ` : ''}
        ${campos.includes('tempo') ? `
          <div class="form-group">
            <label>Tempo (segundos):</label>
            <input type="number" id="partidaTempo" min="0" value="${p.tempo || ''}">
          </div>
        ` : ''}
        ${campos.includes('erros') ? `
          <div class="form-group">
            <label>Erros:</label>
            <input type="number" id="partidaErros" min="0" value="${p.erros || ''}">
          </div>
        ` : ''}
        ${campos.includes('dificuldade') ? `
          <div class="form-group">
            <label>Dificuldade:</label>
            <select id="partidaDificuldade">
              <option value="">Selecione</option>
              <option value="facil" ${p.dificuldade === 'facil' ? 'selected' : ''}>Fácil</option>
              <option value="medio" ${p.dificuldade === 'medio' ? 'selected' : ''}>Médio</option>
              <option value="dificil" ${p.dificuldade === 'dificil' ? 'selected' : ''}>Difícil</option>
            </select>
          </div>
        ` : ''}
      </form>
      <div id="partidasMsg"></div>
      <div class="modal-actions">
        <button class="btn-save" id="btnSalvarPartida">💾 Salvar</button>
        <button class="btn-cancel" id="btnCancelarPartida">Cancelar</button>
      </div>
    `;
  } else if (partidasState.step === 'editarMassa') {
    const campos = partidasState.camposJogo;
    html = `
      <h3>✏️ Editar ${partidasState.partidasSelecionadas.length} Partidas</h3>
      <p>Apenas os campos preenchidos serão atualizados em todas as partidas selecionadas.</p>
      <form id="formPartidaMassa" class="form-partida">
        ${campos.includes('resultado') ? `
          <div class="form-group">
            <label>Resultado:</label>
            <select id="massaResultado">
              <option value="">Não alterar</option>
              <option value="vitoria">Vitória</option>
              <option value="derrota">Derrota</option>
              <option value="empate">Empate</option>
            </select>
          </div>
        ` : ''}
        ${campos.includes('pontuacao') ? `
          <div class="form-group">
            <label>Pontuação:</label>
            <input type="number" id="massaPontuacao" min="0" placeholder="Não alterar">
          </div>
        ` : ''}
        ${campos.includes('tempo') ? `
          <div class="form-group">
            <label>Tempo (segundos):</label>
            <input type="number" id="massaTempo" min="0" placeholder="Não alterar">
          </div>
        ` : ''}
        ${campos.includes('erros') ? `
          <div class="form-group">
            <label>Erros:</label>
            <input type="number" id="massaErros" min="0" placeholder="Não alterar">
          </div>
        ` : ''}
        ${campos.includes('dificuldade') ? `
          <div class="form-group">
            <label>Dificuldade:</label>
            <select id="massaDificuldade">
              <option value="">Não alterar</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
        ` : ''}
      </form>
      <div id="partidasMsg"></div>
      <div class="modal-actions">
        <button class="btn-save" id="btnSalvarMassa">💾 Salvar Todas</button>
        <button class="btn-cancel" id="btnCancelarMassa">Cancelar</button>
      </div>
    `;
  }
  
  modalPartidasContent.innerHTML = html;
  bindEventosPartidas();
}

function bindEventosPartidas() {
  // Fechar modal
  const btnFechar = document.getElementById('btnFecharPartidas');
  if (btnFechar) btnFechar.onclick = closeModalPartidas;
  
  // Seleção de jogo/usuário
  const btnSelJogo = document.getElementById('btnSelecionarJogo');
  if (btnSelJogo) btnSelJogo.onclick = () => { partidasState.step = 'jogo'; renderModalPartidas(); };
  
  const btnSelUsuario = document.getElementById('btnSelecionarUsuario');
  if (btnSelUsuario) btnSelUsuario.onclick = () => { partidasState.step = 'usuario'; renderModalPartidas(); };
  
  // Voltar para seleção
  const btnVoltar = document.getElementById('btnVoltarSelecao');
  if (btnVoltar) btnVoltar.onclick = () => { partidasState.step = 'selecao'; renderModalPartidas(); };
  
  // Buscar partidas
  const btnBuscar = document.getElementById('btnBuscarPartidas');
  if (btnBuscar) btnBuscar.onclick = async () => {
    await carregarPartidas();
    partidasState.step = 'lista';
    renderModalPartidas();
  };
  
  // Busca de jogos
  const inputJogo = document.getElementById('buscaJogoInput');
  if (inputJogo) {
    inputJogo.oninput = async () => {
      const nome = inputJogo.value.trim();
      const ul = document.getElementById('listaJogos');
      if (!nome) { ul.innerHTML = '<li style="color:#aaa;">Digite para buscar...</li>'; return; }
      try {
        const res = await fetch(`${API_URL}/jogo?nome=${encodeURIComponent(nome)}`);
        const lista = res.ok ? await res.json() : [];
        ul.innerHTML = lista.length 
          ? lista.map(j => `<li data-id="${j.id}" data-titulo="${j.titulo}">${j.titulo}</li>`).join('')
          : '<li style="color:#aaa;">Nenhum jogo encontrado</li>';
        Array.from(ul.querySelectorAll('li[data-id]')).forEach(li => {
          li.onclick = () => {
            partidasState.jogo = { id: li.dataset.id, titulo: li.dataset.titulo };
            partidasState.step = 'selecao';
            renderModalPartidas();
          };
        });
      } catch { ul.innerHTML = '<li style="color:#aaa;">Erro ao buscar</li>'; }
    };
    inputJogo.focus();
  }
  
  // Busca de usuários
  const inputUsuario = document.getElementById('buscaUsuarioInput');
  if (inputUsuario) {
    inputUsuario.oninput = async () => {
      const nome = inputUsuario.value.trim();
      const ul = document.getElementById('listaUsuarios');
      if (!nome) { ul.innerHTML = '<li style="color:#aaa;">Digite para buscar...</li>'; return; }
      try {
        const res = await fetch(`${API_URL}/usuario?nome=${encodeURIComponent(nome)}`);
        const lista = res.ok ? await res.json() : [];
        ul.innerHTML = lista.length 
          ? lista.map(u => `<li data-id="${u.id}" data-nome="${u.nome}">${u.nome}</li>`).join('')
          : '<li style="color:#aaa;">Nenhum usuário encontrado</li>';
        Array.from(ul.querySelectorAll('li[data-id]')).forEach(li => {
          li.onclick = () => {
            partidasState.usuario = { id: li.dataset.id, nome: li.dataset.nome };
            partidasState.step = 'selecao';
            renderModalPartidas();
          };
        });
      } catch { ul.innerHTML = '<li style="color:#aaa;">Erro ao buscar</li>'; }
    };
    inputUsuario.focus();
  }
  
  // Nova partida
  const btnNova = document.getElementById('btnNovaPartida');
  if (btnNova) btnNova.onclick = () => {
    partidasState.partidaSelecionada = null;
    partidasState.step = 'criar';
    renderModalPartidas();
  };
  
  // Checkbox selecionar todas
  const checkTodas = document.getElementById('checkTodas');
  if (checkTodas) {
    checkTodas.onchange = () => {
      const checks = document.querySelectorAll('.check-partida');
      checks.forEach(c => c.checked = checkTodas.checked);
      atualizarBotoesSelecionadas();
    };
  }
  
  // Checkboxes individuais
  document.querySelectorAll('.check-partida').forEach(c => {
    c.onchange = atualizarBotoesSelecionadas;
  });
  
  // Editar partida individual
  document.querySelectorAll('.btn-editar-partida').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${API_URL}/api/partida/${id}`);
        if (!res.ok) throw new Error();
        const partida = await res.json();
        partidasState.partidaSelecionada = partida;
        partidasState.step = 'editar';
        renderModalPartidas();
      } catch { showPartidasMsg('Erro ao carregar partida', 'error'); }
    };
  });
  
  // Excluir partida individual
  document.querySelectorAll('.btn-excluir-partida').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Tem certeza que deseja excluir esta partida?')) return;
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${API_URL}/api/partida/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showPartidasMsg('Partida excluída!', 'success');
        await carregarPartidas();
        renderModalPartidas();
      } catch { showPartidasMsg('Erro ao excluir partida', 'error'); }
    };
  });
  
  // Editar selecionadas
  const btnEditarSel = document.getElementById('btnEditarSelecionadas');
  if (btnEditarSel) btnEditarSel.onclick = () => {
    const ids = Array.from(document.querySelectorAll('.check-partida:checked')).map(c => c.dataset.id);
    if (!ids.length) return showPartidasMsg('Selecione pelo menos uma partida', 'error');
    partidasState.partidasSelecionadas = ids;
    partidasState.step = 'editarMassa';
    renderModalPartidas();
  };
  
  // Excluir selecionadas
  const btnExcluirSel = document.getElementById('btnExcluirSelecionadas');
  if (btnExcluirSel) btnExcluirSel.onclick = async () => {
    const ids = Array.from(document.querySelectorAll('.check-partida:checked')).map(c => c.dataset.id);
    if (!ids.length) return showPartidasMsg('Selecione pelo menos uma partida', 'error');
    if (!confirm(`Tem certeza que deseja excluir ${ids.length} partida(s)?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/partida?ids=${ids.join(',')}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showPartidasMsg('Partidas excluídas!', 'success');
      await carregarPartidas();
      renderModalPartidas();
    } catch { showPartidasMsg('Erro ao excluir partidas', 'error'); }
  };
  
  // Excluir todas
  const btnExcluirTodas = document.getElementById('btnExcluirTodas');
  if (btnExcluirTodas) btnExcluirTodas.onclick = async () => {
    if (!confirm(`Tem certeza que deseja excluir TODAS as partidas de ${partidasState.usuario.nome} em ${partidasState.jogo.titulo}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/partida?userId=${partidasState.usuario.id}&gameId=${partidasState.jogo.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      showPartidasMsg('Todas as partidas foram excluídas!', 'success');
      await carregarPartidas();
      renderModalPartidas();
    } catch { showPartidasMsg('Erro ao excluir partidas', 'error'); }
  };
  
  // Paginação
  const btnPagAnt = document.getElementById('btnPaginaAnterior');
  if (btnPagAnt) btnPagAnt.onclick = async () => {
    if (partidasState.paginaAtual > 1) {
      partidasState.paginaAtual--;
      await carregarPartidas();
      renderModalPartidas();
    }
  };
  
  const btnPagProx = document.getElementById('btnProximaPagina');
  if (btnPagProx) btnPagProx.onclick = async () => {
    if (partidasState.paginaAtual < partidasState.totalPaginas) {
      partidasState.paginaAtual++;
      await carregarPartidas();
      renderModalPartidas();
    }
  };
  
  // Salvar partida (criar ou editar)
  const btnSalvar = document.getElementById('btnSalvarPartida');
  if (btnSalvar) btnSalvar.onclick = async () => {
    const campos = partidasState.camposJogo;
    const payload = {
      id_usuario: partidasState.usuario.id,
      id_jogo: partidasState.jogo.id,
      jogo: partidasState.jogo.titulo,
      usuario: partidasState.usuario.nome,
    };
    
    const dataInput = document.getElementById('partidaData');
    if (dataInput && dataInput.value) payload.data = new Date(dataInput.value).toISOString();
    
    if (campos.includes('resultado')) {
      const v = document.getElementById('partidaResultado')?.value;
      if (v) payload.resultado = v;
    }
    if (campos.includes('pontuacao')) {
      const v = document.getElementById('partidaPontuacao')?.value;
      if (v !== '') payload.pontuacao = Number(v);
    }
    if (campos.includes('tempo')) {
      const v = document.getElementById('partidaTempo')?.value;
      if (v !== '') payload.tempo = Number(v);
    }
    if (campos.includes('erros')) {
      const v = document.getElementById('partidaErros')?.value;
      if (v !== '') payload.erros = Number(v);
    }
    if (campos.includes('dificuldade')) {
      const v = document.getElementById('partidaDificuldade')?.value;
      if (v) payload.dificuldade = v;
    }
    
    try {
      let res;
      if (partidasState.step === 'editar' && partidasState.partidaSelecionada) {
        // Atualizar
        res = await fetch(`${API_URL}/api/partida/${partidasState.partidaSelecionada.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Criar
        res = await fetch(`${API_URL}/api/partida`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao salvar');
      }
      
      showPartidasMsg(partidasState.step === 'editar' ? 'Partida atualizada!' : 'Partida criada!', 'success');
      await carregarPartidas();
      partidasState.step = 'lista';
      renderModalPartidas();
    } catch (err) {
      showPartidasMsg(err.message || 'Erro ao salvar partida', 'error');
    }
  };
  
  // Cancelar edição/criação
  const btnCancelar = document.getElementById('btnCancelarPartida');
  if (btnCancelar) btnCancelar.onclick = () => {
    partidasState.step = 'lista';
    renderModalPartidas();
  };
  
  // Salvar em massa
  const btnSalvarMassa = document.getElementById('btnSalvarMassa');
  if (btnSalvarMassa) btnSalvarMassa.onclick = async () => {
    const campos = partidasState.camposJogo;
    const updates = {};
    
    if (campos.includes('resultado')) {
      const v = document.getElementById('massaResultado')?.value;
      if (v) updates.resultado = v;
    }
    if (campos.includes('pontuacao')) {
      const v = document.getElementById('massaPontuacao')?.value;
      if (v !== '') updates.pontuacao = Number(v);
    }
    if (campos.includes('tempo')) {
      const v = document.getElementById('massaTempo')?.value;
      if (v !== '') updates.tempo = Number(v);
    }
    if (campos.includes('erros')) {
      const v = document.getElementById('massaErros')?.value;
      if (v !== '') updates.erros = Number(v);
    }
    if (campos.includes('dificuldade')) {
      const v = document.getElementById('massaDificuldade')?.value;
      if (v) updates.dificuldade = v;
    }
    
    if (Object.keys(updates).length === 0) {
      return showPartidasMsg('Preencha pelo menos um campo para atualizar', 'error');
    }
    
    try {
      const res = await fetch(`${API_URL}/api/partida/batch/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: partidasState.partidasSelecionadas.map(Number), updates })
      });
      if (!res.ok) throw new Error();
      showPartidasMsg('Partidas atualizadas!', 'success');
      await carregarPartidas();
      partidasState.step = 'lista';
      renderModalPartidas();
    } catch { showPartidasMsg('Erro ao atualizar partidas', 'error'); }
  };
  
  // Cancelar edição em massa
  const btnCancelarMassa = document.getElementById('btnCancelarMassa');
  if (btnCancelarMassa) btnCancelarMassa.onclick = () => {
    partidasState.step = 'lista';
    renderModalPartidas();
  };
}

function atualizarBotoesSelecionadas() {
  const selecionadas = document.querySelectorAll('.check-partida:checked').length;
  const btnEditar = document.getElementById('btnEditarSelecionadas');
  const btnExcluir = document.getElementById('btnExcluirSelecionadas');
  if (btnEditar) btnEditar.style.display = selecionadas > 0 ? '' : 'none';
  if (btnExcluir) btnExcluir.style.display = selecionadas > 0 ? '' : 'none';
}

// Expor função globalmente
window.openModalPartidas = openModalPartidas;
window.closeModalPartidas = closeModalPartidas;

// ============================================================================
// MODAL: GERENCIAR CATÁLOGO DE TROFÉUS (CRUD TrophyType) - MELHORADO
// ============================================================================

const modalTrofeuTipo = document.getElementById('modal-trofeu-tipo');
const modalTrofeuTipoContent = document.getElementById('modalTrofeuTipoContent');

// Ícones disponíveis para troféus
const TROFEU_ICONES = ['🏆', '🥇', '🥈', '🥉', '👑', '⭐', '🎖️', '🏅', '💎', '🌟', '🎯', '🔥', '💪', '🎮', '🎲', '🃏'];

// Cores disponíveis para troféus  
const TROFEU_CORES = ['#FFD700', '#C0C0C0', '#CD7F32', '#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

// Estado do modal de tipos de troféu
let trofeuTipoState = {
  step: 'lista', // lista | criar | editar
  tipos: [],
  tipoSelecionado: null,
  iconeEscolhido: '🏆',
  corEscolhida: '#FFD700',
};

function openModalTrofeuTipo() {
  trofeuTipoState = {
    step: 'lista',
    tipos: [],
    tipoSelecionado: null,
    iconeEscolhido: '🏆',
    corEscolhida: '#FFD700',
  };
  modalTrofeuTipo.style.display = 'flex';
  carregarTiposTrofeu();
}

function closeModalTrofeuTipo() {
  modalTrofeuTipo.style.display = 'none';
}

function showTrofeuTipoMsg(msg, type = 'info') {
  const msgDiv = document.getElementById('trofeuTipoMsg');
  if (msgDiv) {
    msgDiv.innerHTML = `<div class="msg ${type}">${msg}</div>`;
    setTimeout(() => msgDiv.innerHTML = '', 4000);
  }
}

async function carregarTiposTrofeu() {
  try {
    const res = await fetch(`${API_URL}/trophy/types`);
    if (!res.ok) throw new Error('Erro ao carregar tipos');
    trofeuTipoState.tipos = await res.json();
    renderModalTrofeuTipo();
  } catch (err) {
    trofeuTipoState.tipos = [];
    showTrofeuTipoMsg('Erro ao carregar tipos de troféu', 'error');
    renderModalTrofeuTipo();
  }
}

function renderModalTrofeuTipo() {
  let html = '';
  
  if (trofeuTipoState.step === 'lista') {
    html = `
      <h3>🏆 Catálogo de Troféus</h3>
      <p style="color:#6b7280; margin-bottom:16px;">Gerencie os tipos de troféus disponíveis no sistema.</p>
      <div id="trofeuTipoMsg"></div>
      <div class="trofeu-toolbar">
        <button class="btn-primary" id="btnNovoTipoTrofeu">➕ Criar Novo Troféu</button>
      </div>
      <div class="trofeu-lista-container">
        ${trofeuTipoState.tipos.length === 0 ? '<p class="nenhum-resultado">Nenhum tipo de troféu cadastrado.</p>' : `
          <table class="trofeu-tabela">
            <thead>
              <tr>
                <th style="width:60px;">Ícone</th>
                <th>Título</th>
                <th>Descrição</th>
                <th style="width:100px;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${trofeuTipoState.tipos.map(t => {
                const icone = t.icone || t.dados?.icone || '🏆';
                const cor = t.cor_hex || t.dados?.cor_hex || '#FFD700';
                return `
                <tr data-id="${t.id}">
                  <td style="text-align:center;">
                    <span style="font-size:2rem; color:${cor};">${icone}</span>
                  </td>
                  <td>
                    <strong style="color:${cor};">${t.titulo || '-'}</strong>
                    <br><small style="color:#9ca3af;">${t.chave || ''}</small>
                  </td>
                  <td style="font-size:0.9rem; color:#6b7280;">${t.descricao ? t.descricao.substring(0, 60) + (t.descricao.length > 60 ? '...' : '') : '-'}</td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn-small btn-secondary btn-editar-tipo" data-id="${t.id}" title="Editar">✏️</button>
                      <button class="btn-small btn-danger btn-excluir-tipo" data-id="${t.id}" title="Excluir">🗑️</button>
                    </div>
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        `}
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnFecharTrofeuTipo">Fechar</button>
      </div>
    `;
  } else if (trofeuTipoState.step === 'criar' || trofeuTipoState.step === 'editar') {
    const t = trofeuTipoState.tipoSelecionado || {};
    const isEditar = trofeuTipoState.step === 'editar';
    const iconeAtual = t.icone || t.dados?.icone || trofeuTipoState.iconeEscolhido;
    const corAtual = t.cor_hex || t.dados?.cor_hex || trofeuTipoState.corEscolhida;
    
    html = `
      <h3>${isEditar ? '✏️ Editar' : '➕ Criar'} Troféu</h3>
      
      <!-- Preview do troféu -->
      <div class="trofeu-preview-large" id="trofeuPreview" style="color:${corAtual};">
        ${iconeAtual}
      </div>
      
      <form id="formTipoTrofeu" class="form-trofeu">
        <div class="form-group">
          <label>Título do Troféu: *</label>
          <input type="text" id="tipoTitulo" value="${t.titulo || ''}" required maxlength="100" placeholder="Ex: Campeão de Velocidade">
        </div>
        
        <div class="form-group">
          <label>Chave única (identificador): *</label>
          <input type="text" id="tipoChave" value="${t.chave || ''}" required maxlength="50" 
                 placeholder="Ex: campeao_velocidade" ${isEditar ? 'readonly style="background:#f5f5f5;"' : ''}>
          ${!isEditar ? '<small style="color:#6b7280;">Use apenas letras minúsculas, números e underline</small>' : ''}
        </div>
        
        <div class="form-group">
          <label>Descrição:</label>
          <textarea id="tipoDescricao" rows="2" placeholder="Descrição do troféu...">${t.descricao || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label>Escolha o Ícone:</label>
          <div class="icon-selector" id="iconSelector">
            ${TROFEU_ICONES.map(icon => `
              <div class="icon-option ${icon === iconeAtual ? 'selected' : ''}" data-icon="${icon}">${icon}</div>
            `).join('')}
          </div>
          <input type="hidden" id="tipoIcone" value="${iconeAtual}">
        </div>
        
        <div class="form-group">
          <label>Escolha a Cor:</label>
          <div class="color-selector" id="colorSelector">
            ${TROFEU_CORES.map(cor => `
              <div class="color-option ${cor === corAtual ? 'selected' : ''}" data-color="${cor}" style="background:${cor};"></div>
            `).join('')}
          </div>
          <input type="hidden" id="tipoCorHex" value="${corAtual}">
        </div>
      </form>
      
      <div id="trofeuTipoMsg"></div>
      <div class="modal-actions">
        <button class="btn-save" id="btnSalvarTipoTrofeu">💾 ${isEditar ? 'Salvar Alterações' : 'Criar Troféu'}</button>
        <button class="btn-cancel" id="btnCancelarTipoTrofeu">Cancelar</button>
      </div>
    `;
  }
  
  modalTrofeuTipoContent.innerHTML = html;
  bindEventosTrofeuTipo();
}

function bindEventosTrofeuTipo() {
  // Fechar modal
  const btnFechar = document.getElementById('btnFecharTrofeuTipo');
  if (btnFechar) btnFechar.onclick = closeModalTrofeuTipo;
  
  // Novo tipo
  const btnNovo = document.getElementById('btnNovoTipoTrofeu');
  if (btnNovo) btnNovo.onclick = () => {
    trofeuTipoState.tipoSelecionado = null;
    trofeuTipoState.iconeEscolhido = '🏆';
    trofeuTipoState.corEscolhida = '#FFD700';
    trofeuTipoState.step = 'criar';
    renderModalTrofeuTipo();
  };
  
  // Editar tipo
  document.querySelectorAll('.btn-editar-tipo').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${API_URL}/trophy/types/${id}`);
        if (!res.ok) throw new Error();
        const tipo = await res.json();
        trofeuTipoState.tipoSelecionado = tipo;
        trofeuTipoState.iconeEscolhido = tipo.icone || tipo.dados?.icone || '🏆';
        trofeuTipoState.corEscolhida = tipo.cor_hex || tipo.dados?.cor_hex || '#FFD700';
        trofeuTipoState.step = 'editar';
        renderModalTrofeuTipo();
      } catch {
        showTrofeuTipoMsg('Erro ao carregar tipo de troféu', 'error');
      }
    };
  });
  
  // Excluir tipo
  document.querySelectorAll('.btn-excluir-tipo').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Tem certeza que deseja excluir este tipo de troféu?\n\nTodos os troféus deste tipo atribuídos a usuários também serão removidos!')) return;
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${API_URL}/trophy/types/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao excluir');
        }
        showTrofeuTipoMsg('Tipo de troféu excluído!', 'success');
        await carregarTiposTrofeu();
      } catch (err) {
        showTrofeuTipoMsg(err.message || 'Erro ao excluir tipo de troféu', 'error');
      }
    };
  });
  
  // Seleção de ícone
  document.querySelectorAll('.icon-option').forEach(opt => {
    opt.onclick = () => {
      document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const icon = opt.dataset.icon;
      document.getElementById('tipoIcone').value = icon;
      trofeuTipoState.iconeEscolhido = icon;
      // Atualiza preview
      const preview = document.getElementById('trofeuPreview');
      if (preview) preview.innerHTML = icon;
    };
  });
  
  // Seleção de cor
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.onclick = () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const cor = opt.dataset.color;
      document.getElementById('tipoCorHex').value = cor;
      trofeuTipoState.corEscolhida = cor;
      // Atualiza preview
      const preview = document.getElementById('trofeuPreview');
      if (preview) preview.style.color = cor;
    };
  });
  
  // Salvar tipo
  const btnSalvar = document.getElementById('btnSalvarTipoTrofeu');
  if (btnSalvar) btnSalvar.onclick = async () => {
    const titulo = document.getElementById('tipoTitulo')?.value.trim();
    const chave = document.getElementById('tipoChave')?.value.trim();
    const descricao = document.getElementById('tipoDescricao')?.value.trim();
    const cor_hex = document.getElementById('tipoCorHex')?.value.trim() || trofeuTipoState.corEscolhida;
    const icone = document.getElementById('tipoIcone')?.value.trim() || trofeuTipoState.iconeEscolhido;
    
    if (!titulo) return showTrofeuTipoMsg('Título é obrigatório', 'error');
    if (!chave) return showTrofeuTipoMsg('Chave é obrigatória', 'error');
    
    // Valida formato da chave
    if (!/^[a-z0-9_]+$/.test(chave)) {
      return showTrofeuTipoMsg('Chave deve conter apenas letras minúsculas, números e underline', 'error');
    }
    
    // Payload enviado diretamente com cor_hex e icone no nível raiz
    // O backend vai montar o JSON dados internamente
    const payload = {
      titulo,
      chave,
      descricao,
      cor_hex,
      icone
    };
    
    try {
      let res;
      if (trofeuTipoState.step === 'editar' && trofeuTipoState.tipoSelecionado) {
        res = await fetch(`${API_URL}/trophy/types/${trofeuTipoState.tipoSelecionado.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/trophy/types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar');
      }
      
      showTrofeuTipoMsg(trofeuTipoState.step === 'editar' ? 'Troféu atualizado!' : 'Troféu criado com sucesso!', 'success');
      trofeuTipoState.step = 'lista';
      await carregarTiposTrofeu();
    } catch (err) {
      showTrofeuTipoMsg(err.message || 'Erro ao salvar tipo de troféu', 'error');
    }
  };
  
  // Cancelar
  const btnCancelar = document.getElementById('btnCancelarTipoTrofeu');
  if (btnCancelar) btnCancelar.onclick = () => {
    trofeuTipoState.step = 'lista';
    renderModalTrofeuTipo();
  };
}

// Expor funções globalmente
window.openModalTrofeuTipo = openModalTrofeuTipo;
window.closeModalTrofeuTipo = closeModalTrofeuTipo;


// ============================================================================
// MODAL: ATRIBUIR TROFÉU A USUÁRIO
// ============================================================================

const modalTrofeuAtribuir = document.getElementById('modal-trofeu-atribuir');
const modalTrofeuAtribuirContent = document.getElementById('modalTrofeuAtribuirContent');

// Estado do modal de atribuição
let trofeuAtribuirState = {
  step: 'selecao', // selecao | usuario | tipo | lista
  usuario: null,
  tipoTrofeu: null,
  trofeusUsuario: [],
  tiposDisponiveis: [],
};

function openModalTrofeuAtribuir() {
  trofeuAtribuirState = {
    step: 'selecao',
    usuario: null,
    tipoTrofeu: null,
    trofeusUsuario: [],
    tiposDisponiveis: [],
  };
  modalTrofeuAtribuir.style.display = 'flex';
  renderModalTrofeuAtribuir();
}

function closeModalTrofeuAtribuir() {
  modalTrofeuAtribuir.style.display = 'none';
}

function showTrofeuAtribuirMsg(msg, type = 'info') {
  const msgDiv = document.getElementById('trofeuAtribuirMsg');
  if (msgDiv) {
    msgDiv.innerHTML = `<div class="msg ${type}">${msg}</div>`;
    setTimeout(() => msgDiv.innerHTML = '', 4000);
  }
}

async function carregarTrofeusUsuario() {
  if (!trofeuAtribuirState.usuario) return;
  try {
    const res = await fetch(`${API_URL}/trophy/usuario/${trofeuAtribuirState.usuario.id}`);
    if (!res.ok) throw new Error();
    trofeuAtribuirState.trofeusUsuario = await res.json();
  } catch {
    trofeuAtribuirState.trofeusUsuario = [];
  }
}

async function carregarTiposDisponiveis() {
  try {
    const res = await fetch(`${API_URL}/trophy/types`);
    if (!res.ok) throw new Error();
    const todos = await res.json();
    // Filtra os tipos que o usuário ainda não possui
    const idsJaPossui = trofeuAtribuirState.trofeusUsuario.map(t => t.trophy_type_id);
    trofeuAtribuirState.tiposDisponiveis = todos.filter(t => !idsJaPossui.includes(t.id));
  } catch {
    trofeuAtribuirState.tiposDisponiveis = [];
  }
}

function renderModalTrofeuAtribuir() {
  let html = '';
  
  if (trofeuAtribuirState.step === 'selecao') {
    html = `
      <h3>🎖️ Atribuir Troféu a Usuário</h3>
      <p>Selecione um usuário para gerenciar seus troféus.</p>
      <div class="modal-summary">
        <div class="selecao-item ${trofeuAtribuirState.usuario ? 'selecionado' : ''}">
          <b>👤 Usuário:</b> ${trofeuAtribuirState.usuario ? trofeuAtribuirState.usuario.nome : '<em>Não selecionado</em>'}
          <button class="btn-secondary btn-small" id="btnSelecionarUsuarioTrofeu">${trofeuAtribuirState.usuario ? 'Alterar' : 'Selecionar'}</button>
        </div>
      </div>
      <div id="trofeuAtribuirMsg"></div>
      <div class="modal-actions">
        ${trofeuAtribuirState.usuario ? '<button class="btn-primary" id="btnVerTrofeusUsuario">👁️ Ver Troféus do Usuário</button>' : ''}
        <button class="btn-cancel" id="btnFecharTrofeuAtribuir">Fechar</button>
      </div>
    `;
  } else if (trofeuAtribuirState.step === 'usuario') {
    html = `
      <h3>👤 Selecionar Usuário</h3>
      <input type="text" id="buscaUsuarioTrofeuInput" placeholder="Digite o nome do usuário..." class="modal-input">
      <ul class="modal-list" id="listaUsuariosTrofeu"></ul>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnVoltarSelecaoTrofeu">Voltar</button>
      </div>
    `;
  } else if (trofeuAtribuirState.step === 'lista') {
    html = `
      <h3>🏆 Troféus de ${trofeuAtribuirState.usuario.nome}</h3>
      <div id="trofeuAtribuirMsg"></div>
      <div class="trofeu-toolbar">
        <button class="btn-primary btn-small" id="btnAtribuirNovoTrofeu">➕ Atribuir Novo Troféu</button>
      </div>
      <div class="trofeu-lista-container">
        ${trofeuAtribuirState.trofeusUsuario.length === 0 ? '<p class="nenhum-resultado">Este usuário não possui troféus.</p>' : `
          <table class="trofeu-tabela">
            <thead>
              <tr>
                <th>ID</th>
                <th>Troféu</th>
                <th>Data de Atribuição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${trofeuAtribuirState.trofeusUsuario.map(t => `
                <tr data-id="${t.id}">
                  <td>${t.id}</td>
                  <td>
                    <span class="trofeu-icone">${t.trofeu_icone || '🏆'}</span>
                    <strong>${t.trofeu_nome || 'Sem nome'}</strong>
                    <br><small>${t.trofeu_descricao || ''}</small>
                  </td>
                  <td>${t.data_atribuicao ? new Date(t.data_atribuicao).toLocaleString('pt-BR') : '-'}</td>
                  <td>
                    <button class="btn-small btn-danger btn-revogar-trofeu" data-id="${t.id}">🗑️ Revogar</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnVoltarSelecaoTrofeu">Voltar</button>
      </div>
    `;
  } else if (trofeuAtribuirState.step === 'tipo') {
    html = `
      <h3>🏆 Selecionar Troféu para Atribuir</h3>
      <p>Atribuindo para: <strong>${trofeuAtribuirState.usuario.nome}</strong></p>
      <div id="trofeuAtribuirMsg"></div>
      <div class="trofeu-lista-container">
        ${trofeuAtribuirState.tiposDisponiveis.length === 0 ? '<p class="nenhum-resultado">Não há troféus disponíveis para atribuir (usuário já possui todos).</p>' : `
          <table class="trofeu-tabela">
            <thead>
              <tr>
                <th>ID</th>
                <th>Troféu</th>
                <th>Descrição</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              ${trofeuAtribuirState.tiposDisponiveis.map(t => `
                <tr data-id="${t.id}">
                  <td>${t.id}</td>
                  <td>
                    <span class="trofeu-icone">${t.icone || t.dados?.icone || '🏆'}</span>
                    <strong>${t.titulo || 'Sem nome'}</strong>
                  </td>
                  <td>${t.descricao ? t.descricao.substring(0, 80) + (t.descricao.length > 80 ? '...' : '') : '-'}</td>
                  <td>
                    <button class="btn-small btn-primary btn-atribuir-tipo" data-id="${t.id}" data-titulo="${t.titulo}">➕ Atribuir</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnVoltarListaTrofeus">Voltar</button>
      </div>
    `;
  }
  
  modalTrofeuAtribuirContent.innerHTML = html;
  bindEventosTrofeuAtribuir();
}

function bindEventosTrofeuAtribuir() {
  // Fechar modal
  const btnFechar = document.getElementById('btnFecharTrofeuAtribuir');
  if (btnFechar) btnFechar.onclick = closeModalTrofeuAtribuir;
  
  // Selecionar usuário
  const btnSelUsuario = document.getElementById('btnSelecionarUsuarioTrofeu');
  if (btnSelUsuario) btnSelUsuario.onclick = () => {
    trofeuAtribuirState.step = 'usuario';
    renderModalTrofeuAtribuir();
  };
  
  // Voltar para seleção
  const btnVoltar = document.getElementById('btnVoltarSelecaoTrofeu');
  if (btnVoltar) btnVoltar.onclick = () => {
    trofeuAtribuirState.step = 'selecao';
    renderModalTrofeuAtribuir();
  };
  
  // Voltar para lista de troféus
  const btnVoltarLista = document.getElementById('btnVoltarListaTrofeus');
  if (btnVoltarLista) btnVoltarLista.onclick = () => {
    trofeuAtribuirState.step = 'lista';
    renderModalTrofeuAtribuir();
  };
  
  // Ver troféus do usuário
  const btnVerTrofeus = document.getElementById('btnVerTrofeusUsuario');
  if (btnVerTrofeus) btnVerTrofeus.onclick = async () => {
    await carregarTrofeusUsuario();
    trofeuAtribuirState.step = 'lista';
    renderModalTrofeuAtribuir();
  };
  
  // Busca de usuários
  const inputUsuario = document.getElementById('buscaUsuarioTrofeuInput');
  if (inputUsuario) {
    inputUsuario.oninput = async () => {
      const nome = inputUsuario.value.trim();
      const ul = document.getElementById('listaUsuariosTrofeu');
      if (!nome) { ul.innerHTML = '<li style="color:#aaa;">Digite para buscar...</li>'; return; }
      try {
        const res = await fetch(`${API_URL}/usuario?nome=${encodeURIComponent(nome)}`);
        const lista = res.ok ? await res.json() : [];
        ul.innerHTML = lista.length 
          ? lista.map(u => `<li data-id="${u.id}" data-nome="${u.nome}">${u.nome} (ID: ${u.id})</li>`).join('')
          : '<li style="color:#aaa;">Nenhum usuário encontrado</li>';
        Array.from(ul.querySelectorAll('li[data-id]')).forEach(li => {
          li.onclick = () => {
            trofeuAtribuirState.usuario = { id: li.dataset.id, nome: li.dataset.nome };
            trofeuAtribuirState.step = 'selecao';
            renderModalTrofeuAtribuir();
          };
        });
      } catch { ul.innerHTML = '<li style="color:#aaa;">Erro ao buscar</li>'; }
    };
    inputUsuario.focus();
  }
  
  // Atribuir novo troféu - ir para seleção de tipo
  const btnAtribuirNovo = document.getElementById('btnAtribuirNovoTrofeu');
  if (btnAtribuirNovo) btnAtribuirNovo.onclick = async () => {
    await carregarTiposDisponiveis();
    trofeuAtribuirState.step = 'tipo';
    renderModalTrofeuAtribuir();
  };
  
  // Atribuir tipo específico
  document.querySelectorAll('.btn-atribuir-tipo').forEach(btn => {
    btn.onclick = async () => {
      const trophy_type_id = btn.dataset.id;
      const titulo = btn.dataset.titulo;
      
      if (!confirm(`Atribuir o troféu "${titulo}" para ${trofeuAtribuirState.usuario.nome}?`)) return;
      
      try {
        const res = await fetch(`${API_URL}/trophy/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: trofeuAtribuirState.usuario.id,
            trophy_type_id: trophy_type_id
          })
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao atribuir');
        }
        
        showTrofeuAtribuirMsg('Troféu atribuído com sucesso!', 'success');
        await carregarTrofeusUsuario();
        trofeuAtribuirState.step = 'lista';
        renderModalTrofeuAtribuir();
      } catch (err) {
        showTrofeuAtribuirMsg(err.message || 'Erro ao atribuir troféu', 'error');
      }
    };
  });
  
  // Revogar troféu
  document.querySelectorAll('.btn-revogar-trofeu').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Tem certeza que deseja revogar este troféu do usuário?')) return;
      const id = btn.dataset.id;
      try {
        const res = await fetch(`${API_URL}/trophy/revoke/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showTrofeuAtribuirMsg('Troféu revogado!', 'success');
        await carregarTrofeusUsuario();
        renderModalTrofeuAtribuir();
      } catch {
        showTrofeuAtribuirMsg('Erro ao revogar troféu', 'error');
      }
    };
  });
}

// Expor funções globalmente
window.openModalTrofeuAtribuir = openModalTrofeuAtribuir;
window.closeModalTrofeuAtribuir = closeModalTrofeuAtribuir;

// ============================================================================
// CARREGAR LISTA INICIAL DE TROFÉUS NA SEÇÃO (opcional)
// ============================================================================

async function carregarListaTrofeusGeral() {
  const container = document.getElementById('trofeuListContainer');
  if (!container) return;
  
  try {
    const res = await fetch(`${API_URL}/trophy`);
    if (!res.ok) throw new Error();
    const trofeus = await res.json();
    
    if (trofeus.length === 0) {
      container.innerHTML = '<p class="nenhum-resultado">Nenhum troféu atribuído ainda.</p>';
      return;
    }
    
    container.innerHTML = `
      <h4>Últimos Troféus Atribuídos</h4>
      <table class="trofeu-tabela compact">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Troféu</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${trofeus.slice(0, 10).map(t => `
            <tr>
              <td>${t.usuario_nome || 'Desconhecido'}</td>
              <td><span class="trofeu-icone">${t.trofeu_icone || '🏆'}</span> ${t.trofeu_nome || '-'}</td>
              <td>${t.data_atribuicao ? new Date(t.data_atribuicao).toLocaleDateString('pt-BR') : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch {
    container.innerHTML = '<p class="nenhum-resultado">Erro ao carregar troféus.</p>';
  }
}

// Carregar listas ao entrar nas abas específicas
document.querySelectorAll('.gestao-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    if (this.dataset.tab === 'crud-trofeu') {
      carregarListaTrofeusGeral();
    }
    if (this.dataset.tab === 'crud-admin') {
      carregarListaAdmins();
    }
  });
});

// Carregar dados iniciais se a aba já estiver ativa no carregamento da página
document.addEventListener('DOMContentLoaded', () => {
  const activeTab = document.querySelector('.gestao-tab.active');
  if (activeTab && activeTab.dataset.tab === 'crud-admin') {
    carregarListaAdmins();
  }
  if (activeTab && activeTab.dataset.tab === 'crud-trofeu') {
    carregarListaTrofeusGeral();
  }
});
