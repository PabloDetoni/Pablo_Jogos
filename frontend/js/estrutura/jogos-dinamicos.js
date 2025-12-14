async function carregarJogos() {
  try {
    const res = await fetch(`${API_URL}/jogo`);
    const jogos = await res.json();
    const grid = document.querySelector('.grid-jogos');
    grid.innerHTML = '';
    let algumJogo = false;
    jogos.forEach(jogo => {
      if (jogo.slug) {
        const btn = document.createElement('button');
        btn.className = 'jogo-btn';
        btn.textContent = jogo.titulo;
        // Redireciona para o HTML correspondente dentro da pasta frontend/html/jogos
        // (server está servindo a pasta frontend sob o prefixo /frontend)
        btn.onclick = () => {
          const target = `/frontend/html/jogos/${jogo.slug}.html`;
          window.location.href = target;
        };
        grid.appendChild(btn);
        algumJogo = true;
      }
    });
    if (!algumJogo) {
      grid.innerHTML = '<div class="msg error">Nenhum jogo disponível ou erro nos dados (slug ausente).</div>';
    }
  } catch (err) {
    const grid = document.querySelector('.grid-jogos');
    grid.innerHTML = '<div class="msg error">Erro ao carregar jogos.</div>';
    console.error('Erro ao carregar jogos:', err);
  }
}

document.addEventListener('DOMContentLoaded', carregarJogos);
