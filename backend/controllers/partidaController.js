// Controller para registro de partidas
// Especificação: uma partida por jogada, dedupe apenas por match_id, sem bloqueio por conteúdo/tempo.
const db = require('../database');

// ============ VALIDAÇÃO (mesma lógica do frontend) ============
function getGameSchemaBackend(jogo) {
  if (!jogo) return null;
  const key = jogo.toString().toLowerCase();
  if (key.includes('velha')) return { campos: ['resultado', 'dificuldade'], required: ['resultado'], types: { resultado: 'string' } };
  if (key.includes('forca')) return { campos: ['resultado', 'erros', 'dificuldade'], required: ['resultado'], types: { resultado: 'string' }, optional: { erros: 'number', dificuldade: 'string' } };
  if (key.includes('memoria') || key.includes('memória')) return { campos: ['resultado', 'tempo', 'erros', 'dificuldade'], required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', erros: 'number', dificuldade: 'string' } };
  if (key === 'ppt' || key.includes('pedra') || key.includes('p.p.t')) return { campos: ['resultado'], required: ['resultado'], types: { resultado: 'string' } };
  if (key.includes('2048')) return { campos: ['pontuacao'], required: ['pontuacao'], types: { pontuacao: 'number' } };
  if (key.includes('sudoku')) return { campos: ['resultado', 'tempo', 'erros', 'dificuldade'], required: ['resultado', 'tempo'], types: { resultado: 'string', tempo: 'number' }, optional: { erros: 'number', dificuldade: 'string' } };
  if (key.includes('pong')) return { campos: ['resultado', 'tempo', 'dificuldade'], required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', dificuldade: 'string' } };
  if (key.includes('campo') && key.includes('minado')) return { campos: ['resultado', 'tempo', 'dificuldade'], required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', dificuldade: 'string' } };
  return { campos: ['resultado', 'pontuacao', 'tempo', 'erros', 'dificuldade'], requiredAny: ['resultado', 'pontuacao', 'tempo'] };
}

function checkTypeBackend(val, expected) {
  if (val === undefined || val === null) return false;
  if (expected === 'number') {
    if (typeof val === 'number' && !isNaN(val)) return true;
    if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return true;
    return false;
  }
  if (expected === 'string') return (typeof val === 'string' && val.trim().length > 0);
  return true;
}

function validatePartidaBackend(partida) {
  const errors = [];
  if (!partida || typeof partida !== 'object') return { valid: false, errors: ['Partida inválida'] };
  const jogo = (partida.jogo || partida.game || '').toString();
  const schema = getGameSchemaBackend(jogo);
  if (!schema) return { valid: true, errors: [] };

  if (schema.required) {
    for (const f of schema.required) {
      const v = partida[f];
      if (v === undefined || v === null) {
        errors.push(`Campo obrigatório ausente: ${f}`);
        continue;
      }
      const expected = schema.types && schema.types[f];
      if (expected && !checkTypeBackend(v, expected)) errors.push(`Tipo inválido para ${f}: esperado ${expected}`);
    }
  }
  if (schema.requiredAny) {
    const anyOk = schema.requiredAny.some(f => partida[f] !== undefined && partida[f] !== null);
    if (!anyOk) errors.push(`Pelo menos um dos campos deve estar presente: ${schema.requiredAny.join(',')}`);
  }
  if (schema.types) {
    for (const k of Object.keys(schema.types)) {
      const expected = schema.types[k];
      if (partida[k] !== undefined && partida[k] !== null && !checkTypeBackend(partida[k], expected)) {
        errors.push(`Tipo inválido para ${k}: esperado ${expected}`);
      }
    }
  }
  if (schema.optional) {
    for (const [k, expected] of Object.entries(schema.optional)) {
      if (partida[k] !== undefined && partida[k] !== null && !checkTypeBackend(partida[k], expected)) {
        errors.push(`Tipo inválido para ${k}: esperado ${expected}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

// Helper: normaliza campos numéricos de uma partida
function normalizePartida(p) {
  const tempo = (p.tempo !== undefined && p.tempo !== null && p.tempo !== '') ? Number(p.tempo) : null;
  const pontuacao = (p.pontuacao !== undefined && p.pontuacao !== null && p.pontuacao !== '') ? Number(p.pontuacao) : null;
  const erros = (p.erros !== undefined && p.erros !== null && p.erros !== '') ? Number(p.erros) : null;
  return Object.assign({}, p, {
    tempo: isNaN(tempo) ? null : tempo,
    pontuacao: isNaN(pontuacao) ? null : pontuacao,
    erros: isNaN(erros) ? null : erros,
    usuario_nome: p.usuario_nome || p.nome || p.usuario || null,
    jogo_titulo: p.jogo_titulo || p.titulo || p.jogo || null
  });
}

// ============ CONTROLLER ============
module.exports = {
  // Retorna campos permitidos por jogo (para frontend exibir apenas campos válidos)
  getCamposPorJogo(req, res) {
    const { jogo } = req.params;
    const schema = getGameSchemaBackend(jogo);
    if (!schema) return res.json({ campos: ['resultado', 'pontuacao', 'tempo', 'erros', 'dificuldade'] });
    res.json({ campos: schema.campos || ['resultado', 'pontuacao', 'tempo', 'erros', 'dificuldade'] });
  },

  // Registra uma nova partida
  async registrarPartida(req, res) {
    try {
      const { usuario, nome, id_usuario, jogo, id_jogo, resultado, dificuldade, tempo, pontuacao, erros, data, dados } = req.body;
      const username = usuario || nome || null;

      // 1) Jogo obrigatório (pode ser título ou id)
      if (!jogo && !id_jogo) {
        console.log('[Partida] Rejeitada: jogo não informado');
        return res.status(400).json({ error: 'Jogo obrigatório' });
      }

      // 2) Resolver jogo
      let jogoId = id_jogo;
      let jogoTitulo = jogo;
      if (!jogoId && jogo) {
        let jogoRes = await db.query('SELECT id, titulo FROM jogo WHERE titulo = $1', [jogo]);
        if (!jogoRes.rows.length) {
          jogoRes = await db.query('SELECT id, titulo FROM jogo WHERE lower(titulo) = lower($1)', [jogo]);
        }
        if (!jogoRes.rows.length) {
          jogoRes = await db.query('SELECT id, titulo FROM jogo WHERE titulo ILIKE $1 LIMIT 1', ['%' + jogo + '%']);
        }
        if (!jogoRes.rows.length) {
          jogoRes = await db.query("SELECT id, titulo FROM jogo WHERE slug = $1 OR lower(slug) = lower($1) LIMIT 1", [jogo]);
        }
        if (!jogoRes.rows.length) {
          console.log('[Partida] Jogo não encontrado:', jogo);
          return res.status(400).json({ error: 'Jogo não encontrado', jogo_recebido: jogo });
        }
        jogoId = jogoRes.rows[0].id;
        jogoTitulo = jogoRes.rows[0].titulo;
      }

      // 3) Validação de schema
      const validation = validatePartidaBackend(Object.assign({}, req.body, { jogo: jogoTitulo }));
      if (!validation.valid) {
        console.log('[Partida] Validação falhou:', validation.errors);
        return res.status(400).json({ error: 'Partida inválida', details: validation.errors });
      }

      // 4) Resolver usuário
      let userId = id_usuario;
      if (!userId && username) {
        const userRes = await db.query('SELECT id FROM usuario WHERE nome = $1', [username]);
        userId = userRes.rows.length ? userRes.rows[0].id : null;
      }

      // 5) Normalizar campos numéricos
      const tempoNum = (typeof tempo === 'number') ? tempo : (tempo ? Number(tempo) : null);
      const pontNum = (typeof pontuacao === 'number') ? pontuacao : (pontuacao ? Number(pontuacao) : null);
      const errosNum = (typeof erros === 'number') ? erros : (erros ? Number(erros) : null);

      // 6) Extrair match_id de dados
      let matchId = null;
      let dadosParsed = {};
      try {
        if (dados && typeof dados === 'object') {
          dadosParsed = Object.assign({}, dados);
          if (dados.match_id) matchId = dados.match_id;
        } else if (dados && typeof dados === 'string') {
          try {
            dadosParsed = JSON.parse(dados);
            if (dadosParsed.match_id) matchId = dadosParsed.match_id;
          } catch (e) { dadosParsed = { raw: dados }; }
        }
      } catch (e) { dadosParsed = {}; }

      // 7) Dedupe APENAS por match_id
      if (matchId) {
        try {
          const q = "SELECT * FROM partida WHERE (dados->>'match_id') = $1 AND excluido = false LIMIT 1";
          const r = await db.query(q, [matchId]);
          if (r.rows.length) {
            console.log('[Partida] Dedupe por match_id:', matchId);
            return res.status(200).json({ duplicated: true, reason: 'match_id', partida: r.rows[0] });
          }
        } catch (e) {
          console.warn('[Partida] Falha na checagem por match_id, prosseguindo:', e.message);
        }
      }

      // 8) Preparar dados para salvar
      const dadosToSave = Object.assign({}, dadosParsed);
      if (!dadosToSave.usuario_text) dadosToSave.usuario_text = username;
      if (matchId) dadosToSave.match_id = matchId;

      // 9) Inserir partida
      const { rows } = await db.query(
        'INSERT INTO partida (id_usuario, id_jogo, resultado, dificuldade, tempo, pontuacao, erros, dados, data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [userId, jogoId, resultado || null, dificuldade || null, tempoNum, pontNum, errosNum, JSON.stringify(dadosToSave), data || new Date()]
      );
      console.log('[Partida] Inserida com sucesso, id:', rows[0].id);
      return res.status(201).json({ inserted: true, partida: rows[0] });

    } catch (err) {
      console.error('[Partida] Erro ao registrar partida:', err);
      return res.status(500).json({ error: 'Erro ao registrar partida' });
    }
  },

  // Lista partidas com filtros opcionais e paginação
  async listarPartidas(req, res) {
    try {
      const { userId, gameId, page = 1, limit = 50, includeDeleted } = req.query;
      let where = [];
      let params = [];
      let idx = 1;

      if (userId) {
        where.push(`p.id_usuario = $${idx++}`);
        params.push(userId);
      }
      if (gameId) {
        where.push(`p.id_jogo = $${idx++}`);
        params.push(gameId);
      }
      if (includeDeleted !== 'true') {
        where.push(`(p.excluido = false OR p.excluido IS NULL)`);
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
      const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
      
      const countQuery = `SELECT COUNT(*) as total FROM partida p ${whereClause}`;
      const countRes = await db.query(countQuery, params);
      const total = parseInt(countRes.rows[0].total);

      const query = `
        SELECT p.*, u.nome as usuario_nome, j.titulo as jogo_titulo 
        FROM partida p 
        LEFT JOIN usuario u ON u.id = p.id_usuario 
        LEFT JOIN jogo j ON j.id = p.id_jogo 
        ${whereClause}
        ORDER BY p.data DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `;
      params.push(parseInt(limit), offset);

      const { rows } = await db.query(query, params);
      const normalized = rows.map(normalizePartida);
      
      res.json({
        partidas: normalized,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      });
    } catch (err) {
      console.error('[Partida] Erro ao listar partidas:', err);
      res.status(500).json({ error: 'Erro ao listar partidas' });
    }
  },

  async listarPorUsuario(req, res) {
    const { id_usuario } = req.params;
    try {
      const { rows } = await db.query(
        'SELECT p.*, j.titulo as jogo_titulo FROM partida p JOIN jogo j ON j.id = p.id_jogo WHERE p.id_usuario = $1 AND (p.excluido = false OR p.excluido IS NULL) ORDER BY p.data DESC',
        [id_usuario]
      );
      res.json(rows.map(normalizePartida));
    } catch (err) {
      console.error('[Partida] Erro ao listar por usuário:', err);
      res.status(500).json({ error: 'Erro ao listar partidas por usuário' });
    }
  },

  async listarPorJogo(req, res) {
    const { id_jogo } = req.params;
    try {
      const { rows } = await db.query(
        'SELECT p.*, u.nome as usuario_nome FROM partida p LEFT JOIN usuario u ON u.id = p.id_usuario WHERE p.id_jogo = $1 AND (p.excluido = false OR p.excluido IS NULL) ORDER BY p.data DESC',
        [id_jogo]
      );
      res.json(rows.map(normalizePartida));
    } catch (err) {
      console.error('[Partida] Erro ao listar por jogo:', err);
      res.status(500).json({ error: 'Erro ao listar partidas por jogo' });
    }
  },

  // Buscar partida por ID
  async buscarPorId(req, res) {
    const { id } = req.params;
    try {
      const { rows } = await db.query(
        'SELECT p.*, u.nome as usuario_nome, j.titulo as jogo_titulo FROM partida p LEFT JOIN usuario u ON u.id = p.id_usuario LEFT JOIN jogo j ON j.id = p.id_jogo WHERE p.id = $1',
        [id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Partida não encontrada' });
      res.json(normalizePartida(rows[0]));
    } catch (err) {
      console.error('[Partida] Erro ao buscar por ID:', err);
      res.status(500).json({ error: 'Erro ao buscar partida' });
    }
  },

  // Atualizar partida individual
  async atualizarPartida(req, res) {
    const { id } = req.params;
    const { resultado, dificuldade, tempo, pontuacao, erros, dados } = req.body;
    
    try {
      // Busca partida existente para manter campos não enviados
      const existente = await db.query('SELECT * FROM partida WHERE id = $1', [id]);
      if (!existente.rows.length) return res.status(404).json({ error: 'Partida não encontrada' });
      
      const partida = existente.rows[0];
      
      // Monta update apenas com campos enviados
      const updates = [];
      const values = [];
      let idx = 1;
      
      if (resultado !== undefined) { updates.push(`resultado = $${idx++}`); values.push(resultado); }
      if (dificuldade !== undefined) { updates.push(`dificuldade = $${idx++}`); values.push(dificuldade); }
      if (tempo !== undefined) { updates.push(`tempo = $${idx++}`); values.push(tempo === null ? null : Number(tempo)); }
      if (pontuacao !== undefined) { updates.push(`pontuacao = $${idx++}`); values.push(pontuacao === null ? null : Number(pontuacao)); }
      if (erros !== undefined) { updates.push(`erros = $${idx++}`); values.push(erros === null ? null : Number(erros)); }
      if (dados !== undefined) { updates.push(`dados = $${idx++}`); values.push(typeof dados === 'string' ? dados : JSON.stringify(dados)); }
      
      updates.push(`atualizado_em = NOW()`);
      
      if (updates.length === 1) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }
      
      values.push(id);
      const query = `UPDATE partida SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
      const { rows } = await db.query(query, values);
      
      console.log('[Partida] Atualizada:', id);
      res.json(normalizePartida(rows[0]));
    } catch (err) {
      console.error('[Partida] Erro ao atualizar:', err);
      res.status(500).json({ error: 'Erro ao atualizar partida' });
    }
  },

  // Atualizar partidas em massa
  async atualizarEmMassa(req, res) {
    const { ids, updates } = req.body;
    
    if (!ids || !Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'IDs obrigatórios' });
    }
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Updates obrigatórios' });
    }
    
    try {
      const setClauses = [];
      const values = [];
      let idx = 1;
      
      if (updates.resultado !== undefined) { setClauses.push(`resultado = $${idx++}`); values.push(updates.resultado); }
      if (updates.dificuldade !== undefined) { setClauses.push(`dificuldade = $${idx++}`); values.push(updates.dificuldade); }
      if (updates.tempo !== undefined) { setClauses.push(`tempo = $${idx++}`); values.push(updates.tempo === null ? null : Number(updates.tempo)); }
      if (updates.pontuacao !== undefined) { setClauses.push(`pontuacao = $${idx++}`); values.push(updates.pontuacao === null ? null : Number(updates.pontuacao)); }
      if (updates.erros !== undefined) { setClauses.push(`erros = $${idx++}`); values.push(updates.erros === null ? null : Number(updates.erros)); }
      
      if (!setClauses.length) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }
      
      setClauses.push(`atualizado_em = NOW()`);
      
      // Cria placeholders para IDs
      const idPlaceholders = ids.map((_, i) => `$${idx + i}`).join(', ');
      values.push(...ids);
      
      const query = `UPDATE partida SET ${setClauses.join(', ')} WHERE id IN (${idPlaceholders}) RETURNING *`;
      const { rows } = await db.query(query, values);
      
      console.log('[Partida] Atualizadas em massa:', rows.length);
      res.json({ updated: rows.length, partidas: rows.map(normalizePartida) });
    } catch (err) {
      console.error('[Partida] Erro ao atualizar em massa:', err);
      res.status(500).json({ error: 'Erro ao atualizar partidas' });
    }
  },

  // Excluir partida individual (soft delete)
  async excluirPartida(req, res) {
    const { id } = req.params;
    const { hard } = req.query; // Se ?hard=true, faz delete físico
    
    try {
      if (hard === 'true') {
        const { rowCount } = await db.query('DELETE FROM partida WHERE id = $1', [id]);
        if (!rowCount) return res.status(404).json({ error: 'Partida não encontrada' });
        console.log('[Partida] Excluída (hard):', id);
      } else {
        const { rowCount } = await db.query('UPDATE partida SET excluido = true, atualizado_em = NOW() WHERE id = $1', [id]);
        if (!rowCount) return res.status(404).json({ error: 'Partida não encontrada' });
        console.log('[Partida] Excluída (soft):', id);
      }
      res.status(204).send();
    } catch (err) {
      console.error('[Partida] Erro ao excluir:', err);
      res.status(500).json({ error: 'Erro ao excluir partida' });
    }
  },

  // Excluir partidas em massa (por filtro ou IDs)
  async excluirEmMassa(req, res) {
    const { userId, gameId, ids, hard } = req.query;
    
    // Proteção: não permite DELETE sem filtro
    if (!userId && !gameId && !ids) {
      return res.status(400).json({ error: 'Filtro obrigatório (userId, gameId ou ids)' });
    }
    
    try {
      let query, params = [];
      let idx = 1;
      const conditions = [];
      
      if (ids) {
        const idList = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (!idList.length) return res.status(400).json({ error: 'IDs inválidos' });
        const placeholders = idList.map((_, i) => `$${idx + i}`).join(', ');
        conditions.push(`id IN (${placeholders})`);
        params.push(...idList);
        idx += idList.length;
      }
      if (userId) {
        conditions.push(`id_usuario = $${idx++}`);
        params.push(userId);
      }
      if (gameId) {
        conditions.push(`id_jogo = $${idx++}`);
        params.push(gameId);
      }
      
      const whereClause = conditions.join(' AND ');
      
      if (hard === 'true') {
        query = `DELETE FROM partida WHERE ${whereClause}`;
      } else {
        query = `UPDATE partida SET excluido = true, atualizado_em = NOW() WHERE ${whereClause}`;
      }
      
      const { rowCount } = await db.query(query, params);
      console.log(`[Partida] Excluídas em massa (${hard === 'true' ? 'hard' : 'soft'}):`, rowCount);
      res.json({ deleted: rowCount });
    } catch (err) {
      console.error('[Partida] Erro ao excluir em massa:', err);
      res.status(500).json({ error: 'Erro ao excluir partidas' });
    }
  },

  // Restaurar partida excluída (soft delete)
  async restaurarPartida(req, res) {
    const { id } = req.params;
    try {
      const { rowCount } = await db.query('UPDATE partida SET excluido = false, atualizado_em = NOW() WHERE id = $1', [id]);
      if (!rowCount) return res.status(404).json({ error: 'Partida não encontrada' });
      console.log('[Partida] Restaurada:', id);
      res.json({ restored: true });
    } catch (err) {
      console.error('[Partida] Erro ao restaurar:', err);
      res.status(500).json({ error: 'Erro ao restaurar partida' });
    }
  }
};
