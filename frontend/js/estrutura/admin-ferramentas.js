// admin-ferramentas.js - Ferramentas administrativas completas

const API_URL = 'http://localhost:3001';

// ==================== UTILITÁRIOS ====================

function showStatus(containerId, message, type = 'info') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
    loading: 'fa-spinner fa-spin'
  };
  
  container.innerHTML = `
    <div class="status-message status-${type}">
      <i class="fa-solid ${iconMap[type] || iconMap.info}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Auto-limpa após 10 segundos (exceto loading)
  if (type !== 'loading') {
    setTimeout(() => {
      container.innerHTML = '';
    }, 10000);
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== MODAL DE CONFIRMAÇÃO ====================

let modalCallback = null;
let modalRequiresInput = false;

function showModal(titulo, mensagem, requireInput = false, callback = null) {
  const modal = document.getElementById('modal-confirmacao');
  const inputContainer = document.getElementById('modal-input-container');
  const input = document.getElementById('modal-input');
  
  document.getElementById('modal-titulo').innerHTML = `<i class="fa-solid fa-exclamation-triangle"></i> ${titulo}`;
  document.getElementById('modal-mensagem').innerHTML = mensagem;
  
  modalRequiresInput = requireInput;
  modalCallback = callback;
  
  if (requireInput) {
    inputContainer.style.display = 'block';
    input.value = '';
    input.focus();
  } else {
    inputContainer.style.display = 'none';
  }
  
  modal.style.display = 'flex';
}

function hideModal() {
  document.getElementById('modal-confirmacao').style.display = 'none';
  modalCallback = null;
  modalRequiresInput = false;
}

function confirmModal() {
  if (modalRequiresInput) {
    const input = document.getElementById('modal-input').value.trim().toUpperCase();
    if (input !== 'CONFIRMAR') {
      showStatus('reset-status', 'Digite CONFIRMAR corretamente para prosseguir.', 'error');
      return;
    }
  }
  
  hideModal();
  if (typeof modalCallback === 'function') {
    modalCallback();
  }
}

// ==================== BACKUP ====================

async function fazerBackupJSON() {
  showStatus('backup-status', 'Gerando backup JSON...', 'loading');
  
  try {
    const res = await fetch(`${API_URL}/dashboard/backup/json`);
    const data = await res.json();
    
    const filename = `backup_${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(data, filename, 'application/json');
    
    showStatus('backup-status', `Backup JSON gerado com sucesso! Arquivo: ${filename}`, 'success');
  } catch (err) {
    console.error('Erro ao gerar backup JSON:', err);
    showStatus('backup-status', 'Erro ao gerar backup JSON.', 'error');
  }
}

async function fazerBackupSQL() {
  showStatus('backup-status', 'Gerando backup SQL...', 'loading');
  
  try {
    const res = await fetch(`${API_URL}/dashboard/backup/sql`);
    const sql = await res.text();
    
    const filename = `backup_${new Date().toISOString().split('T')[0]}.sql`;
    downloadFile(sql, filename, 'text/plain');
    
    showStatus('backup-status', `Backup SQL gerado com sucesso! Arquivo: ${filename}`, 'success');
  } catch (err) {
    console.error('Erro ao gerar backup SQL:', err);
    showStatus('backup-status', 'Erro ao gerar backup SQL.', 'error');
  }
}

// ==================== MANUTENÇÃO ====================

async function verificarRanking() {
  showStatus('manutencao-status', 'Verificando integridade do ranking...', 'loading');
  
  try {
    const res = await fetch(`${API_URL}/dashboard/ranking/verificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    
    if (data.success) {
      const statusIcon = data.dados.status === 'OK' ? '✅' : '⚠️';
      showStatus('manutencao-status', `
        ${statusIcon} Verificação concluída:<br>
        • Total de partidas: ${data.dados.totalPartidas}<br>
        • Usuários com partidas: ${data.dados.usuariosComPartidas}<br>
        • Partidas órfãs: ${data.dados.partidasOrfas}<br>
        • Status: ${data.dados.status}
      `, data.dados.status === 'OK' ? 'success' : 'warning');
    } else {
      showStatus('manutencao-status', 'Erro na verificação.', 'error');
    }
  } catch (err) {
    console.error('Erro ao verificar ranking:', err);
    showStatus('manutencao-status', 'Erro ao verificar ranking.', 'error');
  }
}

// ==================== LIMPEZA ====================

async function carregarSelectsLimpeza() {
  try {
    // Carrega jogos
    const jogosRes = await fetch(`${API_URL}/jogo`);
    const jogos = await jogosRes.json();
    
    const selectJogo = document.getElementById('select-jogo-limpar');
    selectJogo.innerHTML = '<option value="">Selecione um jogo</option>' +
      jogos.map(j => `<option value="${j.id}">${j.titulo}</option>`).join('');
    
    // Carrega usuários
    const usuariosRes = await fetch(`${API_URL}/usuario`);
    const usuarios = await usuariosRes.json();
    
    const selectUsuario = document.getElementById('select-usuario-limpar');
    selectUsuario.innerHTML = '<option value="">Selecione um usuário</option>' +
      usuarios.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
  } catch (err) {
    console.error('Erro ao carregar selects:', err);
  }
}

async function limparPartidasPorJogo() {
  const jogoId = document.getElementById('select-jogo-limpar').value;
  if (!jogoId) {
    showStatus('limpeza-status', 'Selecione um jogo.', 'warning');
    return;
  }
  
  const jogoNome = document.getElementById('select-jogo-limpar').selectedOptions[0].text;
  
  showModal(
    'Limpar Partidas',
    `Tem certeza que deseja apagar todas as partidas do jogo <strong>${jogoNome}</strong>?<br>Esta ação não pode ser desfeita.`,
    false,
    async () => {
      showStatus('limpeza-status', 'Limpando partidas...', 'loading');
      
      try {
        const res = await fetch(`${API_URL}/dashboard/limpar/jogo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jogoId: parseInt(jogoId), hard: false })
        });
        const data = await res.json();
        
        if (data.success) {
          showStatus('limpeza-status', `${data.partidasAfetadas} partidas removidas do jogo ${jogoNome}.`, 'success');
        } else {
          showStatus('limpeza-status', data.error || 'Erro ao limpar partidas.', 'error');
        }
      } catch (err) {
        console.error('Erro ao limpar partidas por jogo:', err);
        showStatus('limpeza-status', 'Erro ao limpar partidas.', 'error');
      }
    }
  );
}

