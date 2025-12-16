// rankings.js - Sistema de Rankings (Página pública)
// Exibe apenas: Ranking + Troféus
// Fonte única: tabela partida via GET /api/partida

const API_BASE = window.API_URL || 'http://localhost:3001';

// ==================== CACHE ====================
let partidasCache = null;
let partidasCacheTime = 0;
const CACHE_TTL = 30000;
let usuariosCache = null;

// ==================== CONFIGURAÇÃO DOS JOGOS ====================
const jogosRanking = [
  {
    chave: "Jogo da Velha",
    nome: "Jogo da Velha",
    aliases: ["velha", "jogo da velha", "tic tac toe"],
    dificuldades: ["Fácil", "Médio"],
    schema: { required: ['resultado'] },
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas", porDificuldade: true, colunas: ["Sequência"] }
    ]
  },
  {
    chave: "PPT",
    nome: "Pedra Papel Tesoura",
    aliases: ["ppt", "pedra papel tesoura"],
    dificuldades: [],
    schema: { required: ['resultado'] },
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas", colunas: ["Sequência"] }
    ]
  },
  {
    chave: "Forca",
    nome: "Forca",
    aliases: ["forca", "hangman"],
    dificuldades: ["Fácil", "Médio", "Difícil"],
    schema: { required: ['resultado'] },
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas", porDificuldade: true, colunas: ["Sequência"] }
    ]
  },
  {
    chave: "2048",
    nome: "2048",
    aliases: ["2048"],
    dificuldades: [],
    schema: { required: ['pontuacao'] },
    tipos: [
      { chave: "pontuacao", label: "Maior pontuação", colunas: ["Pontuação"] }
    ]
  },
  {
    chave: "Memória",
    nome: "Memória",
    aliases: ["memoria", "memória", "memory"],
    dificuldades: ["Fácil", "Médio", "Difícil"],
    schema: { required: ['resultado'] },
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo", "Erros"] }
    ]
  },
  {
    chave: "Sudoku",
    nome: "Sudoku",
    aliases: ["sudoku"],
    dificuldades: ["Fácil", "Médio", "Difícil", "Muito Difícil"],
    schema: { required: ['resultado', 'tempo'] },
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo", "Erros"] }
    ]
  },
  {
    chave: "Pong",
    nome: "Pong",
    aliases: ["pong"],
    dificuldades: ["Fácil", "Médio", "Difícil"],
    schema: { required: ['resultado'] },
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] }
    ]
  },
  {
    chave: "Campo Minado",
    nome: "Campo Minado",
    aliases: ["campo minado", "minesweeper"],
    dificuldades: ["Fácil", "Médio", "Difícil"],
    schema: { required: ['resultado'] },
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo"] }
    ]
  }
];

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Rankings] Inicializando...');
  
  if (typeof checkUserBlocked === 'function') await checkUserBlocked();
  if (typeof startBlockedUserPolling === 'function') startBlockedUserPolling();
  
  await inicializarRankings();
  await carregarTrofeus();
});

// ==================== HELPERS ====================
function normalizeString(s) {
  if (!s && s !== 0) return '';
  return s.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '').trim();
}

function matchJogo(jogoConfig, titulo) {
  if (!titulo) return false;
  const tituloNorm = normalizeString(titulo);
  if (normalizeString(jogoConfig.chave) === tituloNorm) return true;
  if (jogoConfig.aliases) {
    for (const alias of jogoConfig.aliases) {
      const aliasNorm = normalizeString(alias);
      if (aliasNorm === tituloNorm) return true;
      if (tituloNorm.includes(aliasNorm)) return true;
      if (aliasNorm.includes(tituloNorm) && tituloNorm.length > 2) return true;
    }
  }
  return false;
}

function matchDificuldade(filtro, partida) {
  if (!filtro) return true;
  if (!partida) return false;
  return normalizeString(filtro) === normalizeString(partida);
}

function parseData(p) {
  const d = p.data || p.created_at;
  return d ? new Date(d).getTime() : 0;
}

