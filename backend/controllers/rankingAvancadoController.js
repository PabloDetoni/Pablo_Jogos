// Controller de ranking avançado - DESCONTINUADO
// Rankings agora são calculados diretamente no frontend a partir de /api/partida
// Este arquivo é mantido apenas para compatibilidade

module.exports = {
  // Redireciona para mensagem informativa
  async buscarRanking(req, res) {
    return res.status(410).json({ 
      error: 'Endpoint descontinuado',
      message: 'Rankings agora são calculados no frontend a partir de GET /api/partida',
      alternativa: 'GET /api/partida?limit=10000'
    });
  },

  async adicionarOuAtualizar(req, res) {
    return res.status(410).json({ 
      error: 'Endpoint removido',
      message: 'Rankings agora são calculados a partir de partidas. Use POST /api/partida para registrar partidas.'
    });
  }
};

