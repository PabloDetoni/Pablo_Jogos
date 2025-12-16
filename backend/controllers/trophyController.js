// backend/controllers/trophyController.js
const Trophy = require('../models/trophyModel');
const TrophyType = require('../models/trophyTypeModel');
const db = require('../database');

module.exports = {
  // Lista todos os troféus com dados completos para o frontend (rankings)
  async listar(req, res) {
    try {
      const { rows } = await db.query(`
        SELECT 
          t.id,
          t.usuario_id,
          u.nome as usuario_nome,
          u.status as usuario_status,
          t.trophy_type_id,
          tt.id as trofeu_id,
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
          t.trophy_type_id,
          tt.id as trofeu_id,
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

  // Buscar troféu por ID
  async buscarPorId(req, res) {
    const { id } = req.params;
    try {
      const { rows } = await db.query(`
        SELECT 
          t.id,
          t.usuario_id,
          u.nome as usuario_nome,
          u.status as usuario_status,
          t.trophy_type_id,
          tt.id as trofeu_id,
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
        WHERE t.id = $1
      `, [id]);
      
      if (!rows.length) return res.status(404).json({ error: 'Troféu não encontrado' });
      res.json(rows[0]);
    } catch (err) {
      console.error('[Trophy] Erro ao buscar troféu:', err);
      res.status(500).json({ error: 'Erro ao buscar troféu' });
    }
  },

  // Atribuir troféu a usuário (criar instância)
  async atribuir(req, res) {
    const { usuario_id, trophy_type_id, dados } = req.body;
    
    if (!usuario_id || !trophy_type_id) {
      return res.status(400).json({ error: 'usuario_id e trophy_type_id são obrigatórios' });
    }
    
    try {
      // Verifica se o usuário existe
      const userCheck = await db.query('SELECT id, nome FROM usuario WHERE id = $1', [usuario_id]);
      if (!userCheck.rows.length) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Verifica se o tipo de troféu existe
      const typeCheck = await TrophyType.getById(trophy_type_id);
      if (!typeCheck.rows.length) {
        return res.status(404).json({ error: 'Tipo de troféu não encontrado' });
      }
      
      // Verifica se o usuário já possui este troféu
      const existingCheck = await db.query(
        'SELECT id FROM trophy WHERE usuario_id = $1 AND trophy_type_id = $2',
        [usuario_id, trophy_type_id]
      );
      if (existingCheck.rows.length) {
        return res.status(400).json({ error: 'Usuário já possui este troféu' });
      }
      
      // Cria a instância do troféu
      const { rows } = await db.query(
        'INSERT INTO trophy (usuario_id, trophy_type_id, granted_at, dados) VALUES ($1, $2, NOW(), $3) RETURNING *',
        [usuario_id, trophy_type_id, dados ? JSON.stringify(dados) : '{}']
      );
      
      console.log('[Trophy] Troféu atribuído:', rows[0].id, 'para usuário:', usuario_id);
      res.status(201).json({
        ...rows[0],
        usuario_nome: userCheck.rows[0].nome,
        trofeu_nome: typeCheck.rows[0].titulo
      });
    } catch (err) {
      console.error('[Trophy] Erro ao atribuir troféu:', err);
      res.status(500).json({ error: 'Erro ao atribuir troféu' });
    }
  },

  // Revogar (remover) troféu de usuário
  async revogar(req, res) {
    const { id } = req.params;
    try {
      const { rowCount } = await Trophy.delete(id);
      if (!rowCount) return res.status(404).json({ error: 'Troféu não encontrado' });
      
      console.log('[Trophy] Troféu revogado:', id);
      res.status(204).send();
    } catch (err) {
      console.error('[Trophy] Erro ao revogar troféu:', err);
      res.status(500).json({ error: 'Erro ao revogar troféu' });
    }
  },

  // ========== CRUD de Tipos de Troféu (catálogo) ==========
  
  // Listar todos os tipos
  async listarTipos(req, res) {
    try {
      const { rows } = await TrophyType.getAll();
      // Normaliza os dados JSON
      const normalized = rows.map(t => ({
        ...t,
        cor_hex: t.dados?.cor_hex || null,
        icone: t.dados?.icone || null
      }));
      res.json(normalized);
    } catch (err) {
      console.error('[TrophyType] Erro ao listar tipos:', err);
      res.status(500).json({ error: 'Erro ao listar tipos de troféu' });
    }
  },

  // Buscar tipo por ID
  async buscarTipoPorId(req, res) {
    const { id } = req.params;
    try {
      const { rows } = await TrophyType.getById(id);
      if (!rows.length) return res.status(404).json({ error: 'Tipo de troféu não encontrado' });
      
      const t = rows[0];
      res.json({
        ...t,
        cor_hex: t.dados?.cor_hex || null,
        icone: t.dados?.icone || null
      });
    } catch (err) {
      console.error('[TrophyType] Erro ao buscar tipo:', err);
      res.status(500).json({ error: 'Erro ao buscar tipo de troféu' });
    }
  },

  // Criar novo tipo de troféu
  async criarTipo(req, res) {
    const { chave, titulo, descricao, cor_hex, icone } = req.body;
    
    if (!chave || !titulo) {
      return res.status(400).json({ error: 'chave e titulo são obrigatórios' });
    }
    
    try {
      // Verifica se a chave já existe
      const existingCheck = await TrophyType.getByChave(chave);
      if (existingCheck.rows.length) {
        return res.status(400).json({ error: 'Já existe um tipo de troféu com esta chave' });
      }
      
      // Monta o JSON de dados
      const dados = {};
      if (cor_hex) dados.cor_hex = cor_hex;
      if (icone) dados.icone = icone;
      
      const { rows } = await TrophyType.create({ 
        chave, 
        titulo, 
        descricao, 
        dados: JSON.stringify(dados) 
      });
      
      console.log('[TrophyType] Tipo criado:', rows[0].id);
      res.status(201).json({
        ...rows[0],
        cor_hex: dados.cor_hex || null,
        icone: dados.icone || null
      });
    } catch (err) {
      console.error('[TrophyType] Erro ao criar tipo:', err);
      res.status(500).json({ error: 'Erro ao criar tipo de troféu' });
    }
  },

  // Atualizar tipo de troféu
  async atualizarTipo(req, res) {
    const { id } = req.params;
    const { chave, titulo, descricao, cor_hex, icone } = req.body;
    
    try {
      // Verifica se o tipo existe
      const existing = await TrophyType.getById(id);
      if (!existing.rows.length) {
        return res.status(404).json({ error: 'Tipo de troféu não encontrado' });
      }
      
      // Monta o JSON de dados
      const dados = existing.rows[0].dados || {};
      if (cor_hex !== undefined) dados.cor_hex = cor_hex;
      if (icone !== undefined) dados.icone = icone;
      
      const { rows } = await TrophyType.update(id, { 
        chave: chave || existing.rows[0].chave,
        titulo: titulo || existing.rows[0].titulo,
        descricao: descricao !== undefined ? descricao : existing.rows[0].descricao,
        dados: JSON.stringify(dados)
      });
      
      console.log('[TrophyType] Tipo atualizado:', id);
      res.json({
        ...rows[0],
        cor_hex: dados.cor_hex || null,
        icone: dados.icone || null
      });
    } catch (err) {
      console.error('[TrophyType] Erro ao atualizar tipo:', err);
      res.status(500).json({ error: 'Erro ao atualizar tipo de troféu' });
    }
  },

  // Excluir tipo de troféu
  async excluirTipo(req, res) {
    const { id } = req.params;
    try {
      // Verifica se existem troféus usando este tipo
      const usageCheck = await db.query('SELECT COUNT(*) as count FROM trophy WHERE trophy_type_id = $1', [id]);
      if (parseInt(usageCheck.rows[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir: existem troféus atribuídos com este tipo',
          count: parseInt(usageCheck.rows[0].count)
        });
      }
      
      const { rowCount } = await TrophyType.delete(id);
      if (!rowCount) return res.status(404).json({ error: 'Tipo de troféu não encontrado' });
      
      console.log('[TrophyType] Tipo excluído:', id);
      res.status(204).send();
    } catch (err) {
      console.error('[TrophyType] Erro ao excluir tipo:', err);
      res.status(500).json({ error: 'Erro ao excluir tipo de troféu' });
    }
  }
};
