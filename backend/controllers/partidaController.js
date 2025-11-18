// Controller para registro de partidas
const db = require('../database');

module.exports = {
  // Registra uma nova partida
  async registrarPartida(req, res) {
    try {
      const { usuario, jogo, resultado, dificuldade, tempo, data } = req.body;
      // Busca id_usuario e id_jogo
      const userRes = await db.query('SELECT id FROM usuario WHERE nome = $1', [usuario]);
      const jogoRes = await db.query('SELECT id FROM jogo WHERE titulo = $1', [jogo]);
      if (!userRes.rows.length || !jogoRes.rows.length) return res.status(400).json({ error: 'Usuário ou jogo não encontrado' });
      const id_usuario = userRes.rows[0].id;
      const id_jogo = jogoRes.rows[0].id;
      // Insere partida
      await db.query(
        'INSERT INTO partida (id_usuario, id_jogo, resultado, dificuldade, tempo, data) VALUES ($1, $2, $3, $4, $5, $6)',
        [id_usuario, id_jogo, resultado, dificuldade || null, tempo || null, data || new Date()]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('[Partida] Erro ao registrar partida:', err);
      res.status(500).json({ error: 'Erro ao registrar partida' });
    }
  }
};