async function limparPartidasPorUsuario() {
  const usuarioId = document.getElementById('select-usuario-limpar').value;
  if (!usuarioId) {
    showStatus('limpeza-status', 'Selecione um usuário.', 'warning');
    return;
  }
  
  const usuarioNome = document.getElementById('select-usuario-limpar').selectedOptions[0].text;
  
  showModal(
    'Limpar Partidas',
    `Tem certeza que deseja apagar todas as partidas do usuário <strong>${usuarioNome}</strong>?<br>Esta ação não pode ser desfeita.`,
    false,
    async () => {
      showStatus('limpeza-status', 'Limpando partidas...', 'loading');
      
      try {
        const res = await fetch(`${API_URL}/dashboard/limpar/usuario`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId: parseInt(usuarioId), hard: false })
        });
        const data = await res.json();
        
        if (data.success) {
          showStatus('limpeza-status', `${data.partidasAfetadas} partidas removidas do usuário ${usuarioNome}.`, 'success');
        } else {
          showStatus('limpeza-status', data.error || 'Erro ao limpar partidas.', 'error');
        }
      } catch (err) {
        console.error('Erro ao limpar partidas por usuário:', err);
        showStatus('limpeza-status', 'Erro ao limpar partidas.', 'error');
      }
    }
  );
}

// ==================== RESET DO SISTEMA ====================

async function resetarSistema() {
  // Primeiro verifica se é admin principal
  // Por simplicidade, assumimos que o admin logado tem ID 1
  // Em produção, você buscaria isso da sessão/cookie
  const adminId = 1; // Ajustar conforme autenticação real
  
  showModal(
    '⚠️ ATENÇÃO - RESET COMPLETO',
    `
      <strong>Esta é uma ação IRREVERSÍVEL!</strong><br><br>
      Serão apagados:<br>
      • Todas as partidas<br>
      • Todos os troféus concedidos<br>
      • Todos os usuários (exceto admin principal)<br><br>
      Serão mantidos:<br>
      • Admin principal (ID 1)<br>
      • Os 8 jogos padrão<br><br>
      <strong style="color: #ef4444;">Para confirmar, digite CONFIRMAR abaixo:</strong>
    `,
    true,
    async () => {
      showStatus('reset-status', 'Executando reset do sistema...', 'loading');
      
      try {
        const res = await fetch(`${API_URL}/dashboard/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirmacao: 'CONFIRMAR_RESET',
            adminId: adminId
          })
        });
        const data = await res.json();
        
        if (data.success) {
          showStatus('reset-status', `
            ✅ Sistema resetado com sucesso!<br>
            • Troféus apagados: ${data.detalhes.trofeusApagados}<br>
            • Partidas apagadas: ${data.detalhes.partidasApagadas}<br>
            • Usuários apagados: ${data.detalhes.usuariosApagados}
          `, 'success');
          
          // Recarrega os selects
          await carregarSelectsLimpeza();
        } else {
          showStatus('reset-status', data.error || 'Erro ao resetar sistema.', 'error');
        }
      } catch (err) {
        console.error('Erro ao resetar sistema:', err);
        showStatus('reset-status', 'Erro ao resetar sistema. Verifique se você tem permissão.', 'error');
      }
    }
  );
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
  // Carrega selects de limpeza
  await carregarSelectsLimpeza();
  
  // Eventos dos botões de backup
  document.getElementById('btn-backup-json')?.addEventListener('click', fazerBackupJSON);
  document.getElementById('btn-backup-sql')?.addEventListener('click', fazerBackupSQL);
  
  // Eventos de manutenção
  document.getElementById('btn-verificar-ranking')?.addEventListener('click', verificarRanking);
  
  // Eventos de limpeza
  document.getElementById('btn-limpar-jogo')?.addEventListener('click', limparPartidasPorJogo);
  document.getElementById('btn-limpar-usuario')?.addEventListener('click', limparPartidasPorUsuario);
  
  // Evento de reset
  document.getElementById('btn-reset-sistema')?.addEventListener('click', resetarSistema);
  
  // Eventos do modal
  document.getElementById('btn-modal-cancelar')?.addEventListener('click', hideModal);
  document.getElementById('btn-modal-confirmar')?.addEventListener('click', confirmModal);
  
  // Fechar modal clicando fora
  document.getElementById('modal-confirmacao')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-confirmacao') hideModal();
  });
  
  // Botão de logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('Deseja sair do painel administrativo?')) {
      window.location.href = 'login.html';
    }
  });
});
