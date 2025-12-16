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

// Função utilitária para checar bloqueio antes de entrar no jogo
function entrarNoJogoSeNaoBloqueado(nomeJogo, urlDestino) {
  fetch('http://localhost:3001/game/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: nomeJogo })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.bloqueado) {
      alert('Este jogo está bloqueado pelo administrador.');
    } else {
      window.location.href = urlDestino;
    }
  })
  .catch(() => {
    alert('Erro ao verificar status do jogo.');
  });
}
window.entrarNoJogoSeNaoBloqueado = entrarNoJogoSeNaoBloqueado;

// Utility to get current logged user's name (used by rankings.js)
function getNomeUsuario() {
  try {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user && user.nome) return user.nome;
    // If the session is a guest, return a placeholder
    if (sessionStorage.getItem('guest')) return 'Convidado';
    return null;
  } catch (e) {
    return null;
  }
}
window.getNomeUsuario = getNomeUsuario;

// Envia partida para o backend — gera match_id único, valida localmente, trata respostas
async function enviarPartidaSeguro(partida) {
  const apiBase = (window.API_URL || 'http://localhost:3001');
  try {
    // Normaliza usuário
    const usuario = partida.usuario || partida.nome || 'Convidado';
    const jogo = partida.jogo || partida.game || '';

    // Validar partida antes de prosseguir
    const validation = validatePartida(Object.assign({}, partida, { usuario }));
    if (!validation.valid) {
      console.warn('[enviarPartidaSeguro] Partida inválida, não será enviada:', validation.errors, partida);
      return { invalid: true, errors: validation.errors };
    }

    // Gera match_id único para esta partida (UUID)
    const now = Date.now();
    const match_id = partida.match_id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m_${now}_${Math.random().toString(36).slice(2,9)}`);

    // Normaliza payload para o servidor
    const payload = Object.assign({}, partida, { usuario });
    if (!payload.data) payload.data = new Date().toISOString();

    // Insere match_id dentro do campo dados
    let dados = {};
    try {
      if (payload.dados && typeof payload.dados === 'object') dados = Object.assign({}, payload.dados);
      else if (payload.dados) {
        try { dados = JSON.parse(payload.dados); } catch(e) { dados = { raw: payload.dados }; }
      }
    } catch(e) { dados = {}; }
    dados.match_id = match_id;
    payload.dados = dados;

    // Envia para o servidor
    const res = await fetch(`${apiBase}/api/partida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json().catch(() => null);

    // Trata respostas conforme especificação
    if (res.status === 201) {
      console.log('[enviarPartidaSeguro] Partida criada com sucesso:', json);
      return { inserted: true, partida: json?.partida || json };
    }
    if (res.status === 200 && json?.duplicated) {
      console.log('[enviarPartidaSeguro] Partida duplicada (match_id já existe):', json);
      return { duplicated: true, reason: json.reason, partida: json.partida };
    }
    if (res.status === 400) {
      console.warn('[enviarPartidaSeguro] Payload inválido:', json);
      return { invalid: true, error: json?.error, details: json?.details };
    }
    // 500 ou outro
    console.error('[enviarPartidaSeguro] Erro no servidor:', res.status, json);
    return { error: true, status: res.status, message: json?.error };
  } catch (e) {
    console.error('[enviarPartidaSeguro] Falha ao enviar partida:', e);
    return { error: true, message: e.message };
  }
}
window.enviarPartidaSeguro = enviarPartidaSeguro;

