// Utilitário global para checar se o usuário está bloqueado
// Chame checkUserBlocked() no início de cada página

const API_URL = window.API_URL || "http://localhost:3001";


// Exibe mensagem de bloqueio antes de redirecionar
function showBlockedMessageAndRedirect() {
  // Cria overlay de bloqueio
  let overlay = document.getElementById('blocked-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'blocked-overlay';
    overlay.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(30,30,30,0.92);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:1.3em;';
    overlay.innerHTML = `
      <div style="background:#222;padding:32px 36px;border-radius:12px;box-shadow:0 2px 24px #0008;text-align:center;max-width:90vw;">
        <i class='fa fa-ban' style='font-size:2.5em;color:#e53935;margin-bottom:12px;'></i><br>
        <b>Seu acesso foi bloqueado!</b><br><br>
        Você não pode utilizar o sistema no momento.<br>
        Caso ache que isso é um erro, entre em contato com o administrador.<br><br>
        <span style='font-size:0.95em;color:#ffb4b4;'>Você será redirecionado para o login em instantes...</span>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  setTimeout(() => {
    window.location.href = 'login.html?blocked=1';
  }, 2200);
}

async function checkUserBlocked(options = { redirect: true }) {
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (!user || !user.email) return false;
  try {
    // Usa nova rota pública para checar status do usuário
    const url = (typeof window !== 'undefined' && window.API_URL) ? window.API_URL : API_URL;
    const res = await fetch(`${url}/user/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });
    if (res.status === 404) return false;
    if (!res.ok) throw new Error('Erro na requisição: ' + res.status);
    const data = await res.json();
    if (data.status === 'bloqueado') {
      sessionStorage.clear();
      localStorage.clear();
      if (options.redirect) {
        showBlockedMessageAndRedirect();
      }
      return true;
    }
  } catch (e) {
    // Se der erro, não bloqueia, só loga
    console.warn('Falha ao checar bloqueio do usuário:', e);
  }
  return false;
}

// Polling para expulsar usuário bloqueado enquanto navega
function startBlockedUserPolling(intervalMs = 10000) {
  setInterval(() => checkUserBlocked({ redirect: true }), intervalMs);
}
