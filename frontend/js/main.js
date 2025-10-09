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
  renderAdminActions(); // Sempre tenta renderizar ações de admin
}

// Mostra o botão de admin se o usuário for admin
function renderAdminActions() {
  const adminActions = document.getElementById('admin-actions');
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (user && user.isAdmin) {
    adminActions.innerHTML = `<button id="btn-admin" class="admin-btn">Painel do Administrador</button>`;
  } else {
    adminActions.innerHTML = '';
  }
}

// Evento para botão do admin (header)
function setupAdminBtn() {
  document.getElementById('admin-actions').addEventListener('click', function(e) {
    if (e.target && e.target.id === 'btn-admin') {
      window.location.href = '/frontend/html/admin.html';
    }
  });
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
    renderProfileAdminBtn(user); // Chama aqui para mostrar o botão do admin no modal
  }
}

// Renderiza o botão admin dentro do modal de perfil, se for admin
function renderProfileAdminBtn(user) {
  const wrap = document.getElementById('profile-admin-btn-wrap');
  if (user && user.isAdmin) {
    wrap.innerHTML = `<button id="btn-admin-profile" class="admin-btn">Painel do Administrador</button>`;
    document.getElementById('btn-admin-profile').onclick = function() {
      window.location.href = '/frontend/html/admin.html';
    }
  } else {
    wrap.innerHTML = '';
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
    window.location.href = '/frontend/html/login.html'; // Redireciona para a tela de login
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

// Redireciona para a página de rankings.html ao clicar no botão Ranking dos Jogos
function abrirRanking() {
  window.location.href = '/frontend/html/rankings.html';
}

// Eventos dos botões do header para ranking
function setupHeaderBtns() {
  const btnRanking = document.getElementById('btn-ranking');
  if (btnRanking) {
    btnRanking.addEventListener('click', abrirRanking);
  }
  // Removido o botão fechar do ranking-modal pois modal foi removido
}

// Botões dos jogos
function setupGameBtns() {
  document.getElementById('btn-velha').onclick = function() {
    entrarNoJogoSeNaoBloqueado('Jogo da Velha', '/frontend/html/velha.html');
  };
  document.getElementById('btn-ppt').onclick = function() {
    entrarNoJogoSeNaoBloqueado('PPT', '/frontend/html/ppt.html');
  };
  document.getElementById('btn-forca').onclick = function() {
    entrarNoJogoSeNaoBloqueado('Forca', '/frontend/html/forca.html');
  };
  document.getElementById('btn-memoria').onclick = function() {
    entrarNoJogoSeNaoBloqueado('Memória', '/frontend/html/memoria.html');
  };
  document.getElementById('btn-campo-minado').onclick = function() {
    entrarNoJogoSeNaoBloqueado('Campo Minado', '/frontend/html/campo_minado.html');
  };
  document.getElementById('btn-pong').onclick = function() {
    entrarNoJogoSeNaoBloqueado('Pong', '/frontend/html/pong.html');
  };
  document.getElementById('btn-2048').onclick = function() {
    entrarNoJogoSeNaoBloqueado('2048', '/frontend/html/2048.html');
  };
  document.getElementById('btn-sudoku').onclick = function() {
    entrarNoJogoSeNaoBloqueado('Sudoku', '/frontend/html/sudoku.html');
  };
}

// Botão estatísticas
function setupEstatisticasBtn() {
  document.getElementById('btn-estatisticas').onclick = () => window.location.href = '/frontend/html/estatisticas.html';
}

// Redireciona para login.html
function irParaLogin() {
  window.location.href = '/frontend/html/login.html';
}

// Inicialização de tudo
document.addEventListener('DOMContentLoaded', async () => {
  await checkUserBlocked();
  startBlockedUserPolling();
  renderUserActions();
  setupUserActionsEvents();
  setupHeaderBtns();
  setupProfileModalCloseOnClickOutside();
  setupLogoutBtn();
  setupGameBtns();
  setupEstatisticasBtn();
  setupAdminBtn();
});