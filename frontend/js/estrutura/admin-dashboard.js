// admin-dashboard.js - Dashboard completo com métricas do sistema

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

function animateValue(elementId, start, end, duration) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const range = end - start;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + range * easeOut);
    
    element.textContent = current.toLocaleString('pt-BR');
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// ==================== MÉTRICAS GERAIS ====================

async function carregarMetricasGerais() {
  try {
    const res = await fetch(`${API_URL}/dashboard/metricas`);
    const data = await res.json();
    
    // Anima os valores
    animateValue('total-usuarios', 0, data.totalUsuarios || 0, 800);
    animateValue('total-jogos', 0, data.totalJogos || 0, 800);
    animateValue('total-partidas', 0, data.totalPartidas || 0, 800);
    animateValue('total-trofeus', 0, data.totalTrofeus || 0, 800);
    animateValue('total-admins', 0, data.totalAdmins || 0, 800);
  } catch (err) {
    console.error('Erro ao carregar métricas gerais:', err);
    document.getElementById('total-usuarios').textContent = '?';
    document.getElementById('total-jogos').textContent = '?';
    document.getElementById('total-partidas').textContent = '?';
    document.getElementById('total-trofeus').textContent = '?';
    document.getElementById('total-admins').textContent = '?';
  }
}

// ==================== MÉTRICAS DE ATIVIDADE ====================

async function carregarMetricasAtividade() {
  try {
    const res = await fetch(`${API_URL}/dashboard/metricas/atividade`);
    const data = await res.json();
    
    // Usuário com mais partidas
    if (data.usuarioMaisPartidas) {
      document.getElementById('usuario-mais-partidas').textContent = data.usuarioMaisPartidas.nome;
      document.getElementById('usuario-mais-partidas-count').textContent = `${data.usuarioMaisPartidas.total_partidas} partidas`;
    } else {
      document.getElementById('usuario-mais-partidas').textContent = 'Nenhum';
      document.getElementById('usuario-mais-partidas-count').textContent = '';
    }
    
    // Usuário com mais troféus
    if (data.usuarioMaisTrofeus) {
      document.getElementById('usuario-mais-trofeus').textContent = data.usuarioMaisTrofeus.nome;
      document.getElementById('usuario-mais-trofeus-count').textContent = `${data.usuarioMaisTrofeus.total_trofeus} troféus`;
    } else {
      document.getElementById('usuario-mais-trofeus').textContent = 'Nenhum';
      document.getElementById('usuario-mais-trofeus-count').textContent = '';
    }
    
    // Jogo mais jogado
    if (data.jogoMaisJogado) {
      document.getElementById('jogo-mais-jogado').textContent = data.jogoMaisJogado.titulo;
      document.getElementById('jogo-mais-jogado-count').textContent = `${data.jogoMaisJogado.total_partidas} partidas`;
    } else {
      document.getElementById('jogo-mais-jogado').textContent = 'Nenhum';
      document.getElementById('jogo-mais-jogado-count').textContent = '';
    }
    
    // Última partida
    if (data.ultimaPartida) {
      document.getElementById('ultima-partida-jogo').textContent = data.ultimaPartida.jogo_titulo || 'Jogo';
      document.getElementById('ultima-partida-data').textContent = formatarDataBR(data.ultimaPartida.data);
    } else {
      document.getElementById('ultima-partida-jogo').textContent = 'Nenhuma';
      document.getElementById('ultima-partida-data').textContent = '';
    }
  } catch (err) {
    console.error('Erro ao carregar métricas de atividade:', err);
  }
}

// ==================== MÉTRICAS POR JOGO ====================

async function carregarMetricasPorJogo() {
  const tbody = document.getElementById('tbody-metricas-jogos');
  
  try {
    const res = await fetch(`${API_URL}/dashboard/metricas/jogos`);
    const jogos = await res.json();
    
    if (!jogos.length) {
      tbody.innerHTML = '<tr><td colspan="5">Nenhum dado disponível</td></tr>';
      return;
    }
    
    tbody.innerHTML = jogos.map(jogo => {
      const barraVitorias = `<div class="progress-bar"><div class="progress-fill vitoria" style="width: ${jogo.mediaVitorias}%"></div></div>`;
      const barraDerrotas = `<div class="progress-bar"><div class="progress-fill derrota" style="width: ${jogo.mediaDerrotas}%"></div></div>`;
      const barraEmpates = `<div class="progress-bar"><div class="progress-fill empate" style="width: ${jogo.mediaEmpates}%"></div></div>`;
      
      return `<tr>
        <td><strong>${jogo.titulo}</strong></td>
        <td>${jogo.totalPartidas}</td>
        <td>${barraVitorias}<span class="percent-value">${jogo.mediaVitorias}%</span></td>
        <td>${barraDerrotas}<span class="percent-value">${jogo.mediaDerrotas}%</span></td>
        <td>${barraEmpates}<span class="percent-value">${jogo.mediaEmpates}%</span></td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error('Erro ao carregar métricas por jogo:', err);
    tbody.innerHTML = '<tr><td colspan="5">Erro ao carregar dados</td></tr>';
  }
}

// ==================== TOP RANKING ====================

async function carregarTopRanking() {
  const container = document.getElementById('top-ranking-geral');
  
  try {
    const res = await fetch(`${API_URL}/dashboard/ranking/top`);
    const data = await res.json();
    
    if (!data.topGeral || !data.topGeral.length) {
      container.innerHTML = '<p class="no-data">Nenhum ranking disponível ainda</p>';
      return;
    }
    
    // Ícones de medalhas
    const medalhas = ['🥇', '🥈', '🥉'];
    const classes = ['gold', 'silver', 'bronze'];
    
    let html = '<div class="podium">';
    
    data.topGeral.forEach((user, idx) => {
      html += `
        <div class="podium-item ${classes[idx] || ''}">
          <span class="podium-medal">${medalhas[idx] || ''}</span>
          <span class="podium-position">${idx + 1}º</span>
          <span class="podium-name">${user.nome}</span>
          <span class="podium-score">${user.total_vitorias} vitórias</span>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  } catch (err) {
    console.error('Erro ao carregar top ranking:', err);
    container.innerHTML = '<p class="no-data">Erro ao carregar ranking</p>';
  }
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
  // Carrega todas as métricas em paralelo
  await Promise.all([
    carregarMetricasGerais(),
    carregarMetricasAtividade(),
    carregarMetricasPorJogo(),
    carregarTopRanking()
  ]);
  
  // Botão de logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('Deseja sair do painel administrativo?')) {
      window.location.href = 'login.html';
    }
  });
});
