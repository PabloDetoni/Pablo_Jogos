// Controller de Jogo
const Jogo = require('../models/jogoModel');
const fileManager = require('../utils/jogoFileManager');

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
        const { id, titulo, genero, descricao } = req.body;
        try {
            const { rows } = await Jogo.create({ id, titulo, genero, descricao });
            const jogo = rows[0];
            try {
                fileManager.criarArquivosJogo(jogo.slug, jogo.titulo);
            } catch (err) {
                // Remove do banco se falhar
                await Jogo.delete(jogo.id);
                return res.status(500).json({ error: 'Falha ao criar arquivos do jogo' });
            }
            res.status(201).json(jogo);
        } catch (err) {
            if (err.message.includes('Slug já existe')) {
                return res.status(400).json({ error: 'Slug duplicado. Escolha outro nome.' });
            }
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
        // Lista de slugs dos jogos padrão
        const jogosPadrao = ['ppt', 'forca', '2048', 'memoria', 'sudoku', 'pong', 'campo_minado'];
        try {
            // Busca o jogo pelo id
            const { rows } = await Jogo.getById(id);
            if (!rows.length) return res.status(404).json({ error: 'Jogo não encontrado' });
            const jogo = rows[0];
            if (jogosPadrao.includes(jogo.slug)) {
                return res.status(403).json({ error: 'Esse é um jogo padrão do sistema e não pode ser excluído.' });
            }
            const { rows: deletedRows } = await Jogo.delete(id);
            if (!deletedRows.length) return res.status(404).json({ error: 'Jogo não encontrado' });
            const slug = deletedRows[0].slug;
            try {
                fileManager.removerArquivosJogo(slug);
            } catch (err) {
                return res.status(500).json({ error: 'Falha ao remover arquivos do jogo' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: 'Erro ao excluir jogo' });
        }
    },
    // Buscar jogo por ID
    async buscarPorId(req, res) {
        const { id } = req.params;
        try {
            const { rows } = await Jogo.getById(id);
            if (!rows.length) return res.status(404).json({ error: 'Jogo não encontrado' });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao buscar jogo' });
        }
    }
};
