// admin-dashboard.js - Dashboard dinâmico para painel admin

document.addEventListener('DOMContentLoaded', async () => {
  // Buscar dados reais do banco
  const usuarios = await fetch('/usuario').then(r => r.json());
  const jogos = await fetch('/jogo').then(r => r.json());
  // Se não houver endpoint de partidas, pode deixar 0 ou implementar depois
  let partidas = [];
  try {
    partidas = await fetch('/partida').then(r => r.json());
  } catch (e) {
    partidas = [];
  }

  document.querySelector('#dashboard-total-usuarios .dashboard-value').textContent = usuarios.length;
  document.querySelector('#dashboard-total-jogos .dashboard-value').textContent = jogos.length;
  document.querySelector('#dashboard-total-partidas .dashboard-value').textContent = partidas.length || 0;

  // Buscar logs recentes
  let logs = [];
  try {
    logs = await fetch('/log').then(r => r.json());
  } catch (e) {
    logs = [];
  }
  const logsList = document.getElementById('dashboard-logs');
  logsList.innerHTML = logs.length
    ? logs.slice(0, 8).map(log => `<li><b>${log.acao}</b> em ${new Date(log.data_hora).toLocaleString()}<br><small>${log.detalhes ? JSON.stringify(log.detalhes) : ''}</small></li>`).join('')
    : '<li>Nenhuma atividade recente.</li>';
});
