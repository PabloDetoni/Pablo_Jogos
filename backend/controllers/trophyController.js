// backend/controllers/trophyController.js
const Trophy = require('../models/trophyModel');
const TrophyType = require('../models/trophyTypeModel');
const db = require('../database');

module.exports = {
  // Lista todos os troféus com dados completos para o frontend (rankings)
  async listar(req, res) {
    try {
      // Query completa: retorna troféu + tipo + usuário + status
      const { rows } = await db.query(`
        SELECT 
          t.id,
          t.usuario_id,
          u.nome as usuario_nome,
          u.status as usuario_status,
          t.trophy_type_id as trofeu_id,
          tt.titulo as trofeu_nome,
          tt.chave as trofeu_chave,
          tt.descricao as trofeu_descricao,
          (tt.dados->>'cor_hex') as trofeu_cor,
          (tt.dados->>'icone') as trofeu_icone,
          t.granted_at as data_atribuicao,
          t.dados
        FROM trophy t
        LEFT JOIN usuario u ON u.id = t.usuario_id
        LEFT JOIN trophy_type tt ON tt.id = t.trophy_type_id
        ORDER BY t.granted_at DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error('[Trophy] Erro ao listar troféus:', err);
      res.status(500).json({ error: 'Erro ao listar troféus' });
    }
  },

  async listarPorUsuario(req, res) {
    const { id_usuario } = req.params;
    try {
      const { rows } = await db.query(`
        SELECT 
          t.id,
          t.usuario_id,
          u.nome as usuario_nome,
          u.status as usuario_status,
          t.trophy_type_id as trofeu_id,
          tt.titulo as trofeu_nome,
          tt.chave as trofeu_chave,
          tt.descricao as trofeu_descricao,
          (tt.dados->>'cor_hex') as trofeu_cor,
          (tt.dados->>'icone') as trofeu_icone,
          t.granted_at as data_atribuicao,
          t.dados
        FROM trophy t
        LEFT JOIN usuario u ON u.id = t.usuario_id
        LEFT JOIN trophy_type tt ON tt.id = t.trophy_type_id
        WHERE t.usuario_id = $1
        ORDER BY t.granted_at DESC
      `, [id_usuario]);
      res.json(rows);
    } catch (err) {
      console.error('[Trophy] Erro ao listar troféus do usuário:', err);
      res.status(500).json({ error: 'Erro ao listar troféus do usuário' });
    }
  },

  async criar(req, res) {
    const { id, id_usuario, id_trophy_type, data_ganho } = req.body;
    if (!id_usuario || !id_trophy_type) return res.status(400).json({ error: 'id_usuario e id_trophy_type obrigatórios' });
    try {
      // Verifica se o tipo existe
      const tt = await TrophyType.getById(id_trophy_type);
      if (!tt.rows.length) return res.status(400).json({ error: 'Tipo de troféu não encontrado' });
      const { rows } = await Trophy.create({ id, id_usuario, id_trophy_type, data_ganho: data_ganho || new Date() });
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error('[Trophy] Erro ao criar troféu:', err);
      res.status(500).json({ error: 'Erro ao criar troféu' });
    }
  },

  async deletar(req, res) {
    const { id } = req.params;
    try {
      const { rowCount } = await Trophy.delete(id);
      if (!rowCount) return res.status(404).json({ error: 'Troféu não encontrado' });
      res.status(204).send();
    } catch (err) {
      console.error('[Trophy] Erro ao deletar troféu:', err);
      res.status(500).json({ error: 'Erro ao deletar troféu' });
    }
  }
};
