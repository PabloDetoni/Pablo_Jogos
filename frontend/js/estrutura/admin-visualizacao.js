// admin-visualizacao.js - Sistema completo de visualização administrativa
// Inclui: Usuários, Jogos, Troféus, Partidas Detalhadas, Ranking

const API_URL = 'http://localhost:3001';

// ==================== UTILITÁRIOS ====================

function formatarDataBR(isoString) {
  if (!isoString) return '-';
  const data = new Date(isoString);
  if (isNaN(data.getTime())) return '-';
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function formatarTempo(segundos) {
  if (typeof segundos !== "number" || isNaN(segundos)) return "-";
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

function showLoading(container) {
  container.innerHTML = '<div class="loading">Carregando...</div>';
}

function showError(container, msg) {
  container.innerHTML = `<div class="error">${msg}</div>`;
}

function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return alert('Tabela não encontrada');
  let csv = [];
  for (let row of table.rows) {
    let rowData = [];
    for (let cell of row.cells) rowData.push('"' + cell.innerText.replace(/"/g, '""') + '"');
    csv.push(rowData.join(','));
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function truncateText(text, maxLen = 20) {
  if (!text || text.length <= maxLen) return text || '';
  return text.substring(0, maxLen - 3) + '...';
}

function normalizeStringAdmin(s) {
  if (!s && s !== 0) return '';
  return s.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// ==================== CACHES GLOBAIS ====================
let partidasCacheAdmin = null;
let partidasCacheTimeAdmin = 0;
const CACHE_TTL_ADMIN = 30000;
let usuariosCacheAdmin = null;
let jogosCacheAdmin = null;

// ==================== BUSCA DE DADOS ====================

async function buscarPartidasAdmin(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && partidasCacheAdmin && (now - partidasCacheTimeAdmin) < CACHE_TTL_ADMIN) {
    return partidasCacheAdmin;
  }
  
  try {
    const res = await fetch(`${API_URL}/api/partida?limit=10000`);
    if (!res.ok) throw new Error('Erro ao buscar partidas');
    const data = await res.json();
    
    let rows = [];
    if (Array.isArray(data)) rows = data;
    else if (data.partidas) rows = data.partidas;
    else if (data.rows) rows = data.rows;
    
    partidasCacheAdmin = rows.map(p => ({
      ...p,
      tempo: p.tempo != null && p.tempo !== '' ? Number(p.tempo) : null,
      pontuacao: p.pontuacao != null && p.pontuacao !== '' ? Number(p.pontuacao) : null,
      erros: p.erros != null && p.erros !== '' ? Number(p.erros) : null,
      usuario_nome: p.usuario_nome || p.nome || p.usuario || 'Desconhecido',
      jogo_titulo: p.jogo_titulo || p.titulo || p.jogo || 'Desconhecido'
    }));
    partidasCacheTimeAdmin = now;
    return partidasCacheAdmin;
  } catch (e) {
    console.error('[Admin] Erro ao buscar partidas:', e);
    return [];
  }
}

async function buscarUsuariosAdmin() {
  if (usuariosCacheAdmin) return usuariosCacheAdmin;
  try {
    const res = await fetch(`${API_URL}/usuario`);
    if (!res.ok) throw new Error('Erro ao buscar usuários');
    const data = await res.json();
    let rows = Array.isArray(data) ? data : (data.usuarios || data.rows || []);
    
    usuariosCacheAdmin = rows;
    return usuariosCacheAdmin;
  } catch (e) {
    console.warn('[Admin] Erro ao buscar usuários:', e);
    return [];
  }
}

async function buscarJogosAdmin() {
  if (jogosCacheAdmin) return jogosCacheAdmin;
  try {
    const res = await fetch(`${API_URL}/jogo`);
    if (!res.ok) throw new Error('Erro ao buscar jogos');
    const data = await res.json();
    let rows = Array.isArray(data) ? data : (data.jogos || data.rows || []);
    
    jogosCacheAdmin = rows;
    return jogosCacheAdmin;
  } catch (e) {
    console.warn('[Admin] Erro ao buscar jogos:', e);
    return [];
  }
}

// ==================== FUNÇÕES DE RANKING ====================

function matchJogoAdmin(jogoConfig, titulo) {
  if (!titulo) return false;
  const tituloNorm = normalizeStringAdmin(titulo);
  if (normalizeStringAdmin(jogoConfig.chave) === tituloNorm) return true;
  if (jogoConfig.aliases) {
    for (const alias of jogoConfig.aliases) {
      const aliasNorm = normalizeStringAdmin(alias);
      if (aliasNorm === tituloNorm) return true;
      if (tituloNorm.includes(aliasNorm)) return true;
      if (aliasNorm.includes(tituloNorm) && tituloNorm.length > 2) return true;
    }
  }
  return false;
}

function matchDificuldadeAdmin(filtro, partida) {
  if (!filtro) return true;
  if (!partida) return false;
  return normalizeStringAdmin(filtro) === normalizeStringAdmin(partida);
}

function parseDataAdmin(p) {
  const d = p.data || p.created_at;
  return d ? new Date(d).getTime() : 0;
}

async function calcularRankingAdmin(jogoConfig, tipoChave, dificuldadeFiltro) {
  const partidas = await buscarPartidasAdmin();
  const usuarios = await buscarUsuariosAdmin();
  
  // Cria mapa de usuários
  const usuariosMap = {};
  for (const u of usuarios) {
    usuariosMap[u.nome] = { status: u.status || 'ativo', id: u.id };
  }
  
  // Filtra partidas do jogo
  let partidasDoJogo = partidas.filter(p => matchJogoAdmin(jogoConfig, p.jogo_titulo));
  
  // Filtra por dificuldade se especificado
  if (dificuldadeFiltro) {
    partidasDoJogo = partidasDoJogo.filter(p => matchDificuldadeAdmin(dificuldadeFiltro, p.dificuldade));
  }
  
  // Agrupa por usuário
  const porUsuario = new Map();
  for (const p of partidasDoJogo) {
    const nome = p.usuario_nome;
    if (!porUsuario.has(nome)) porUsuario.set(nome, []);
    porUsuario.get(nome).push(p);
  }
  
  const resultado = [];
  
  switch (tipoChave) {
    case 'pontuacao': {
      for (const [nome, list] of porUsuario.entries()) {
        const comPontuacao = list.filter(p => p.pontuacao !== null && !isNaN(p.pontuacao));
        if (!comPontuacao.length) continue;
        const melhor = comPontuacao.reduce((max, p) => (p.pontuacao > max ? p.pontuacao : max), -Infinity);
        if (melhor !== -Infinity) {
          const userInfo = usuariosMap[nome] || {};
          resultado.push({ nome, valor: melhor, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    case 'menor_tempo': {
      for (const [nome, list] of porUsuario.entries()) {
        const validas = list.filter(p => 
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
        const userInfo = usuariosMap[nome] || {};
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
      for (const [nome, list] of porUsuario.entries()) {
        const vitorias = list.filter(p => (p.resultado || '').toString().toLowerCase() === 'vitoria').length;
        if (vitorias > 0) {
          const userInfo = usuariosMap[nome] || {};
          resultado.push({ nome, valor: vitorias, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    case 'mais_vitorias_consecutivas': {
      for (const [nome, list] of porUsuario.entries()) {
        const ordenadas = list.slice().sort((a, b) => parseDataAdmin(a) - parseDataAdmin(b));
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
          const userInfo = usuariosMap[nome] || {};
          resultado.push({ nome, valor: maxSeq, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
        }
      }
      resultado.sort((a, b) => b.valor - a.valor);
      break;
    }
    
    default: {
      for (const [nome, list] of porUsuario.entries()) {
        const userInfo = usuariosMap[nome] || {};
        resultado.push({ nome, valor: list.length, status: userInfo.status === 'bloqueado' ? 'bloqueado' : 'ativo' });
      }
      resultado.sort((a, b) => b.valor - a.valor);
    }
  }
  
  return resultado;
}

// ==================== TOGGLE DE SEÇÕES ====================

function toggleSection(sectionId, btnId, callback) {
  const section = document.getElementById(sectionId);
  const btn = document.getElementById(btnId);
  if (!section || !btn) return;
  
  if (section.style.display === 'none') {
    section.style.display = 'block';
    btn.classList.add('active');
    btn.innerHTML = '<i class="fa-solid fa-minus"></i>';
    
    // Callback específico por seção
    if (callback) callback();
  } else {
    section.style.display = 'none';
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
  }
}

// ==================== RENDERIZAÇÃO DE TABELAS GENÉRICAS ====================

async function renderTable(url, containerId, columns, title, icon) {
  const container = document.getElementById(containerId);
  if (!container) return;
  showLoading(container);
  
  try {
    const res = await fetch(url);
    let data = await res.json();
    
    // Normaliza resposta
    if (!Array.isArray(data)) {
      data = data.rows || data.partidas || data.data || [];
    }
    
    if (data.length === 0) {
      container.innerHTML = '<p>Nenhum dado encontrado.</p>';
      return;
    }
    
    // Ordena por ID crescente se houver campo 'id'
    if (data[0].id !== undefined) {
      data = data.slice().sort((a, b) => Number(a.id) - Number(b.id));
    }
    
    const tableId = `table-${containerId}`;
    let html = `<div class='table-title'><i class='${icon}'></i> ${title} <button class='btn-export' onclick="exportTableToCSV('${tableId}','${containerId}.csv')"><i class='fa-solid fa-file-csv'></i> Exportar CSV</button></div>`;
    html += `<div class='table-responsive'><table id='${tableId}' class='visualizacao-table'><thead><tr>`;
    columns.forEach(col => html += `<th>${col.label}</th>`);
    html += '</tr></thead><tbody>';
    
    data.forEach(row => {
      html += '<tr>';
      columns.forEach(col => {
        let value = row[col.key] ?? '';
        
        if (col.type === 'date' && value) {
          value = formatarDataBR(value);
        } else if (col.type === 'time' && value) {
          value = formatarTempo(value);
        } else if (col.type === 'status') {
          value = `<span class="status-badge status-${value === 'admin' ? 'ativo' : (value === 'bloqueado' ? 'bloqueado' : 'ativo')}">${value}</span>`;
        } else if (col.truncate && value.length > col.truncate) {
          value = truncateText(value, col.truncate);
        }
        
        html += `<td title="${row[col.key] ?? ''}">${value}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
  } catch (err) {
    console.error(`Erro ao carregar ${title}:`, err);
    showError(container, 'Erro ao carregar dados.');
  }
}

// ==================== TROFÉUS ====================

let trofeusCacheData = [];
let usuariosCacheData = [];
let tiposTrofeuCacheData = [];

async function carregarTrofeus() {
  const container = document.getElementById('container-tabela-trofeus');
  if (!container) return;
  showLoading(container);
  
  try {
    const [trofeusRes, usuariosRes, tiposRes] = await Promise.all([
      fetch(`${API_URL}/trophy`),
      fetch(`${API_URL}/usuario`),
      fetch(`${API_URL}/trophy_type`)
    ]);
    
    trofeusCacheData = await trofeusRes.json();
    usuariosCacheData = await usuariosRes.json();
    tiposTrofeuCacheData = await tiposRes.json();
    
    if (!Array.isArray(trofeusCacheData)) trofeusCacheData = [];
    if (!Array.isArray(usuariosCacheData)) usuariosCacheData = [];
    if (!Array.isArray(tiposTrofeuCacheData)) tiposTrofeuCacheData = [];
    
    preencherFiltrosTrofeus();
    renderizarTabelaTrofeus(trofeusCacheData);
  } catch (err) {
    console.error('Erro ao carregar troféus:', err);
    showError(container, 'Erro ao carregar troféus.');
  }
}

function preencherFiltrosTrofeus() {
  const usuarioSelect = document.getElementById('filtro-trofeu-usuario');
  const tipoSelect = document.getElementById('filtro-trofeu-tipo');
  
  if (usuarioSelect) {
    usuarioSelect.innerHTML = '<option value="">Todos</option>' + 
      usuariosCacheData.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
  }
  
  if (tipoSelect) {
    tipoSelect.innerHTML = '<option value="">Todos</option>' + 
      tiposTrofeuCacheData.map(t => `<option value="${t.id}">${t.titulo}</option>`).join('');
  }
}

function filtrarTrofeus() {
  const usuarioId = document.getElementById('filtro-trofeu-usuario')?.value;
  const tipoId = document.getElementById('filtro-trofeu-tipo')?.value;
  
  let filtrados = trofeusCacheData;
  
  if (usuarioId) {
    filtrados = filtrados.filter(t => String(t.usuario_id) === usuarioId);
  }
  
  if (tipoId) {
    filtrados = filtrados.filter(t => String(t.trophy_type_id) === tipoId);
  }
  
  renderizarTabelaTrofeus(filtrados);
}

function renderizarTabelaTrofeus(trofeus) {
  const container = document.getElementById('container-tabela-trofeus');
  if (!container) return;
  
  if (!trofeus.length) {
    container.innerHTML = '<p>Nenhum troféu encontrado.</p>';
    return;
  }
  
  const tableId = 'table-trofeus';
  let html = `<div class='table-title'><i class='fa-solid fa-trophy'></i> Troféus Concedidos (${trofeus.length}) 
    <button class='btn-export' onclick="exportTableToCSV('${tableId}','trofeus.csv')">
      <i class='fa-solid fa-file-csv'></i> Exportar CSV
    </button>
  </div>`;
  
  html += `<div class='table-responsive'><table id='${tableId}' class='visualizacao-table'>
    <thead>
      <tr>
        <th>ID</th>
        <th>Troféu</th>
        <th>Ícone</th>
        <th>Usuário</th>
        <th>Status</th>
        <th>Data de Concessão</th>
      </tr>
    </thead>
    <tbody>`;
  
  trofeus.forEach(t => {
    const icone = t.trofeu_icone || '🏆';
    const cor = t.trofeu_cor || '#ffd700';
    const statusClass = t.usuario_status === 'bloqueado' ? 'status-bloqueado' : 'status-ativo';
    
    html += `<tr>
      <td>${t.id}</td>
      <td title="${t.trofeu_descricao || ''}" style="color: ${cor}; font-weight: bold;">${t.trofeu_nome || 'Sem nome'}</td>
      <td style="font-size: 1.5rem;">${icone}</td>
      <td>${t.usuario_nome || 'Desconhecido'}</td>
      <td><span class="status-badge ${statusClass}">${t.usuario_status || 'ativo'}</span></td>
      <td>${formatarDataBR(t.data_atribuicao)}</td>
    </tr>`;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ==================== PARTIDAS DETALHADAS ====================

let partidasDetalhadasCache = [];

async function carregarPartidasDetalhadas() {
  const container = document.getElementById('container-tabela-partidas');
  const infoContainer = document.getElementById('partidas-info');
  if (!container) return;
  
  showLoading(container);
  
  try {
    // Carrega dados para preencher filtros
    const [partidas, usuarios, jogos] = await Promise.all([
      buscarPartidasAdmin(true), // Força refresh
      buscarUsuariosAdmin(),
      buscarJogosAdmin()
    ]);
    
    partidasDetalhadasCache = partidas;
    
    // Preenche selects de filtros
    preencherFiltrosPartidas(usuarios, jogos, partidas);
    
    // Mostra info inicial
    if (infoContainer) {
      infoContainer.innerHTML = `<i class="fa-solid fa-info-circle"></i> Total de partidas: <strong>${partidas.length}</strong>. Use os filtros para refinar a busca.`;
    }
    
    // Renderiza tabela inicial (últimas 50)
    renderizarTabelaPartidas(partidas.slice(-50).reverse());
    
  } catch (err) {
    console.error('Erro ao carregar partidas:', err);
    showError(container, 'Erro ao carregar partidas.');
  }
}

function preencherFiltrosPartidas(usuarios, jogos, partidas) {
  const usuarioSelect = document.getElementById('filtro-partida-usuario');
  const jogoSelect = document.getElementById('filtro-partida-jogo');
  const dificuldadeSelect = document.getElementById('filtro-partida-dificuldade');
  
  // Preenche usuários
  if (usuarioSelect) {
    usuarioSelect.innerHTML = '<option value="">Todos</option>' + 
      usuarios.map(u => `<option value="${u.nome}">${u.nome}</option>`).join('');
  }
  
  // Preenche jogos
  if (jogoSelect) {
    jogoSelect.innerHTML = '<option value="">Todos</option>' + 
      jogos.map(j => `<option value="${j.titulo}">${j.titulo}</option>`).join('');
  }
  
  // Preenche dificuldades (extrai das partidas)
  if (dificuldadeSelect) {
    const dificuldadesSet = new Set();
    partidas.forEach(p => {
      if (p.dificuldade) dificuldadesSet.add(p.dificuldade);
    });
    const dificuldades = Array.from(dificuldadesSet).sort();
    dificuldadeSelect.innerHTML = '<option value="">Todas</option>' + 
      dificuldades.map(d => `<option value="${d}">${d}</option>`).join('');
  }
}

function filtrarPartidasDetalhadas() {
  const container = document.getElementById('container-tabela-partidas');
  const infoContainer = document.getElementById('partidas-info');
  if (!container) return;
  
  // Obtém valores dos filtros
  const usuario = document.getElementById('filtro-partida-usuario')?.value || '';
  const jogo = document.getElementById('filtro-partida-jogo')?.value || '';
  const dificuldade = document.getElementById('filtro-partida-dificuldade')?.value || '';
  const resultado = document.getElementById('filtro-partida-resultado')?.value || '';
  const dataInicial = document.getElementById('filtro-partida-data-inicial')?.value || '';
  const dataFinal = document.getElementById('filtro-partida-data-final')?.value || '';
  const limite = parseInt(document.getElementById('filtro-partida-limite')?.value || '50');
  
  // Aplica filtros
  let filtradas = partidasDetalhadasCache.slice();
  
  if (usuario) {
    filtradas = filtradas.filter(p => p.usuario_nome === usuario);
  }
  
  if (jogo) {
    filtradas = filtradas.filter(p => p.jogo_titulo === jogo);
  }
  
  if (dificuldade) {
    filtradas = filtradas.filter(p => normalizeStringAdmin(p.dificuldade) === normalizeStringAdmin(dificuldade));
  }
  
  if (resultado) {
    filtradas = filtradas.filter(p => normalizeStringAdmin(p.resultado) === normalizeStringAdmin(resultado));
  }
  
  if (dataInicial) {
    const dataIni = new Date(dataInicial);
    dataIni.setHours(0, 0, 0, 0);
    filtradas = filtradas.filter(p => {
      const dataPartida = new Date(p.data || p.created_at);
      return dataPartida >= dataIni;
    });
  }
  
  if (dataFinal) {
    const dataFim = new Date(dataFinal);
    dataFim.setHours(23, 59, 59, 999);
    filtradas = filtradas.filter(p => {
      const dataPartida = new Date(p.data || p.created_at);
      return dataPartida <= dataFim;
    });
  }
  
  // Ordena por data (mais recentes primeiro)
  filtradas.sort((a, b) => parseDataAdmin(b) - parseDataAdmin(a));
  
  // Aplica limite
  const total = filtradas.length;
  filtradas = filtradas.slice(0, limite);
  
  // Atualiza info
  if (infoContainer) {
    const filtrosAtivos = [usuario, jogo, dificuldade, resultado, dataInicial, dataFinal].filter(f => f).length;
    infoContainer.innerHTML = `<i class="fa-solid fa-info-circle"></i> 
      Exibindo <strong>${filtradas.length}</strong> de <strong>${total}</strong> partidas
      ${filtrosAtivos > 0 ? ` (${filtrosAtivos} filtro(s) ativo(s))` : ''}`;
  }
  
  renderizarTabelaPartidas(filtradas);
}

function renderizarTabelaPartidas(partidas) {
  const container = document.getElementById('container-tabela-partidas');
  if (!container) return;
  
  if (!partidas.length) {
    container.innerHTML = '<p>Nenhuma partida encontrada com os filtros selecionados.</p>';
    return;
  }
  
  const tableId = 'table-partidas';
  let html = `<div class='table-title'><i class='fa-solid fa-list-check'></i> Partidas (${partidas.length}) 
    <button class='btn-export' onclick="exportTableToCSV('${tableId}','partidas.csv')">
      <i class='fa-solid fa-file-csv'></i> Exportar CSV
    </button>
  </div>`;
  
  html += `<div class='table-responsive'><table id='${tableId}' class='visualizacao-table'>
    <thead>
      <tr>
        <th>ID</th>
        <th>Usuário</th>
        <th>Jogo</th>
        <th>Dificuldade</th>
        <th>Resultado</th>
        <th>Pontuação</th>
        <th>Tempo</th>
        <th>Erros</th>
        <th>Data</th>
      </tr>
    </thead>
    <tbody>`;
  
  partidas.forEach(p => {
    const resultadoClass = getResultadoClass(p.resultado);
    
    html += `<tr>
      <td>${p.id || '-'}</td>
      <td title="${p.usuario_nome}">${truncateText(p.usuario_nome, 15)}</td>
      <td title="${p.jogo_titulo}">${truncateText(p.jogo_titulo, 15)}</td>
      <td>${p.dificuldade || '-'}</td>
      <td><span class="resultado-badge ${resultadoClass}">${p.resultado || '-'}</span></td>
      <td>${p.pontuacao ?? '-'}</td>
      <td>${p.tempo !== null ? formatarTempo(p.tempo) : '-'}</td>
      <td>${p.erros ?? '-'}</td>
      <td>${formatarDataBR(p.data || p.created_at)}</td>
    </tr>`;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function getResultadoClass(resultado) {
  if (!resultado) return '';
  const r = resultado.toString().toLowerCase();
  if (r === 'vitoria') return 'resultado-vitoria';
  if (r === 'derrota') return 'resultado-derrota';
  if (r === 'empate') return 'resultado-empate';
  return '';
}

// ==================== RANKING ====================

const jogosRanking = [
  {
    chave: "Jogo da Velha", nome: "Jogo da Velha",
    aliases: ["velha", "jogo da velha", "tic tac toe", "tic-tac-toe"],
    dificuldades: ["Fácil", "Médio"],
    tipos: [
      { chave: "mais_vitorias_total", label: "Mais vitórias (Total)" },
      { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" },
      { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas" }
    ]
  },
  { chave: "PPT", nome: "Pedra Papel Tesoura", aliases: ["ppt", "pedra papel tesoura"], dificuldades: [], tipos: [{ chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas" }] },
  { chave: "Forca", nome: "Forca", aliases: ["forca", "hangman"], dificuldades: ["Fácil", "Médio", "Difícil"], tipos: [{ chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "mais_vitorias_consecutivas", label: "Mais vitórias consecutivas" }] },
  { chave: "2048", nome: "2048", aliases: ["2048"], dificuldades: [], tipos: [{ chave: "pontuacao", label: "Maior pontuação" }] },
  { chave: "Memória", nome: "Memória", aliases: ["memoria", "memória", "memory"], dificuldades: ["Fácil", "Médio", "Difícil"], tipos: [{ chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "menor_tempo", label: "Menor tempo" }] },
  { chave: "Sudoku", nome: "Sudoku", aliases: ["sudoku"], dificuldades: ["Fácil", "Médio", "Difícil", "Muito Difícil"], tipos: [{ chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "menor_tempo", label: "Menor tempo" }] },
  { chave: "Pong", nome: "Pong", aliases: ["pong"], dificuldades: ["Fácil", "Médio", "Difícil"], tipos: [{ chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }] },
  { chave: "Campo Minado", nome: "Campo Minado", aliases: ["campo minado", "minesweeper"], dificuldades: ["Fácil", "Médio", "Difícil"], tipos: [{ chave: "mais_vitorias_total", label: "Mais vitórias (Total)" }, { chave: "mais_vitorias_dificuldade", label: "Mais vitórias (Por dificuldade)" }, { chave: "menor_tempo", label: "Menor tempo" }] }
];

async function carregarRankingSimples() {
  const container = document.getElementById('container-tabela-ranking');
  if (!container) return;
  
  preencherFiltrosRankingSimples();
  container.innerHTML = '<div class="ranking-msg-inicial">Selecione um jogo e tipo de ranking, depois clique em Filtrar</div>';
}

function preencherFiltrosRankingSimples() {
  const jogoSelect = document.getElementById('filtro-ranking-jogo');
  const tipoSelect = document.getElementById('filtro-ranking-tipo');
  const difSelect = document.getElementById('filtro-ranking-dificuldade');
  
  if (!jogoSelect || !tipoSelect || !difSelect) return;
  
  jogoSelect.innerHTML = jogosRanking.map((j, i) => `<option value="${i}">${j.nome}</option>`).join('');
  
  function atualizarTiposEDificuldades() {
    const idx = jogoSelect.value;
    const jogo = jogosRanking[idx];
    
    tipoSelect.innerHTML = jogo.tipos.map((t, i) => `<option value="${i}">${t.label}</option>`).join('');
    
    if (jogo.dificuldades.length > 0) {
      difSelect.innerHTML = '<option value="">Todas</option>' + jogo.dificuldades.map(d => `<option value="${d}">${d}</option>`).join('');
      difSelect.disabled = false;
    } else {
      difSelect.innerHTML = '<option value="">N/A</option>';
      difSelect.disabled = true;
    }
  }
  
  jogoSelect.onchange = atualizarTiposEDificuldades;
  atualizarTiposEDificuldades();
}

async function filtrarRankingSimples() {
  const container = document.getElementById('container-tabela-ranking');
  if (!container) return;
  
  showLoading(container);
  
  const jogoIdx = document.getElementById('filtro-ranking-jogo')?.value;
  const tipoIdx = document.getElementById('filtro-ranking-tipo')?.value;
  const dificuldade = document.getElementById('filtro-ranking-dificuldade')?.value || null;
  
  const jogoObj = jogosRanking[jogoIdx];
  const tipoObj = jogoObj?.tipos[tipoIdx];
  
  if (!jogoObj || !tipoObj) {
    container.innerHTML = '<p>Selecione um jogo e tipo de ranking válidos.</p>';
    return;
  }
  
  try {
    const ranking = await calcularRankingAdmin(jogoObj, tipoObj.chave, dificuldade);
    renderizarTabelaRanking(ranking, jogoObj.nome, tipoObj.label, dificuldade);
  } catch (err) {
    console.error('Erro ao carregar ranking:', err);
    showError(container, 'Erro ao carregar ranking.');
  }
}

function renderizarTabelaRanking(ranking, jogoNome, tipoLabel, dificuldade) {
  const container = document.getElementById('container-tabela-ranking');
  if (!container) return;
  
  const titulo = `${jogoNome} - ${tipoLabel}${dificuldade ? ` (${dificuldade})` : ''}`;
  
  if (!ranking.length) {
    container.innerHTML = `<div class='table-title'><i class='fa-solid fa-ranking-star'></i> ${titulo}</div><p>Nenhum dado encontrado para este ranking.</p>`;
    return;
  }
  
  const tableId = 'table-ranking-simples';
  let html = `<div class='table-title'><i class='fa-solid fa-ranking-star'></i> ${titulo} 
    <button class='btn-export' onclick="exportTableToCSV('${tableId}','ranking.csv')">
      <i class='fa-solid fa-file-csv'></i> Exportar CSV
    </button>
  </div>`;
  
  html += `<div class='table-responsive'><table id='${tableId}' class='visualizacao-table'>
    <thead>
      <tr>
        <th style="text-align:center;">#</th>
        <th>Nome</th>
        <th style="text-align:center;">Valor</th>
        <th style="text-align:center;">Tempo</th>
        <th style="text-align:center;">Erros</th>
        <th style="text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>`;
  
  ranking.forEach((r, idx) => {
    const statusBadge = r.status === 'bloqueado' 
      ? '<span class="status-badge status-bloqueado">Bloqueado</span>'
      : '<span class="status-badge status-ativo">Ativo</span>';
    
    const trClass = idx < 3 ? 'ranking-top' : '';
    const posicao = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
    
    html += `<tr class="${trClass}">
      <td style="text-align:center; font-weight: bold; font-size: 1.1em;">${posicao}</td>
      <td>${truncateText(r.nome, 20)}</td>
      <td style="text-align:center;">${r.valor ?? '-'}</td>
      <td style="text-align:center;">${r.tempo !== null && r.tempo !== undefined ? formatarTempo(r.tempo) : '-'}</td>
      <td style="text-align:center;">${r.erros ?? '-'}</td>
      <td style="text-align:center;">${statusBadge}</td>
    </tr>`;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Admin Visualização] Inicializando...');
  
  // Configura toggles
  document.getElementById('toggle-usuarios')?.addEventListener('click', () => {
    toggleSection('visualizacao-usuarios', 'toggle-usuarios', () => {
      renderTable(`${API_URL}/usuario`, 'visualizacao-usuarios', [
        { key: 'id', label: 'ID' },
        { key: 'nome', label: 'Nome', truncate: 20 },
        { key: 'email', label: 'Email', truncate: 25 },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'criado_em', label: 'Criado em', type: 'date' }
      ], 'Usuários', 'fa-solid fa-users');
    });
  });
  
  document.getElementById('toggle-jogos')?.addEventListener('click', () => {
    toggleSection('visualizacao-jogos', 'toggle-jogos', () => {
      renderTable(`${API_URL}/jogo`, 'visualizacao-jogos', [
        { key: 'id', label: 'ID' },
        { key: 'titulo', label: 'Título' },
        { key: 'genero', label: 'Gênero' },
        { key: 'descricao', label: 'Descrição', truncate: 30 },
        { key: 'criado_em', label: 'Criado em', type: 'date' }
      ], 'Jogos', 'fa-solid fa-gamepad');
    });
  });
  
  document.getElementById('toggle-trofeus')?.addEventListener('click', () => {
    toggleSection('visualizacao-trofeus', 'toggle-trofeus', carregarTrofeus);
  });
  
  document.getElementById('toggle-partidas')?.addEventListener('click', () => {
    toggleSection('visualizacao-partidas', 'toggle-partidas', carregarPartidasDetalhadas);
  });
  
  document.getElementById('toggle-rankings')?.addEventListener('click', () => {
    toggleSection('visualizacao-rankings', 'toggle-rankings', carregarRankingSimples);
  });
  
  // Configura botões de filtro
  document.getElementById('btn-filtrar-trofeus')?.addEventListener('click', filtrarTrofeus);
  document.getElementById('btn-filtrar-partidas')?.addEventListener('click', filtrarPartidasDetalhadas);
  document.getElementById('btn-filtrar-ranking')?.addEventListener('click', filtrarRankingSimples);
  
  // Botão de logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('Deseja sair do painel administrativo?')) {
      window.location.href = 'login.html';
    }
  });
  
  console.log('[Admin Visualização] Pronto!');
});

// Expõe funções globalmente
window.exportTableToCSV = exportTableToCSV;
window.filtrarPartidasDetalhadas = filtrarPartidasDetalhadas;
window.filtrarRankingSimples = filtrarRankingSimples;
window.filtrarTrofeus = filtrarTrofeus;