function formatarTempo(segundos) {
  if (segundos === null || segundos === undefined || isNaN(segundos)) return '-';
  const mins = Math.floor(segundos / 60);
  const secs = Math.floor(segundos % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function isPartidaValida(partida, jogoConfig) {
  if (!partida) return false;
  if (!jogoConfig || !jogoConfig.schema) return true;
  const schema = jogoConfig.schema;
  if (schema.required) {
    for (const campo of schema.required) {
      const valor = partida[campo];
      if (valor === undefined || valor === null || valor === '') return false;
      if (campo === 'pontuacao' && isNaN(Number(valor))) return false;
      if (campo === 'tempo' && isNaN(Number(valor))) return false;
    }
  }
  return true;
}

// ==================== BUSCA DE DADOS ====================
async function buscarPartidas(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && partidasCache && (now - partidasCacheTime) < CACHE_TTL) {
    return partidasCache;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/partida?limit=10000`);
    if (!res.ok) throw new Error('Erro ao buscar partidas');
    const data = await res.json();
    
    let rows = [];
    if (Array.isArray(data)) rows = data;
    else if (data.partidas) rows = data.partidas;
    else if (data.rows) rows = data.rows;
    
    partidasCache = rows.map(p => ({
      ...p,
      tempo: p.tempo != null && p.tempo !== '' ? Number(p.tempo) : null,
      pontuacao: p.pontuacao != null && p.pontuacao !== '' ? Number(p.pontuacao) : null,
      erros: p.erros != null && p.erros !== '' ? Number(p.erros) : null,
      usuario_nome: p.usuario_nome || p.nome || p.usuario || 'Desconhecido',
      jogo_titulo: p.jogo_titulo || p.titulo || p.jogo || 'Desconhecido'
    }));
    partidasCacheTime = now;
    console.log('[Rankings] Partidas carregadas:', partidasCache.length);
    return partidasCache;
  } catch (e) {
    console.error('[Rankings] Erro ao buscar partidas:', e);
    return [];
  }
}

async function buscarUsuarios() {
  if (usuariosCache) return usuariosCache;
  try {
    const res = await fetch(`${API_BASE}/usuario`);
    if (!res.ok) throw new Error('Erro ao buscar usuários');
    const data = await res.json();
    let rows = Array.isArray(data) ? data : (data.usuarios || data.rows || []);
    
    usuariosCache = {};
    for (const u of rows) {
      usuariosCache[u.nome] = { status: u.status || 'ativo', id: u.id, nome: u.nome };
    }
    console.log('[Rankings] Usuários carregados:', Object.keys(usuariosCache).length);
    return usuariosCache;
  } catch (e) {
    console.warn('[Rankings] Erro ao buscar usuários:', e);
    return {};
  }
}

async function buscarTrofeus() {
  try {
    const res = await fetch(`${API_BASE}/trophy`);
    if (!res.ok) return [];
    const data = await res.json();
    let rows = Array.isArray(data) ? data : (data.trofeus || data.rows || []);
    console.log('[Rankings] Troféus carregados:', rows.length);
    return rows;
  } catch (e) {
    console.error('[Rankings] Erro ao buscar troféus:', e);
    return [];
  }
}

// ==================== RANKING ====================
async function inicializarRankings() {
  const jogoSelect = document.getElementById('jogo-select');
  const tipoRanking = document.getElementById('tipo-ranking');
  
  if (!jogoSelect || !tipoRanking) {
    console.warn('[Rankings] Elementos de ranking não encontrados');
    return;
  }
  
  jogoSelect.innerHTML = jogosRanking.map((j, i) => `<option value="${i}">${j.nome}</option>`).join('');
  
  jogoSelect.onchange = () => { atualizarTiposRanking(); carregarRanking(); };
  tipoRanking.onchange = carregarRanking;
  
  atualizarTiposRanking();
  await carregarRanking();
}

function atualizarTiposRanking() {
  const jogoSelect = document.getElementById('jogo-select');
  const tipoRanking = document.getElementById('tipo-ranking');
  const idx = Number(jogoSelect.value);
  const jogo = jogosRanking[idx];
  
  if (!jogo || !jogo.tipos || !jogo.tipos.length) {
    tipoRanking.innerHTML = '<option value="-1">(Sem ranking)</option>';
    return;
  }
  tipoRanking.innerHTML = jogo.tipos.map((t, i) => `<option value="${i}">${t.label}</option>`).join('');
}

async function carregarRanking() {
  const jogoSelect = document.getElementById('jogo-select');
  const tipoRanking = document.getElementById('tipo-ranking');
  const container = document.getElementById('rankings-container');
  if (!container) return;
  
  const jogoIdx = Number(jogoSelect.value);
  const tipoIdx = Number(tipoRanking.value);
  const jogo = jogosRanking[jogoIdx];
  
  if (!jogo || tipoIdx < 0 || !jogo.tipos[tipoIdx]) {
    container.innerHTML = '<div class="ranking-section"><em>Selecione um tipo de ranking válido.</em></div>';
    return;
  }
  
  const tipo = jogo.tipos[tipoIdx];
  container.innerHTML = '<div class="ranking-section"><em>Carregando ranking...</em></div>';
  
  try {
    const [partidas, usuarios] = await Promise.all([buscarPartidas(), buscarUsuarios()]);
    
    let partidasDoJogo = partidas.filter(p => matchJogo(jogo, p.jogo_titulo));
    partidasDoJogo = partidasDoJogo.filter(p => isPartidaValida(p, jogo));
    
    console.log(`[Rankings] ${jogo.nome}: ${partidasDoJogo.length} partidas válidas`);
    
    let html = '';
    
    if (tipo.porDificuldade && jogo.dificuldades.length > 0) {
      for (const dificuldade of jogo.dificuldades) {
        const partidasDaDificuldade = partidasDoJogo.filter(p => matchDificuldade(dificuldade, p.dificuldade));
        const ranking = calcularRanking(partidasDaDificuldade, tipo.chave, usuarios);
        html += montarTabelaRanking(jogo.nome, tipo, ranking, dificuldade);
      }
    } else {
      const ranking = calcularRanking(partidasDoJogo, tipo.chave, usuarios);
      html += montarTabelaRanking(jogo.nome, tipo, ranking);
    }
    
    container.innerHTML = html || '<div class="ranking-section"><em>Sem dados para exibir.</em></div>';
    
  } catch (e) {
    console.error('[Rankings] Erro ao carregar ranking:', e);
    container.innerHTML = '<div class="ranking-section"><em>Erro ao carregar ranking.</em></div>';
  }
}

// ==================== CÁLCULO DE RANKINGS ====================
function calcularRanking(partidas, tipoChave, usuarios) {
  if (!partidas.length) return [];
  
  const porUsuario = new Map();
  for (const p of partidas) {
    const nome = p.usuario_nome;
    if (!porUsuario.has(nome)) porUsuario.set(nome, []);
    porUsuario.get(nome).push(p);
  }
  
  const resultado = [];
  
  switch (tipoChave) {
    case 'pontuacao': {
      for (const [nome, partidasUser] of porUsuario.entries()) {
        const comPontuacao = partidasUser.filter(p => p.pontuacao !== null && !isNaN(p.pontuacao));
        if (!comPontuacao.length) continue;
        const melhor = comPontuacao.reduce((max, p) => (p.pontuacao > max ? p.pontuacao : max), -Infinity);
        if (melhor !== -Infinity) {
          const userInfo = usuarios[nome] || {};
          resultado.push({ nome, valor: melhor, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    case 'menor_tempo': {
      for (const [nome, partidasUser] of porUsuario.entries()) {
        const validas = partidasUser.filter(p => 
          p.tempo !== null && !isNaN(p.tempo) &&
          (p.resultado || '').toString().toLowerCase() === 'vitoria'
        );
        if (!validas.length) continue;
        
        validas.sort((a, b) => {
          const ea = a.erros == null ? Infinity : a.erros;
          const eb = b.erros == null ? Infinity : b.erros;
          if (ea !== eb) return ea - eb;
          return (a.tempo || Infinity) - (b.tempo || Infinity);
        });
        
        const melhor = validas[0];
        const userInfo = usuarios[nome] || {};
        resultado.push({ nome, tempo: melhor.tempo, erros: melhor.erros, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
      }
      resultado.sort((a, b) => {
        const ea = a.erros == null ? Infinity : a.erros;
        const eb = b.erros == null ? Infinity : b.erros;
        if (ea !== eb) return ea - eb;
        return (a.tempo || Infinity) - (b.tempo || Infinity);
      });
      break;
    }
    
    case 'mais_vitorias_total':
    case 'mais_vitorias_dificuldade': {
      for (const [nome, partidasUser] of porUsuario.entries()) {
        const vitorias = partidasUser.filter(p => (p.resultado || '').toString().toLowerCase() === 'vitoria').length;
        if (vitorias > 0) {
          const userInfo = usuarios[nome] || {};
          resultado.push({ nome, valor: vitorias, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    case 'mais_vitorias_consecutivas': {
      for (const [nome, partidasUser] of porUsuario.entries()) {
        const ordenadas = partidasUser.slice().sort((a, b) => parseData(a) - parseData(b));
        let maxSeq = 0, curSeq = 0;
        for (const p of ordenadas) {
          if ((p.resultado || '').toString().toLowerCase() === 'vitoria') {
            curSeq++;
            if (curSeq > maxSeq) maxSeq = curSeq;
          } else {
            curSeq = 0;
          }
        }
        if (maxSeq > 0) {
          const userInfo = usuarios[nome] || {};
          resultado.push({ nome, valor: maxSeq, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    default: {
      for (const [nome, partidasUser] of porUsuario.entries()) {
        const userInfo = usuarios[nome] || {};
        resultado.push({ nome, valor: partidasUser.length, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
      }
      resultado.sort((a, b) => b.valor - a.valor);
    }
  }
  
  return resultado;
}

// ==================== MONTAGEM DE TABELA ====================
function montarTabelaRanking(nomeJogo, tipoObj, ranking, dificuldade = null) {
  const colunas = tipoObj.colunas || [];
  let posicaoAtivos = 1;
  const usuarioAtual = typeof getNomeUsuario === 'function' ? getNomeUsuario() : null;
  
  return `
    <section class="ranking-section">
      <h2>${nomeJogo} - ${tipoObj.label}</h2>
      ${dificuldade ? `<div class="dificuldade-title">${dificuldade}</div>` : ''}
      <table class="ranking-table">
        <thead>
          <tr>
            <th>Posição</th>
            <th>Jogador</th>
            ${colunas.map(c => `<th>${c}</th>`).join('')}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${ranking.length === 0 
            ? `<tr><td colspan="${3 + colunas.length}"><em>Sem registros</em></td></tr>`
            : ranking.map(item => {
                const isBloqueado = item.status === 'bloqueado';
                const isUsuarioAtual = usuarioAtual && item.nome === usuarioAtual;
                const posicao = isBloqueado ? '--' : `${posicaoAtivos++}º`;
                let trClass = '';
                if (isUsuarioAtual) trClass += 'meu-ranking ';
                if (isBloqueado) trClass += 'bloqueado';
                
                return `
                  <tr class="${trClass.trim()}">
                    <td class="${isBloqueado ? 'pos-bloqueado' : ''}">${posicao}</td>
                    <td>${item.nome}</td>
                    ${colunas.map(c => {
                      if (c === 'Pontuação') return `<td>${item.valor ?? '-'}</td>`;
                      if (c === 'Vitórias') return `<td>${item.valor ?? '-'}</td>`;
                      if (c === 'Sequência') return `<td>${item.valor ?? '-'}</td>`;
                      if (c === 'Tempo') return `<td>${formatarTempo(item.tempo)}</td>`;
                      if (c === 'Erros') return `<td class="erros">${item.erros ?? 0}</td>`;
                      return '<td>-</td>';
                    }).join('')}
                    <td class="status-badge ${isBloqueado ? 'status-bloqueado' : 'status-ativo'}">
                      ${isBloqueado ? 'Bloqueado' : 'Ativo'}
                    </td>
                  </tr>
                `;
              }).join('')
          }
        </tbody>
      </table>
    </section>
  `;
}

// ==================== TROFÉUS ====================
async function carregarTrofeus() {
  let trofeusContainer = document.getElementById('trofeus-container');
  if (!trofeusContainer) return;
  
  trofeusContainer.innerHTML = `
    <section class="trofeus-section">
      <h2>🏆 Troféus</h2>
      <div class="trofeus-loading"><em>Carregando troféus...</em></div>
    </section>
  `;
  
  try {
    const trofeus = await buscarTrofeus();
    
    if (!trofeus.length) {
      trofeusContainer.innerHTML = `
        <section class="trofeus-section">
          <h2>🏆 Troféus</h2>
          <div class="trofeus-empty"><em>Nenhum troféu atribuído ainda</em></div>
        </section>
      `;
      return;
    }
    
    const html = `
      <section class="trofeus-section">
        <h2>🏆 Troféus</h2>
        <div class="trofeus-lista">
          ${trofeus.map(t => {
            const isBloqueado = t.usuario_status === 'bloqueado';
            const icone = t.trofeu_icone || '👑';
            const cor = t.trofeu_cor || '#ffd700';
            
            return `
              <div class="trofeu-item ${isBloqueado ? 'trofeu-bloqueado' : ''}">
                <span class="trofeu-icone" style="color: ${isBloqueado ? '#999' : cor}">${icone}</span>
                <span class="trofeu-jogador">${t.usuario_nome || 'Desconhecido'}</span>
                <span class="trofeu-separador">—</span>
                <span class="trofeu-nome">${t.trofeu_nome || 'Troféu'}</span>
                ${isBloqueado ? '<span class="trofeu-status-bloqueado">(bloqueado)</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
    
    trofeusContainer.innerHTML = html;
    
  } catch (e) {
    console.error('[Rankings] Erro ao carregar troféus:', e);
    trofeusContainer.innerHTML = `
      <section class="trofeus-section">
        <h2>🏆 Troféus</h2>
        <div class="trofeus-empty"><em>Erro ao carregar troféus</em></div>
      </section>
    `;
  }
}

// ==================== EXPORTS ====================
window.carregarRanking = carregarRanking;
window.carregarTrofeus = carregarTrofeus;
