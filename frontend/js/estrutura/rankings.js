// rankings.js - Sistema de Rankings completo
// Fonte única: tabela partida via GET /api/partida
// Suporte: usuários bloqueados, troféus administrativos, múltiplos tipos de ranking

const API_BASE = window.API_URL || 'http://localhost:3001';

// Cache de partidas (evita múltiplas requisições)
let partidasCache = null;
let partidasCacheTime = 0;
const CACHE_TTL = 30000; // 30 segundos

// Cache de usuários (para status bloqueado)
let usuariosCache = null;

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', async () => {
  // Verifica bloqueio do usuário atual
  if (typeof checkUserBlocked === 'function') await checkUserBlocked();
  if (typeof startBlockedUserPolling === 'function') startBlockedUserPolling();
  
  // Só inicializa rankings se os elementos existem
  if (document.getElementById('jogo-select') && document.getElementById('tipo-ranking')) {
    await inicializarRankings();
  }
});

// ==================== CONFIGURAÇÃO DOS JOGOS ====================
const jogosRanking = [
  {
    chave: "Jogo da Velha", nome: "Jogo da Velha",
    aliases: ["velha", "jogo da velha", "tic tac toe"],
    dificuldades: ["Fácil", "Médio"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas", porDificuldade: true, colunas: ["Sequência"] }
    ]
  },
  {
    chave: "PPT", nome: "Pedra Papel Tesoura",
    aliases: ["ppt", "pedra papel tesoura", "pedra, papel, tesoura"],
    dificuldades: [],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas", colunas: ["Sequência"] }
    ]
  },
  {
    chave: "Forca", nome: "Forca",
    aliases: ["forca", "hangman"],
    dificuldades: ["Fácil", "Médio", "Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas", porDificuldade: true, colunas: ["Sequência"] }
    ]
  },
  {
    chave: "2048", nome: "2048",
    aliases: ["2048"],
    dificuldades: [],
    tipos: [
      { chave: "pontuacao", label: "Maior pontuação", colunas: ["Pontuação"] }
    ]
  },
  {
    chave: "Memória", nome: "Memória",
    aliases: ["memoria", "memória", "memory"],
    dificuldades: ["Fácil", "Médio", "Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo", "Erros"] }
    ]
  },
  {
    chave: "Sudoku", nome: "Sudoku",
    aliases: ["sudoku"],
    dificuldades: ["Fácil", "Médio", "Difícil", "Muito Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo", "Erros"] }
    ]
  },
  {
    chave: "Pong", nome: "Pong",
    aliases: ["pong"],
    dificuldades: ["Fácil", "Médio", "Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] }
    ]
  },
  {
    chave: "Campo Minado", nome: "Campo Minado",
    aliases: ["campo minado", "campo_minado", "minesweeper"],
    dificuldades: ["Fácil", "Médio", "Difícil"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)", colunas: ["Vitórias"] },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)", porDificuldade: true, colunas: ["Vitórias"] },
      { chave: "menor_tempo", label: "Menor tempo (Por dificuldade)", porDificuldade: true, colunas: ["Tempo"] }
    ]
  }
];

let availableGamesList = jogosRanking;

