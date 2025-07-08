// Utilidades para mostrar/esconder formulários de login e registro
function showLoginForm() {
  hideForms();
  document.getElementById('login-form').style.display = 'flex';
}
function showRegisterForm() {
  hideForms();
  document.getElementById('register-form').style.display = 'flex';
}
function hideForms() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  clearErrors();
}

// Limpa mensagens de erro
function clearErrors() {
  document.getElementById('login-error').style.display = 'none';
  document.getElementById('login-error').textContent = '';
  document.getElementById('register-error').style.display = 'none';
  document.getElementById('register-error').textContent = '';
}

// Impede o usuário de digitar mais de 20 caracteres no nome ao registrar
document.addEventListener('DOMContentLoaded', () => {
  hideForms();
  clearErrors();
  const nameInput = document.getElementById('register-name');
  if (nameInput) {
    nameInput.maxLength = 20; // HTML5 já impede, mas vamos garantir no JS também
    nameInput.addEventListener('input', function () {
      if (this.value.length > 20) {
        this.value = this.value.slice(0, 20);
      }
    });
  }

  // Se quiser mostrar o login por padrão:
  showLoginForm();
});

// Função de login
async function login(event) {
  event.preventDefault();
  clearErrors();

  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;

  try {
    const res = await fetch(getApiUrl('/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
      credentials: 'include'
    });
    const data = await res.json();

    // Agora o backend retorna user: {nome, email, isAdmin}
    if (data.success && data.user) {
      sessionStorage.setItem('user', JSON.stringify({ 
        nome: data.user.nome, 
        email: data.user.email, 
        isAdmin: data.user.isAdmin // <- ESSENCIAL PARA FUNCIONAR O BOTÃO DO ADMIN!
      }));
      sessionStorage.removeItem('guest');
      window.location.href = '/Visual/index.html';
    } else {
      document.getElementById('login-error').textContent = data.message || 'Credenciais inválidas';
      document.getElementById('login-error').style.display = 'block';
    }
  } catch (error) {
    alert('Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.');
  }
}

// Função de registro
async function register(event) {
  event.preventDefault();
  clearErrors();

  const nome = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const senha = document.getElementById('register-password').value;
  const confirmar = document.getElementById('register-confirm').value;

  // Validação de nome de usuário
  if (nome.length === 0) {
    alert('Por favor, digite um nome de usuário.');
    document.getElementById('register-error').textContent = 'O nome de usuário é obrigatório.';
    document.getElementById('register-error').style.display = 'block';
    return;
  }
  if (nome.length > 20) {
    alert('O nome de usuário pode ter no máximo 20 caracteres.');
    document.getElementById('register-error').textContent = 'O nome de usuário pode ter no máximo 20 caracteres.';
    document.getElementById('register-error').style.display = 'block';
    return;
  }

  // Validação de senha
  if (senha.length < 8 || senha.length > 20) {
    alert('A senha deve ter entre 8 e 20 caracteres.');
    document.getElementById('register-error').textContent = 'A senha deve ter entre 8 e 20 caracteres.';
    document.getElementById('register-error').style.display = 'block';
    return;
  }

  if (senha !== confirmar) {
    alert('As senhas não coincidem!');
    document.getElementById('register-error').textContent = 'As senhas não coincidem!';
    document.getElementById('register-error').style.display = 'block';
    return;
  }

  try {
    const res = await fetch(getApiUrl('/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha }),
      credentials: 'include'
    });
    const data = await res.json();

    // Agora o backend retorna user: {nome, email, isAdmin}
    if (data.success && data.user) {
      sessionStorage.setItem('user', JSON.stringify({ 
        nome: data.user.nome, 
        email: data.user.email, 
        isAdmin: data.user.isAdmin // <- ESSENCIAL
      }));
      sessionStorage.removeItem('guest');
      window.location.href = '/Visual/index.html';
    } else {
      document.getElementById('register-error').textContent = data.message || 'Erro ao registrar';
      document.getElementById('register-error').style.display = 'block';
    }
  } catch (error) {
    alert('Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.');
  }
}

// Função para entrar como convidado
function loginAsGuest() {
  sessionStorage.setItem('guest', 'true');
  sessionStorage.removeItem('user');
  window.location.href = '/Visual/index.html';
}

// Função utilitária para garantir que o endpoint bate com o host do frontend (localhost ou 127.0.0.1)
function getApiUrl(path) {
  // Captura o host do frontend (localhost:5500 OU 127.0.0.1:5500)
  const host = window.location.hostname;
  return `http://${host}:3001${path}`;
}