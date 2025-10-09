// Controller para endpoint de ranking com filtros
const db = require('../database');

module.exports = {
  async listarRanking(req, res) {
    const { id_jogo, tipo_ranking, id_dificuldade } = req.query;
    let query = `SELECT u.id, u.nome, e.pontuacao, e.vitorias, e.vitorias_consecutivas, e.menor_tempo, e.erros, e.id_jogo, e.id_dificuldade
      FROM estatistica_usuario_jogo e
      JOIN usuario u ON u.id = e.id_usuario
      WHERE 1=1`;
    const params = [];
    if (id_jogo) {
      params.push(id_jogo);
      query += ` AND e.id_jogo = $${params.length}`;
    }
    if (id_dificuldade) {
      params.push(id_dificuldade);
      query += ` AND e.id_dificuldade = $${params.length}`;
    }
    // Ordenação por tipo de ranking
    if (tipo_ranking === 'pontuacao') {
      query += ' ORDER BY e.pontuacao DESC';
    } else if (tipo_ranking === 'vitorias') {
      query += ' ORDER BY e.vitorias DESC';
    } else if (tipo_ranking === 'menor_tempo') {
      query += ' ORDER BY e.menor_tempo ASC';
    } else {
      query += ' ORDER BY e.pontuacao DESC';
    }
    query += ' LIMIT 100';
    try {
      const { rows } = await db.query(query, params);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar ranking' });
    }
  }
};