// ==================== HELPERS DE NORMALIZAÇÃO ====================
function normalizeString(s) {
  if (!s && s !== 0) return '';
  return s.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function matchJogo(jogoConfig, titulo) {
  if (!titulo) return false;
  const tituloNorm = normalizeString(titulo);
  
  // Verifica chave principal
  if (normalizeString(jogoConfig.chave) === tituloNorm) return true;
  
  // Verifica aliases
  if (jogoConfig.aliases) {
    for (const alias of jogoConfig.aliases) {
      if (normalizeString(alias) === tituloNorm) return true;
      if (tituloNorm.includes(normalizeString(alias))) return true;
      if (normalizeString(alias).includes(tituloNorm)) return true;
    }
  }
  
  return false;
}

function matchDificuldade(dificuldadeFiltro, dificuldadePartida) {
  if (!dificuldadeFiltro) return true;
  if (!dificuldadePartida) return false;
  return normalizeString(dificuldadeFiltro) === normalizeString(dificuldadePartida);
}

function parseData(p) {
  // Tenta múltiplos campos de data
  const d = p.data || p.created_at || (p.dados && p.dados.timestamp);
  return d ? new Date(d).getTime() : 0;
}

function formatarTempo(segundos) {
  if (segundos === null || segundos === undefined || isNaN(segundos)) return '-';
  const mins = Math.floor(segundos / 60);
  const secs = Math.floor(segundos % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// ==================== BUSCA DE DADOS ====================
async function buscarPartidas() {
  const now = Date.now();
  if (partidasCache && (now - partidasCacheTime) < CACHE_TTL) {
    return partidasCache;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/partida`);
    if (!res.ok) throw new Error('Erro ao buscar partidas');
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data.rows || []);
    
    // Normaliza campos numéricos
    partidasCache = rows.map(p => ({
      ...p,
      tempo: p.tempo != null && p.tempo !== '' ? Number(p.tempo) : null,
      pontuacao: p.pontuacao != null && p.pontuacao !== '' ? Number(p.pontuacao) : null,
      erros: p.erros != null && p.erros !== '' ? Number(p.erros) : null,
      usuario_nome: p.usuario_nome || p.nome || p.usuario || 'Desconhecido',
      jogo_titulo: p.jogo_titulo || p.titulo || p.jogo || ''
    }));
    partidasCacheTime = now;
    return partidasCache;
  } catch (e) {
    console.error('Erro ao buscar partidas:', e);
    return [];
  }
}

async function buscarUsuarios() {
  if (usuariosCache) return usuariosCache;
  try {
    const res = await fetch(`${API_BASE}/usuario`);
    if (!res.ok) return {};
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data.rows || []);
    usuariosCache = {};
    for (const u of rows) {
      usuariosCache[u.nome] = u.status || 'ativo';
    }
    return usuariosCache;
  } catch (e) {
    return {};
  }
}

async function buscarTrofeus() {
  try {
    const res = await fetch(`${API_BASE}/trophy`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data.rows || []);
  } catch (e) {
    console.error('Erro ao buscar troféus:', e);
    return [];
  }
}

// ==================== INICIALIZAÇÃO DA UI ====================
async function inicializarRankings() {
  const jogoSelect = document.getElementById('jogo-select');
  const tipoRanking = document.getElementById('tipo-ranking');
  
  // Preenche select de jogos
  jogoSelect.innerHTML = jogosRanking.map((j, i) => 
    `<option value="${i}">${j.nome}</option>`
  ).join('');
  
  jogoSelect.onchange = atualizarTiposERanking;
  tipoRanking.onchange = carregarRanking;
  
  atualizarTiposERanking();
  
  // Carrega troféus
  await carregarTrofeus();
}

function atualizarTiposERanking() {
  const jogoSelect = document.getElementById('jogo-select');
  const tipoRanking = document.getElementById('tipo-ranking');
  const idx = Number(jogoSelect.value);
  const jogo = jogosRanking[idx];
  
  if (!jogo || !jogo.tipos || !jogo.tipos.length) {
    tipoRanking.innerHTML = '<option value="-1">(Sem ranking implementado)</option>';
    document.getElementById('rankings-container').innerHTML = 
      '<div class="ranking-section"><em>Esse jogo ainda não tem ranking implementado.</em></div>';
    return;
  }
  
  tipoRanking.innerHTML = jogo.tipos.map((t, i) => 
    `<option value="${i}">${t.label}</option>`
  ).join('');
  
  carregarRanking();
}

// ==================== CÁLCULO DE RANKINGS ====================
async function carregarRanking() {
  const jogoSelect = document.getElementById('jogo-select');
  const tipoRanking = document.getElementById('tipo-ranking');
  const container = document.getElementById('rankings-container');
  
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
    // Busca dados
    const [partidas, usuarios] = await Promise.all([buscarPartidas(), buscarUsuarios()]);
    
    // Filtra partidas do jogo
    const partidasDoJogo = partidas.filter(p => matchJogo(jogo, p.jogo_titulo));
    
    let html = '';
    
    if (tipo.porDificuldade && jogo.dificuldades.length > 0) {
      // Uma tabela para cada dificuldade
      for (const dificuldade of jogo.dificuldades) {
        const partidasDaDificuldade = partidasDoJogo.filter(p => matchDificuldade(dificuldade, p.dificuldade));
        const ranking = calcularRanking(partidasDaDificuldade, tipo.chave, usuarios);
        html += montarTabelaRanking(jogo.nome, tipo, ranking, dificuldade);
      }
    } else {
      // Uma única tabela (total)
      const ranking = calcularRanking(partidasDoJogo, tipo.chave, usuarios);
      html += montarTabelaRanking(jogo.nome, tipo, ranking);
    }
    
    container.innerHTML = html || '<div class="ranking-section"><em>Sem dados para exibir.</em></div>';
    
  } catch (e) {
    console.error('Erro ao carregar ranking:', e);
    container.innerHTML = '<div class="ranking-section"><em>Erro ao carregar ranking.</em></div>';
  }
}

function calcularRanking(partidas, tipoChave, usuarios) {
  if (!partidas.length) return [];
  
  // Agrupa partidas por usuário
  const porUsuario = new Map();
  for (const p of partidas) {
    const nome = p.usuario_nome;
    if (!porUsuario.has(nome)) porUsuario.set(nome, []);
    porUsuario.get(nome).push(p);
  }
  
  const resultado = [];
  
  switch (tipoChave) {
    case 'pontuacao': {
      // Maior pontuação por usuário
      for (const [nome, partidasUser] of porUsuario.entries()) {
        const melhor = partidasUser
          .filter(p => p.pontuacao !== null && !isNaN(p.pontuacao))
          .reduce((max, p) => (p.pontuacao > max ? p.pontuacao : max), -Infinity);
        
        if (melhor !== -Infinity) {
          resultado.push({
            nome,
            valor: melhor,
            status: usuarios[nome] === 'bloqueado' ? 'bloqueado' : 'ativo'
          });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    case 'menor_tempo': {
      // Menor tempo por usuário (prioriza menos erros, depois menor tempo)
      for (const [nome, partidasUser] of porUsuario.entries()) {
        const comTempo = partidasUser.filter(p => p.tempo !== null && !isNaN(p.tempo));
        if (!comTempo.length) continue;
        
        // Ordena: erros asc (nulls last), depois tempo asc
        comTempo.sort((a, b) => {
          const ea = a.erros == null ? Infinity : a.erros;
          const eb = b.erros == null ? Infinity : b.erros;
          if (ea !== eb) return ea - eb;
          return (a.tempo || Infinity) - (b.tempo || Infinity);
        });
        
        const melhor = comTempo[0];
        resultado.push({
          nome,
          tempo: melhor.tempo,
          erros: melhor.erros,
          status: usuarios[nome] === 'bloqueado' ? 'bloqueado' : 'ativo'
        });
      }
      // Ordena resultado final
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
      // Conta vitórias por usuário
      for (const [nome, partidasUser] of porUsuario.entries()) {
        const vitorias = partidasUser.filter(p => 
          (p.resultado || '').toString().toLowerCase() === 'vitoria'
        ).length;
        
        if (vitorias > 0) {
          resultado.push({
            nome,
            valor: vitorias,
            status: usuarios[nome] === 'bloqueado' ? 'bloqueado' : 'ativo'
          });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    case 'mais_vitorias_consecutivas': {
      // Maior sequência de vitórias consecutivas por usuário
      for (const [nome, partidasUser] of porUsuario.entries()) {
        // Ordena por data
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
          resultado.push({
            nome,
            valor: maxSeq,
            status: usuarios[nome] === 'bloqueado' ? 'bloqueado' : 'ativo'
          });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    default: {
      // Fallback: mais partidas jogadas
      for (const [nome, partidasUser] of porUsuario.entries()) {
        resultado.push({
          nome,
          valor: partidasUser.length,
          status: usuarios[nome] === 'bloqueado' ? 'bloqueado' : 'ativo'
        });
      }
      resultado.sort((a, b) => b.valor - a.valor);
    }
  }
  
  return resultado;
}

// ==================== MONTAGEM DE HTML ====================
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
            <th>Nome</th>
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
                
                // Posição só conta ativos
                const posicao = isBloqueado ? '--' : `${posicaoAtivos++}º`;
                
                // Classes da linha
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

// ==================== SEÇÃO DE TROFÉUS ====================
async function carregarTrofeus() {
  // Cria container de troféus se não existir
  let trofeusContainer = document.getElementById('trofeus-container');
  if (!trofeusContainer) {
    const mainContainer = document.getElementById('rankings-container');
    if (mainContainer) {
      trofeusContainer = document.createElement('div');
      trofeusContainer.id = 'trofeus-container';
      mainContainer.parentNode.insertBefore(trofeusContainer, mainContainer.nextSibling);
    } else {
      return;
    }
  }
  
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
          <div class="trofeus-empty"><em>Nenhum troféu atribuído</em></div>
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
    console.error('Erro ao carregar troféus:', e);
    trofeusContainer.innerHTML = `
      <section class="trofeus-section">
        <h2>🏆 Troféus</h2>
        <div class="trofeus-empty"><em>Erro ao carregar troféus</em></div>
      </section>
    `;
  }
}

// Exporta funções globais
window.carregarRanking = carregarRanking;
window.carregarTrofeus = carregarTrofeus;
