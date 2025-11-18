// Controller para ranking avançado (tabela ranking_avancado)
const db = require('../database');

module.exports = {
  // Busca os 10 melhores para o ranking solicitado
  async buscarRanking(req, res) {
    let { jogo, tipo, dificuldade } = req.body;
    // Normaliza dificuldade: null para rankings gerais
    if (dificuldade === undefined || dificuldade === '' || dificuldade === 'null') dificuldade = null;
    let query = `SELECT r.id, u.nome, u.status, r.valor, r.tempo, r.erros
      FROM ranking_avancado r
      JOIN usuario u ON u.id = r.id_usuario
      JOIN jogo j ON j.id = r.id_jogo
      WHERE j.titulo = $1 AND r.tipo = $2`;
    const params = [jogo, tipo];
    if (dificuldade !== null) {
      query += ' AND r.dificuldade = $3';
      params.push(dificuldade);
    } else {
      query += ' AND r.dificuldade IS NULL';
    }
    // Ordenação dinâmica
    if (tipo === 'menor_tempo') {
      query += ' ORDER BY r.tempo ASC NULLS LAST';
    } else {
      query += ' ORDER BY r.valor DESC NULLS LAST';
    }
    query += ' LIMIT 10';
    try {
      const { rows } = await db.query(query, params);
      res.json({ ranking: rows });
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar ranking avançado' });
    }
  },

  // Adiciona ou atualiza o ranking do usuário
  async adicionarOuAtualizar(req, res) {
    let { jogo, nome, tipo, dificuldade, valor, tempo, erros } = req.body;
    // Normaliza dificuldade: null para rankings gerais
    if (dificuldade === undefined || dificuldade === '' || dificuldade === 'null') dificuldade = null;
    console.log('[RankingAvancado] Valor recebido de dificuldade:', dificuldade, '| tipo:', typeof dificuldade);
    try {
      // Busca id_usuario e id_jogo
      const userRes = await db.query('SELECT id FROM usuario WHERE nome = $1', [nome]);
      const jogoRes = await db.query('SELECT id FROM jogo WHERE titulo = $1', [jogo]);
      if (!userRes.rows.length || !jogoRes.rows.length) return res.status(400).json({ error: 'Usuário ou jogo não encontrado' });
      const id_usuario = userRes.rows[0].id;
      const id_jogo = jogoRes.rows[0].id;
      // Verifica se já existe registro
      let where = 'id_usuario = $1 AND id_jogo = $2 AND tipo = $3';
      let params = [id_usuario, id_jogo, tipo];
      let idx = 4;
      if (dificuldade !== null) { where += ` AND dificuldade = $${idx++}`; params.push(dificuldade); }
      else { where += ' AND dificuldade IS NULL'; }
      const existe = await db.query(`SELECT id FROM ranking_avancado WHERE ${where}`, params);
      if (existe.rows.length) {
        // Atualiza se for melhor (maior valor ou menor tempo)
        if (tipo === 'menor_tempo') {
          const update = 'UPDATE ranking_avancado SET tempo = LEAST(tempo, $2), erros = $3 WHERE id = $1';
          await db.query(update, [existe.rows[0].id, tempo, erros]);
        } else if (tipo === 'mais_vitorias_dificuldade' || tipo === 'mais_vitorias_total') {
          // Acumula vitórias por dificuldade ou total
          const update = 'UPDATE ranking_avancado SET valor = valor + $2 WHERE id = $1';
          await db.query(update, [existe.rows[0].id, valor]);
        } else {
          const update = 'UPDATE ranking_avancado SET valor = GREATEST(valor, $2) WHERE id = $1';
          await db.query(update, [existe.rows[0].id, valor]);
        }
      } else {
        // Insere novo
        await db.query(
          'INSERT INTO ranking_avancado (id_usuario, id_jogo, tipo, dificuldade, valor, tempo, erros) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [id_usuario, id_jogo, tipo, dificuldade, valor, tempo, erros]
        );
      }
      res.json({ success: true });
    } catch (err) {
      console.error('[RankingAvancado] Erro ao adicionar/atualizar ranking:', err, '| dificuldade:', dificuldade, '| tipo:', typeof dificuldade);
      res.status(500).json({ error: 'Erro ao adicionar/atualizar ranking' });
    }
  }
};