// Simple per-game validation using a declarative schema map
function getGameSchema(jogo) {
  if (!jogo) return null;
  const key = jogo.toString().toLowerCase();
  if (key.includes('velha')) return { required: ['resultado'], types: { resultado: 'string' } };
  if (key.includes('forca')) return { required: ['resultado'], types: { resultado: 'string' }, optional: { erros: 'number', dificuldade: 'string' } };
  if (key.includes('memoria') || key.includes('memória')) return { required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', erros: 'number', dificuldade: 'string' } };
  if (key === 'ppt' || key.includes('pedra') || key.includes('p.p.t')) return { required: ['resultado'], types: { resultado: 'string' } };
  if (key.includes('2048')) return { required: ['pontuacao'], types: { pontuacao: 'number' } };
  if (key.includes('sudoku')) return { required: ['resultado','tempo'], types: { resultado: 'string', tempo: 'number' }, optional: { erros: 'number', dificuldade: 'string' } };
  if (key.includes('pong')) return { required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', dificuldade: 'string' } };
  if (key.includes('campo') && key.includes('minado')) return { required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', dificuldade: 'string' } };
  // default permissive schema: require at least resultado or pontuacao or tempo
  return { requiredAny: ['resultado','pontuacao','tempo'] };
}

function validatePartida(partida) {
  const errors = [];
  if (!partida || typeof partida !== 'object') return { valid: false, errors: ['Partida inválida'] };
  const jogo = (partida.jogo || partida.game || '').toString();
  const schema = getGameSchema(jogo);
  if (!schema) return { valid: true, errors: [] };

  // helper to check type
  const checkType = (val, expected) => {
    if (val == null) return false;
    if (expected === 'number') return typeof val === 'number' && !isNaN(val);
    if (expected === 'string') return typeof val === 'string' && val.length > 0;
    return true;
  };

  if (schema.required) {
    for (const f of schema.required) {
      const v = partida[f];
      if (v === undefined || v === null) {
        errors.push(`Campo obrigatório ausente: ${f}`);
        continue;
      }
      const expected = schema.types && schema.types[f];
      if (expected && !checkType(v, expected)) errors.push(`Tipo inválido para ${f}: esperado ${expected}`);
    }
  }
  if (schema.requiredAny) {
    const anyOk = schema.requiredAny.some(f => partida[f] !== undefined && partida[f] !== null);
    if (!anyOk) errors.push(`Pelo menos um dos campos deve estar presente: ${schema.requiredAny.join(',')}`);
  }
  if (schema.types) {
    for (const k of Object.keys(schema.types)) {
      const expected = schema.types[k];
      if (partida[k] !== undefined && partida[k] !== null && !checkType(partida[k], expected)) {
        errors.push(`Tipo inválido para ${k}: esperado ${expected}`);
      }
    }
  }
  if (schema.optional) {
    for (const [k, expected] of Object.entries(schema.optional)) {
      if (partida[k] !== undefined && partida[k] !== null && !checkType(partida[k], expected)) {
        errors.push(`Tipo inválido para ${k}: esperado ${expected}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
window.validatePartida = validatePartida;

// Ajusta adicionarPontuacaoRanking para usar enviarPartidaSeguro
async function adicionarPontuacaoRanking(jogo, nome, opts = {}) {
  const partida = {
    jogo: jogo,
    usuario: nome,
    dificuldade: opts.dificuldade || null,
    pontuacao: null,
    tempo: null,
    erros: opts.erros ?? null,
    resultado: null,
    data: new Date().toISOString()
  };

  const tipo = (opts.tipo || '').toString().toLowerCase();
  if (tipo === 'pontuacao') {
    partida.pontuacao = typeof opts.valor === 'number' ? opts.valor : (opts.valor ? Number(opts.valor) : null);
  } else if (tipo.includes('vitoria') || tipo.includes('mais_vitorias')) {
    partida.resultado = 'vitoria';
  } else if (tipo === 'menor_tempo' || tipo.includes('tempo')) {
    partida.tempo = typeof opts.tempo === 'number' ? opts.tempo : (opts.tempo ? Number(opts.tempo) : null);
    if (opts.venceu || opts.valor > 0) partida.resultado = 'vitoria';
  } else if (opts.venceu === true) {
    partida.resultado = 'vitoria';
  }

  const hasMeaningful = partida.resultado || partida.pontuacao !== null || partida.tempo !== null || partida.erros !== null;
  if (!hasMeaningful) return;

  await enviarPartidaSeguro(partida);
}
window.adicionarPontuacaoRanking = adicionarPontuacaoRanking;

