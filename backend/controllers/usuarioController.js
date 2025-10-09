// Controller para CRUD de usuario
const Usuario = require('../models/usuarioModel');

module.exports = {
    async listarUsuarios(req, res) {
        try {
            const { rows } = await Usuario.getAll();
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    },
    async criarUsuario(req, res) {
        const { id, nome, email, senha, status } = req.body;
        try {
            const { rows } = await Usuario.create({ id, nome, email, senha, status });
            res.status(201).json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao criar usuário' });
        }
    },
    async atualizarUsuario(req, res) {
        const { id } = req.params;
        const { nome, email, senha, status } = req.body;
        try {
            const { rows } = await Usuario.update(id, { nome, email, senha, status });
            if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao atualizar usuário' });
        }
    },
    async deletarUsuario(req, res) {
        const { id } = req.params;
        try {
            const { rowCount } = await Usuario.delete(id);
            if (!rowCount) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: 'Erro ao deletar usuário' });
        }
    },
    async listarUsuarioPorId(req, res) {
        const { id } = req.params;
        try {
            const { rows } = await Usuario.getById(id);
            if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao buscar usuário' });
        }
    }
};
