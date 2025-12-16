// backend/controllers/trophyTypeController.js
const TrophyType = require('../models/trophyTypeModel');

module.exports = {
  async listar(req, res) {
    try {
      const { rows } = await TrophyType.getAll();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar tipos de troféu' });
    }
  },
  async criar(req, res) {
    const { id, chave, titulo, descricao, dados } = req.body;
    if (!chave || !titulo) return res.status(400).json({ error: 'Chave e título obrigatórios' });
    try {
      const { rows } = await TrophyType.create({ id, chave, titulo, descricao, dados });
      res.status(201).json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao criar tipo de troféu' });
    }
  },
  async atualizar(req, res) {
    const { id } = req.params;
    const { chave, titulo, descricao, dados } = req.body;
    try {
      const { rows } = await TrophyType.update(id, { chave, titulo, descricao, dados });
      if (!rows.length) return res.status(404).json({ error: 'Tipo de troféu não encontrado' });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao atualizar tipo de troféu' });
    }
  },
  async deletar(req, res) {
    const { id } = req.params;
    try {
      const { rowCount } = await TrophyType.delete(id);
      if (!rowCount) return res.status(404).json({ error: 'Tipo de troféu não encontrado' });
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: 'Erro ao deletar tipo de troféu' });
    }
  }
};
