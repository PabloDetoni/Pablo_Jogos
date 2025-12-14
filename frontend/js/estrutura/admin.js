// admin.js
// Painel Admin centralizado e modular
import { initDashboard } from './admin-dashboard.js';
import { initUsuarios } from './admin-usuarios.js';
import { initJogos } from './admin-jogos.js';
import { initRankings } from './admin-rankings.js';
import { initLogs } from './admin-logs.js';
import { initConquistas } from './admin-conquistas.js';

window.addEventListener('DOMContentLoaded', () => {
  // Inicializa cada módulo do painel admin
  initDashboard();
  initUsuarios();
  initJogos();
  initRankings();
  initLogs();
  initConquistas();
  // Navegação entre seções
  document.querySelectorAll('.admin-sidebar ul li').forEach(li => {
    li.addEventListener('click', () => {
      document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
      document.querySelectorAll('.admin-sidebar ul li').forEach(item => item.classList.remove('active'));
      li.classList.add('active');
      const section = document.getElementById('section-' + li.dataset.section);
      if (section) section.style.display = '';
    });
  });
  // Exibe dashboard por padrão
  document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
  document.getElementById('section-dashboard').style.display = '';
});
