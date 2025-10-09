// Controller para CRUD de estatistica_usuario_jogo
const Estatistica = require('../models/estatisticaModel');

// Adaptação para nomes esperados nas rotas
module.exports = {
    listar: async (req, res) => {
        try {
            const { rows } = await Estatistica.getAll();
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao listar estatísticas' });
        }
    },
    getById: async (req, res) => {
        const { id } = req.params;
        try {
            const { rows } = await Estatistica.getById(id);
            if (!rows.length) return res.status(404).json({ error: 'Estatística não encontrada' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao buscar estatística' });
        }
    },
    // Criar nova estatística (associar usuário + jogo)
    async criar(req, res) {
        const { id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros } = req.body;
        try {
            const { rows } = await Estatistica.create({ id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros });
            res.status(201).json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao criar estatística' });
        }
    },
    // Atualizar estatística
    async atualizar(req, res) {
        const { id } = req.params;
        const { id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros } = req.body;
        try {
            const { rows } = await Estatistica.update(id, { id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros });
            if (!rows.length) return res.status(404).json({ error: 'Estatística não encontrada' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao atualizar estatística' });
        }
    },
    // Deletar estatística (remover associação usuário-jogo)
    async deletar(req, res) {
        const { id } = req.params;
        try {
            const { rowCount } = await Estatistica.delete(id);
            if (!rowCount) return res.status(404).json({ error: 'Estatística não encontrada' });
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: 'Erro ao deletar estatística' });
        }
    }
};
