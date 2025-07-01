// rankings.js

// Exemplo de jogos para ranking
const jogosRanking = [
    { chave: "Jogo da Velha", nome: "Jogo da Velha" },
    { chave: "Pong", nome: "Pong" },
    // Adicione aqui outros jogos que terão ranking no backend!
  ];
  
  // Busca rankings do backend para cada jogo
  async function carregarRankings() {
    const container = document.getElementById('rankings-container');
    container.innerHTML = '';
  
    for (const jogo of jogosRanking) {
      const ranking = await obterRankingBackend(jogo.chave);
  
      // Criação do bloco de ranking
      const section = document.createElement('section');
      section.className = 'ranking-section';
      section.innerHTML = `
        <h2>${jogo.nome}</h2>
        <table class="ranking-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Nome</th>
              <th>Pontuação</th>
            </tr>
          </thead>
          <tbody>
            ${ranking.length === 0 ? `<tr><td colspan="3"><em>Sem registros</em></td></tr>` :
              ranking.map((item, idx) => `
                <tr>
                  <td>${idx + 1}º</td>
                  <td>${item.nome}</td>
                  <td>${item.pontuacao}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      `;
      container.appendChild(section);
    }
  }
  
  // Exemplo: faz requisição para /admin/rankings (Ajuste se preferir público depois)
  async function obterRankingBackend(jogo) {
    try {
      const res = await fetch('http://localhost:3001/admin/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jogo, email: getAdminEmail() })
      });
      const data = await res.json();
      return data.ranking || [];
    } catch {
      return [];
    }
  }
  
  // Função para obter o email do admin logado (você pode adaptar para pegar de sessionStorage)
  function getAdminEmail() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return user && user.email ? user.email : 'admin@admin.com'; // fallback
  }
  
  // Inicialização
  document.addEventListener('DOMContentLoaded', carregarRankings);