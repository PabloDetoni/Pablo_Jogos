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
}
function clearUsuarioStatus() {
  usuarioStatusMsg = null;
  usuarioMessageContainer.innerHTML = '';
}

function estadoBusca() {
  idBuscaInput.style.display = '';
  formFieldsUsuario.style.display = 'none';
  btnBuscarUsuario.style.display = '';
  btnAlterarUsuario.style.display = 'none';
  btnExcluirUsuario.style.display = 'none';
  btnSalvarUsuario.style.display = 'none';
  btnCancelarUsuario.style.display = 'none';
  btnVoltarUsuario.style.display = 'none';
  idBuscaInput.readOnly = false;
  idUsuarioInput.value = '';
  idUsuarioInput.readOnly = true;
  setUsuarioFormEditable(false);
  setUsuarioStatus('Digite um ID maior que 0 e clique em Buscar.', 'info');
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
  setUsuarioStatus('Novo usuário: preenchendo dados para inserir.', 'info');
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
  setUsuarioStatus('Usuário encontrado. Você pode alterar ou excluir.', 'success');
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
  setUsuarioStatus('Alterando usuário: edite os campos e clique em Salvar.', 'warning');
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
  safeDisplay(btnCancelarJogo, 'none');
  safeDisplay(btnIncluirJogo, 'none');
  safeDisplay(btnVoltarJogo, 'none');
  if (searchJogoIdInput) {
    searchJogoIdInput.readOnly = false;
    // Não limpar o valor do campo
  }
  showJogoMessage('Digite um ID e clique em Buscar.', 'info');
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
  // Sempre atribui o valor do campo de busca ao campo id_jogo
  const idBusca = searchJogoIdInput.value;
  const idJogoInput = document.getElementById('id_jogo');
  if (idJogoInput) idJogoInput.value = idBusca;
  showJogoMessage('Novo jogo: preencha os dados e clique em Salvar.', 'info');
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
  showJogoMessage('Jogo encontrado. Você pode alterar ou excluir.', 'success');
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
  showJogoMessage('Alterando jogo: edite os campos e clique em Salvar.', 'warning');
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
  showJogoMessage('Excluindo jogo: clique em Salvar para confirmar ou Voltar/Cancelar.', 'warning');
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
// --- CRUD Admins ---
const adminMessageContainer = document.getElementById('adminMessageContainer');
const adminForm = document.getElementById('adminForm');
const formFieldsAdmin = document.getElementById('formFieldsAdmin');
const btnBuscarAdmin = document.getElementById('btnBuscarAdmin');
const btnIncluirAdmin = document.getElementById('btnIncluirAdmin');
const btnAlterarAdmin = document.getElementById('btnAlterarAdmin');
const btnExcluirAdmin = document.getElementById('btnExcluirAdmin');
const btnCancelarAdmin = document.getElementById('btnCancelarAdmin');
let adminEditando = null;
function showAdminMessage(msg, type = 'success') {
  adminMessageContainer.innerHTML = `<div class="msg ${type}">${msg}</div>`;
  setTimeout(() => adminMessageContainer.innerHTML = '', 3000);
}
function limparAdminForm() {
  adminForm
  btnAlterarAdmin.style.display = 'none';
  btnExcluirAdmin.style.display = 'none';
  btnIncluirAdmin.style.display = '';
}
function preencherAdminForm(admin) {
  document.getElementById('nivel_permissao_admin').value = admin.nivel_permissao || '';
  formFieldsAdmin.style.display = '';
}
btnBuscarAdmin.addEventListener('click', async () => {
  const id_usuario = document.getElementById('searchAdminId').value;
  if (!id_usuario) return showAdminMessage('Informe o ID do usuário', 'error');
  try {
    const res = await fetch(`/admin/${id_usuario}`);
    if (!res.ok) throw new Error('Admin não encontrado');
    const admin = await res.json();
    adminEditando = admin;
    preencherAdminForm(admin);
    btnAlterarAdmin.style.display = '';
    btnExcluirAdmin.style.display = '';
    btnIncluirAdmin.style.display = 'none';
  } catch (err) {
    showAdminMessage('Admin não encontrado', 'error');
  }
});
btnIncluirAdmin.addEventListener('click', async () => {
  const id_usuario = document.getElementById('searchAdminId').value;
  const nivel_permissao = document.getElementById('nivel_permissao_admin').value;
  if (!id_usuario || !nivel_permissao) return showAdminMessage('Preencha todos os campos', 'error');
  try {
    const res = await fetch('/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_usuario, nivel_permissao })
    });
    if (!res.ok) throw new Error('Erro ao promover admin');
    showAdminMessage('Admin promovido com sucesso!');
    limparAdminForm();
  } catch (err) {
    showAdminMessage('Erro ao promover admin', 'error');
  }
});
btnAlterarAdmin.addEventListener('click', async () => {
  if (!adminEditando) return;
  const nivel_permissao = document.getElementById('nivel_permissao_admin').value;
  try {
    const res = await fetch(`/admin/${adminEditando.id_usuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nivel_permissao })
    });
    if (!res.ok) throw new Error('Erro ao alterar permissão');
    showAdminMessage('Permissão alterada com sucesso!');
    limparAdminForm();
  } catch (err) {
    showAdminMessage('Erro ao alterar permissão', 'error');
  }
});
btnExcluirAdmin.addEventListener('click', async () => {
  if (!adminEditando) return;
  if (!confirm('Tem certeza que deseja remover este admin?')) return;
  try {
    const res = await fetch(`/admin/${adminEditando.id_usuario}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao remover admin');
    showAdminMessage('Admin removido com sucesso!');
    limparAdminForm();
  } catch (err) {
    showAdminMessage('Erro ao remover admin', 'error');
  }
});
btnCancelarAdmin.addEventListener('click', () => {
  limparAdminForm();
});
// adminForm.addEventListener('submit', e => e.preventDefault());
// --- MODAIS FLUXO CRUD ESTATÍSTICAS E ALTERAR PARTIDAS ---
// Declarar os estados no topo do arquivo, ANTES de qualquer função ou uso
let crudModalState = {
  step: 'init',
  tipo: null,
  busca: '',
  resultado: null,
  lista: [],
  erro: '',
};
let partidasModalState = {
  step: 'selecao',
  jogo: null,
  usuario: null,
  erro: '',
};
// Utiliza variáveis de estado para garantir navegação e validação perfeitas
const modalCrud = document.getElementById('modal-alterar-crud');
const modalCrudContent = document.getElementById('modalCrudContent');
const closeModalCrud = document.getElementById('closeModalCrud');
const modalPartidas = document.getElementById('modal-alterar-partidas');
const modalPartidasContent = document.getElementById('modalPartidasContent');
const closeModalPartidas = document.getElementById('closeModalPartidas');

// Estados do modal CRUD Estatísticas
// let crudModalState = {
//   step: 'init', // init | id | nome | resultado | resumo
//   tipo: null, // 'jogo' ou 'usuario'
//   busca: '',
//   resultado: null,
//   lista: [],
//   erro: '',
// };
// Estados do modal Alterar Partidas
// let partidasModalState = {
//   step: 'selecao', // selecao | jogo | usuario | resumo
//   jogo: null,
//   usuario: null,
//   erro: '',
// };
// Funções utilitárias
function openModalCrud(tipo) {
  crudModalState = { step: 'init', tipo, busca: '', resultado: null, lista: [], erro: '' };
  modalCrud.style.display = 'flex';
  renderModalCrud();
}
function closeModalCrudFn() {
  modalCrud.style.display = 'none';
  crudModalState = { step: 'init', tipo: null, busca: '', resultado: null, lista: [], erro: '' };
}
closeModalCrud.onclick = closeModalCrudFn;
modalCrud.onclick = e => { if (e.target === modalCrud) closeModalCrudFn(); };
function renderModalCrud() {
  // Renderiza cada etapa conforme o fluxo
  let html = '';
  if (crudModalState.step === 'init') {
    html = `<h3>Alterar informações de ${crudModalState.tipo === 'jogo' ? 'Jogo' : 'Usuário'}</h3>
      <div class="modal-actions">
        <button class="btn-primary" id="btnCrudBuscarId">Buscar por ID</button>
        <button class="btn-secondary" id="btnCrudBuscarNome">Buscar por Nome</button>
        <button class="btn-cancel" id="btnCrudVoltar">Voltar</button>
      </div>`;
  } else if (crudModalState.step === 'id') {
    html = `<h3>Buscar por ID</h3>
      <input type="number" id="crudIdInput" placeholder="Digite o ID">
      <div class="modal-actions">
        <button class="btn-primary" id="btnCrudPesquisarId">Pesquisar</button>
        <button class="btn-cancel" id="btnCrudVoltar">Voltar</button>
      </div>
      ${crudModalState.erro ? `<div class="modal-error">${crudModalState.erro}</div>` : ''}`;
  } else if (crudModalState.step === 'nome') {
    html = `<h3>Buscar por Nome</h3>
      <input type="text" id="crudNomeInput" placeholder="Digite o nome">
      <ul class="modal-list" id="crudNomeList"></ul>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnCrudVoltar">Voltar</button>
      </div>
      ${crudModalState.erro ? `<div class="modal-error">${crudModalState.erro}</div>` : ''}`;
  } else if (crudModalState.step === 'resultado') {
    if (!crudModalState.resultado) {
      html = `<div class="modal-error">${crudModalState.erro || 'Não encontrado.'}</div>
        <div class="modal-actions"><button class="btn-cancel" id="btnCrudVoltar">Voltar</button></div>`;
    } else {
      html = `<h3>Dados Selecionados</h3>
        <div class="modal-summary">
          ${crudModalState.tipo === 'jogo' ?
            `<b>ID:</b> ${crudModalState.resultado.id}<br><b>Título:</b> ${crudModalState.resultado.titulo}` :
            `<b>ID:</b> ${crudModalState.resultado.id}<br><b>Nome:</b> ${crudModalState.resultado.nome}`}
        </div>
        <div class="modal-actions">
          <button class="btn-primary" id="btnCrudConfirmar">Confirmar Seleção</button>
          <button class="btn-cancel" id="btnCrudVoltar">Voltar</button>
        </div>`;
    }
  }
  modalCrudContent.innerHTML = html;
  // Eventos
  if (crudModalState.step === 'init') {
    document.getElementById('btnCrudBuscarId').onclick = () => { crudModalState.step = 'id'; crudModalState.erro = ''; renderModalCrud(); };
    document.getElementById('btnCrudBuscarNome').onclick = () => { crudModalState.step = 'nome'; crudModalState.erro = ''; renderModalCrud(); };
    document.getElementById('btnCrudVoltar').onclick = closeModalCrudFn;
  } else if (crudModalState.step === 'id') {
    document.getElementById('btnCrudPesquisarId').onclick = async () => {
      const id = document.getElementById('crudIdInput').value;
      if (!id || Number(id) < 1) { crudModalState.erro = 'ID inválido.'; renderModalCrud(); return; }
      // Busca por API
      let res;
      try {
        res = await fetch(`${API_URL}/${crudModalState.tipo}/${id}`);
        if (!res.ok) throw new Error('Não encontrado');
        const data = await res.json();
        crudModalState.resultado = data;
        crudModalState.step = 'resultado';
        crudModalState.erro = '';
      } catch {
        crudModalState.resultado = null;
        crudModalState.step = 'resultado';
        crudModalState.erro = 'Não encontrado.';
      }
      renderModalCrud();
    };
    document.getElementById('btnCrudVoltar').onclick = () => { crudModalState.step = 'init'; crudModalState.erro = ''; renderModalCrud(); };
  } else if (crudModalState.step === 'nome') {
    const nomeInput = document.getElementById('crudNomeInput');
    nomeInput.oninput = async () => {
      const nome = nomeInput.value.trim();
      if (!nome) { crudModalState.lista = []; updateNomeList(); return; }
      // Busca por nome (API)
      let res;
      try {
        res = await fetch(`${API_URL}/${crudModalState.tipo}?nome=${encodeURIComponent(nome)}`);
        if (!res.ok) throw new Error('Erro');
        const lista = await res.json();
        crudModalState.lista = Array.isArray(lista) ? lista : [];
      } catch { crudModalState.lista = []; }
      updateNomeList();
    };
    function updateNomeList() {
      const ul = document.getElementById('crudNomeList');
      ul.innerHTML = crudModalState.lista.length ? crudModalState.lista.map(item => `<li data-id="${item.id}">${crudModalState.tipo === 'jogo' ? item.titulo : item.nome}</li>`).join('') : '<li style="color:#aaa;">Nenhum resultado</li>';
      Array.from(ul.querySelectorAll('li[data-id]')).forEach(li => {
        li.onclick = async () => {
          // Busca dados completos
          let res;
          try {
            res = await fetch(`${API_URL}/${crudModalState.tipo}/${li.dataset.id}`);
            if (!res.ok) throw new Error('Não encontrado');
            const data = await res.json();
            crudModalState.resultado = data;
            crudModalState.step = 'resultado';
            crudModalState.erro = '';
            renderModalCrud();
          } catch {
            crudModalState.resultado = null;
            crudModalState.step = 'resultado';
            crudModalState.erro = 'Não encontrado.';
            renderModalCrud();
          }
        };
      });
    }
    updateNomeList();
    document.getElementById('btnCrudVoltar').onclick = () => { crudModalState.step = 'init'; crudModalState.erro = ''; renderModalCrud(); };
  } else if (crudModalState.step === 'resultado') {
    if (crudModalState.resultado) {
      document.getElementById('btnCrudConfirmar').onclick = () => {
        // Fecha modal e retorna para fluxo principal
        closeModalCrudFn();
        // Aqui você pode disparar evento ou callback para informar seleção
        window.dispatchEvent(new CustomEvent('crudSelecionado', { detail: { tipo: crudModalState.tipo, dados: crudModalState.resultado } }));
      };
    }
    document.getElementById('btnCrudVoltar').onclick = () => { crudModalState.step = 'init'; crudModalState.resultado = null; crudModalState.erro = ''; renderModalCrud(); };
  }
}
// --- FLUXO MODAL ALTERAR PARTIDAS ---
function openModalPartidas() {
  partidasModalState = { step: 'selecao', jogo: null, usuario: null, erro: '' };
  modalPartidas.style.display = 'flex';
  renderModalPartidas();
}
function closeModalPartidasFn() {
  modalPartidas.style.display = 'none';
  partidasModalState = { step: 'selecao', jogo: null, usuario: null, erro: '' };
}
closeModalPartidas.onclick = closeModalPartidasFn;
modalPartidas.onclick = e => { if (e.target === modalPartidas) closeModalPartidasFn(); };
function renderModalPartidas() {
  let html = '';
  if (partidasModalState.step === 'selecao') {
    html = `<h3>Alterar Partidas</h3>
      <div class="modal-summary">
        ${partidasModalState.jogo ? `<b>Jogo selecionado:</b> ${partidasModalState.jogo.titulo}<br>` : ''}
        ${partidasModalState.usuario ? `<b>Usuário selecionado:</b> ${partidasModalState.usuario.nome}<br>` : ''}
      </div>
      <div class="modal-actions">
        <button class="btn-primary" id="btnEscolherJogo">Escolher Jogo</button>
        <button class="btn-secondary" id="btnEscolherUsuario">Escolher Usuário</button>
        <button class="btn-cancel" id="btnPartidasVoltar">Voltar</button>
      </div>`;
    if (partidasModalState.jogo && partidasModalState.usuario) {
      html += `<div class="modal-actions"><button class="btn-save" id="btnBuscarPartidas">Buscar Partidas</button></div>`;
    }
  } else if (partidasModalState.step === 'jogo') {
    html = `<h3>Escolher Jogo</h3>
      <input type="text" id="partidasJogoNome" placeholder="Digite o nome do jogo">
      <ul class="modal-list" id="partidasJogoList"></ul>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnPartidasVoltar">Voltar</button>
      </div>`;
  } else if (partidasModalState.step === 'usuario') {
    html = `<h3>Escolher Usuário</h3>
      <input type="text" id="partidasUsuarioNome" placeholder="Digite o nome do usuário">
      <ul class="modal-list" id="partidasUsuarioList"></ul>
      <div class="modal-actions">
        <button class="btn-cancel" id="btnPartidasVoltar">Voltar</button>
      </div>`;
  } else if (partidasModalState.step === 'resumo') {
    html = `<h3>Resumo</h3>
      <div class="modal-summary">
        <b>Jogo:</b> ${partidasModalState.jogo.titulo}<br>
        <b>Usuário:</b> ${partidasModalState.usuario.nome}
      </div>
      <div class="modal-actions">
        <button class="btn-save" id="btnBuscarPartidas">Buscar Partidas</button>
        <button class="btn-cancel" id="btnPartidasVoltar">Voltar</button>
      </div>`;
  }
  modalPartidasContent.innerHTML = html;
  // Eventos
  if (partidasModalState.step === 'selecao') {
    document.getElementById('btnEscolherJogo').onclick = () => { partidasModalState.step = 'jogo'; renderModalPartidas(); };
    document.getElementById('btnEscolherUsuario').onclick = () => { partidasModalState.step = 'usuario'; renderModalPartidas(); };
    document.getElementById('btnPartidasVoltar').onclick = () => {
      // Limpa seleção do Jogo/Usuário conforme contexto
      if (partidasModalState.jogo && !partidasModalState.usuario) { partidasModalState.jogo = null; }
      else if (!partidasModalState.jogo && partidasModalState.usuario) { partidasModalState.usuario = null; }
      else { closeModalPartidasFn(); }
      renderModalPartidas();
    };
    if (partidasModalState.jogo && partidasModalState.usuario) {
      document.getElementById('btnBuscarPartidas').onclick = () => {
        partidasModalState.step = 'resumo';
        renderModalPartidas();
      };
    }
  } else if (partidasModalState.step === 'jogo') {
    const nomeInput = document.getElementById('partidasJogoNome');
    nomeInput.oninput = async () => {
      const nome = nomeInput.value.trim();
      let lista = [];
      if (nome) {
        try {
          const res = await fetch(`${API_URL}/jogo?nome=${encodeURIComponent(nome)}`);
          if (res.ok) lista = await res.json();
        } catch {}
      }
      const ul = document.getElementById('partidasJogoList');
      ul.innerHTML = lista.length ? lista.map(j => `<li data-id="${j.id}">${j.titulo}</li>`).join('') : '<li style="color:#aaa;">Nenhum resultado</li>';
      Array.from(ul.querySelectorAll('li[data-id]')).forEach(li => {
        li.onclick = async () => {
          try {
            const res = await fetch(`${API_URL}/jogo/${li.dataset.id}`);
            if (!res.ok) throw new Error();
            const jogo = await res.json();
            partidasModalState.jogo = jogo;
            partidasModalState.step = 'selecao';
            renderModalPartidas();
          } catch {}
        };
      });
    };
    document.getElementById('btnPartidasVoltar').onclick = () => { partidasModalState.step = 'selecao'; renderModalPartidas(); };
    nomeInput.oninput();
  } else if (partidasModalState.step === 'usuario') {
    const nomeInput = document.getElementById('partidasUsuarioNome');
    nomeInput.oninput = async () => {
      const nome = nomeInput.value.trim();
      let lista = [];
      if (nome) {
        try {
          const res = await fetch(`${API_URL}/usuario?nome=${encodeURIComponent(nome)}`);
          if (res.ok) lista = await res.json();
        } catch {}
      }
      const ul = document.getElementById('partidasUsuarioList');
      ul.innerHTML = lista.length ? lista.map(u => `<li data-id="${u.id}">${u.nome}</li>`).join('') : '<li style="color:#aaa;">Nenhum resultado</li>';
      Array.from(ul.querySelectorAll('li[data-id]')).forEach(li => {
        li.onclick = async () => {
          try {
            const res = await fetch(`${API_URL}/usuario/${li.dataset.id}`);
            if (!res.ok) throw new Error();
            const usuario = await res.json();
            partidasModalState.usuario = usuario;
            partidasModalState.step = 'selecao';
            renderModalPartidas();
          } catch {}
        };
      });
    };
    document.getElementById('btnPartidasVoltar').onclick = () => { partidasModalState.step = 'selecao'; renderModalPartidas(); };
    nomeInput.oninput();
  } else if (partidasModalState.step === 'resumo') {
    document.getElementById('btnBuscarPartidas').onclick = () => {
      // Aqui você pode disparar evento ou callback para buscar partidas
      window.dispatchEvent(new CustomEvent('partidasSelecionadas', { detail: { jogo: partidasModalState.jogo, usuario: partidasModalState.usuario } }));
      closeModalPartidasFn();
    };
    document.getElementById('btnPartidasVoltar').onclick = () => { partidasModalState.step = 'selecao'; renderModalPartidas(); };
  }
}
// Exemplo de como abrir os modais (substitua pelos seus gatilhos reais)
window.openModalCrud = openModalCrud;
window.openModalPartidas = openModalPartidas;
