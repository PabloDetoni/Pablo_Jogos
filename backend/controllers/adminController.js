const Admin = require('../models/adminModel');
const db = require('../database');

// Controller para CRUD de admin (1:1 com usuario)
module.exports = {
    // Listar todos admins e seus dados de usuário
    async listarAdmins(req, res) {
        try {
            const { rows } = await db.query(`
                SELECT a.*, u.nome as usuario_nome, u.email as usuario_email, u.status as usuario_status
                FROM admin a
                LEFT JOIN usuario u ON u.id = a.id_usuario
                ORDER BY a.criado_em DESC
            `);
            res.json(rows);
        } catch (err) {
            console.error('[Admin] Erro ao listar admins:', err);
            res.status(500).json({ error: 'Erro ao listar admins' });
        }
    },

    // Buscar admin por ID de usuário
    async buscarPorId(req, res) {
        const { id_usuario } = req.params;
        try {
            const { rows } = await db.query(`
                SELECT a.*, u.nome as usuario_nome, u.email as usuario_email, u.status as usuario_status
                FROM admin a
                LEFT JOIN usuario u ON u.id = a.id_usuario
                WHERE a.id_usuario = $1
            `, [id_usuario]);
            
            if (!rows.length) {
                // Verifica se o usuário existe mas não é admin
                const userCheck = await db.query('SELECT id, nome, email, status FROM usuario WHERE id = $1', [id_usuario]);
                if (userCheck.rows.length) {
                    return res.status(404).json({ 
                        error: 'Usuário não é admin', 
                        usuario: userCheck.rows[0],
                        isAdmin: false 
                    });
                }
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            res.json({ ...rows[0], isAdmin: true });
        } catch (err) {
            console.error('[Admin] Erro ao buscar admin:', err);
            res.status(500).json({ error: 'Erro ao buscar admin' });
        }
    },

    // Promover usuário a admin
    async criarAdmin(req, res) {
        const { id_usuario, nivel_permissao = 1 } = req.body;
        
        if (!id_usuario) {
            return res.status(400).json({ error: 'id_usuario é obrigatório' });
        }
        
        try {
            // Verifica se o usuário existe
            const userCheck = await db.query('SELECT id, nome FROM usuario WHERE id = $1', [id_usuario]);
            if (!userCheck.rows.length) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            
            // Verifica se já é admin
            const adminCheck = await db.query('SELECT * FROM admin WHERE id_usuario = $1', [id_usuario]);
            if (adminCheck.rows.length) {
                return res.status(400).json({ error: 'Usuário já é admin' });
            }
            
            // Cria admin
            const { rows } = await Admin.create({ id_usuario, nivel_permissao });
            
            // Atualiza status do usuário para 'admin'
            await db.query('UPDATE usuario SET status = $1 WHERE id = $2', ['admin', id_usuario]);
            
            console.log('[Admin] Usuário promovido a admin:', id_usuario);
            res.status(201).json({ 
                ...rows[0], 
                usuario_nome: userCheck.rows[0].nome,
                message: 'Usuário promovido a admin com sucesso' 
            });
        } catch (err) {
            console.error('[Admin] Erro ao promover admin:', err);
            res.status(500).json({ error: 'Erro ao promover admin' });
        }
    },

    // Atualizar nível de permissão do admin
    async atualizarAdmin(req, res) {
        const { id_usuario } = req.params;
        const { nivel_permissao } = req.body;
        
        if (nivel_permissao === undefined || nivel_permissao === null) {
            return res.status(400).json({ error: 'nivel_permissao é obrigatório' });
        }
        
        try {
            const { rows } = await Admin.update(id_usuario, { nivel_permissao });
            if (!rows.length) return res.status(404).json({ error: 'Admin não encontrado' });
            
            console.log('[Admin] Permissão atualizada:', id_usuario, '→', nivel_permissao);
            res.json(rows[0]);
        } catch (err) {
            console.error('[Admin] Erro ao atualizar admin:', err);
            res.status(500).json({ error: 'Erro ao atualizar admin' });
        }
    },

    // Remover admin (usuário permanece, só perde privilégios)
    async deletarAdmin(req, res) {
        const { id_usuario } = req.params;
        
        try {
            // Não permite remover admin do usuário ID 1 (admin principal)
            if (parseInt(id_usuario) === 1) {
                return res.status(403).json({ error: 'Não é permitido remover o admin principal' });
            }
            
            const { rowCount } = await Admin.delete(id_usuario);
            if (!rowCount) return res.status(404).json({ error: 'Admin não encontrado' });
            
            // Atualiza status do usuário para 'user'
            await db.query('UPDATE usuario SET status = $1 WHERE id = $2', ['user', id_usuario]);
            
            console.log('[Admin] Admin removido:', id_usuario);
            res.status(204).send();
        } catch (err) {
            console.error('[Admin] Erro ao remover admin:', err);
            res.status(500).json({ error: 'Erro ao remover admin' });
        }
    }
};
