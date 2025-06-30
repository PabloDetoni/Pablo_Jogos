// Atualiza o botão do canto direito do header entre "Logar" (guest) e "Perfil" (logado)
function renderUserActions() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  const userActions = document.getElementById('user-actions');
  if (sessionStorage.getItem('guest') === 'true') {
    userActions.innerHTML = `<button id="btn-logar">Logar</button>`;
  } else if (user && user.nome) {
    userActions.innerHTML = `<button id="btn-perfil">${user.nome.split(' ')[0]}</button>`;
  } else {
    userActions.innerHTML = `<button id="btn-logar">Logar</button>`;
  }
}

// Eventos dos botões de login/perfil no header
function setupUserActionsEvents() {
  document.getElementById('user-actions').addEventListener('click', function(e) {
    if (e.target && e.target.id === 'btn-logar') {
      irParaLogin();
    }
    if (e.target && e.target.id === 'btn-perfil') {
      abrirPerfil();
    }
  });
}

// Modal Perfil
function abrirPerfil() {
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (user) {
    document.getElementById('profile-nome').textContent = user.nome;
    document.getElementById('profile-email').textContent = user.email || '';
    document.getElementById('profile-modal').classList.add('show');
  }
}

function fecharPerfil() {
  document.getElementById('profile-modal').classList.remove('show');
}

// Botão Sair do Modal Perfil
function setupLogoutBtn() {
  document.getElementById('logout-btn').addEventListener('click', function() {
    sessionStorage.clear();
    localStorage.clear();
    location.reload();
  });
}

// Fecha o modal de perfil ao clicar fora dele
function setupProfileModalCloseOnClickOutside() {
  document.addEventListener('mousedown', function(event) {
    const modal = document.getElementById('profile-modal');
    const userBtn = document.querySelector('#btn-perfil');
    if (
      modal.classList.contains('show') &&
      !modal.contains(event.target) &&
      event.target !== userBtn
    ) {
      fecharPerfil();
    }
  });
}

// Modal Ranking dos Jogos
function abrirRanking() {
  document.getElementById('ranking-modal').classList.add('show');
  // Exemplo para preencher o ranking
  // Aqui você pode buscar do backend ou API
  document.getElementById('ranking-list').innerHTML = "<em>Ranking ainda não implementado.</em>";
}

function fecharRanking() {
  document.getElementById('ranking-modal').classList.remove('show');
}

// Eventos dos botões do header para os modais
function setupHeaderBtns() {
  document.getElementById('btn-ranking').addEventListener('click', abrirRanking);
  document.getElementById('fechar-ranking-btn').addEventListener('click', fecharRanking);
}

// Botões dos jogos
function setupGameBtns() {
  document.getElementById('btn-velha').onclick = () => window.location.href = 'velha.html';
  document.getElementById('btn-ppt').onclick = () => window.location.href = 'ppt.html';
  document.getElementById('btn-forca').onclick = () => window.location.href = 'forca.html';
  document.getElementById('btn-memoria').onclick = () => window.location.href = 'memoria.html';
  document.getElementById('btn-campo-minado').onclick = () => window.location.href = 'campo_minado.html';
  document.getElementById('btn-pong').onclick = () => window.location.href = 'pong.html';
  document.getElementById('btn-2048').onclick = () => window.location.href = '2048.html';
  document.getElementById('btn-sudoku').onclick = () => window.location.href = 'sudoku.html';
}

// Botão estatísticas
function setupEstatisticasBtn() {
  document.getElementById('btn-estatisticas').onclick = () => window.location.href = 'estatisticas.html';
}

// Redireciona para login.html
function irParaLogin() {
  window.location.href = 'login.html';
}

// Inicialização de tudo
document.addEventListener('DOMContentLoaded', () => {
  renderUserActions();
  setupUserActionsEvents();
  setupHeaderBtns();
  setupProfileModalCloseOnClickOutside();
  setupLogoutBtn();
  setupGameBtns();
  setupEstatisticasBtn();
});