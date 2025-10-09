// Controller de Jogo
const Jogo = require('../models/jogoModel');

module.exports = {
    // Listar todos os jogos
    async listar(req, res) {
        try {
            const { rows } = await Jogo.getAll();
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao listar jogos' });
        }
    },
    // Criar novo jogo
    async criar(req, res) {
        const { titulo, genero, descricao } = req.body;
        try {
            const { rows } = await Jogo.create({ titulo, genero, descricao });
            res.status(201).json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao criar jogo' });
        }
    },
    // Editar jogo
    async editar(req, res) {
        const { id } = req.params;
        const { titulo, genero, descricao } = req.body;
        try {
            const { rows } = await Jogo.update(id, { titulo, genero, descricao });
            if (!rows.length) return res.status(404).json({ error: 'Jogo não encontrado' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao editar jogo' });
        }
    },
    // Excluir jogo
    async excluir(req, res) {
        const { id } = req.params;
        try {
            const { rowCount } = await Jogo.delete(id);
            if (!rowCount) return res.status(404).json({ error: 'Jogo não encontrado' });
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: 'Erro ao excluir jogo' });
        }
    }
};
