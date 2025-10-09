const Admin = require('../models/adminModel');

// Controller para CRUD de admin (1:1 com usuario)
const db = require('../database');

module.exports = {
    // Listar todos admins e seus dados de usuário
    async listarAdmins(req, res) {
        try {
            const { rows } = await Admin.getAll();
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao listar admins' });
        }
    },
    // Promover usuário a admin
    async criarAdmin(req, res) {
        const { id_usuario, nivel_permissao } = req.body;
        try {
            const { rows } = await Admin.create({ id_usuario, nivel_permissao });
            res.status(201).json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao promover admin' });
        }
    },
    // Atualizar admin (exemplo: alterar permissões, se houver campo)
    async atualizarAdmin(req, res) {
        const { id_usuario } = req.params;
        const { nivel_permissao } = req.body;
        try {
            const { rows } = await Admin.update(id_usuario, { nivel_permissao });
            if (!rows.length) return res.status(404).json({ error: 'Admin não encontrado' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao atualizar admin' });
        }
    },
    // Remover admin (usuário permanece, só perde privilégios)
    async deletarAdmin(req, res) {
        const { id_usuario } = req.params;
        try {
            const { rowCount } = await Admin.delete(id_usuario);
            if (!rowCount) return res.status(404).json({ error: 'Admin não encontrado' });
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: 'Erro ao remover admin' });
        }
    }
};
