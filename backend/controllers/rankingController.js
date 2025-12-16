// Controller de ranking - DESCONTINUADO
// Rankings agora são calculados diretamente no frontend a partir de GET /api/partida
// Este arquivo é mantido apenas para compatibilidade

module.exports = {
  listarRanking: (req, res) => {
    return res.status(410).json({
      error: 'Endpoint descontinuado',
      message: 'Rankings agora são calculados no frontend a partir de GET /api/partida',
      alternativa: 'GET /api/partida?limit=10000'
    });
  }
};
