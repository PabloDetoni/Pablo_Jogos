// Controller para registro de partidas
// Especificação: uma partida por jogada, dedupe apenas por match_id, sem bloqueio por conteúdo/tempo.
const db = require('../database');

// ============ VALIDAÇÃO (mesma lógica do frontend) ============
function getGameSchemaBackend(jogo) {
  if (!jogo) return null;
  const key = jogo.toString().toLowerCase();
  if (key.includes('velha')) return { required: ['resultado'], types: { resultado: 'string' } };
  if (key.includes('forca')) return { required: ['resultado'], types: { resultado: 'string' }, optional: { erros: 'number', dificuldade: 'string' } };
  if (key.includes('memoria') || key.includes('memória')) return { required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', erros: 'number', dificuldade: 'string' } };
  if (key === 'ppt' || key.includes('pedra') || key.includes('p.p.t')) return { required: ['resultado'], types: { resultado: 'string' } };
  if (key.includes('2048')) return { required: ['pontuacao'], types: { pontuacao: 'number' } };
  if (key.includes('sudoku')) return { required: ['resultado', 'tempo'], types: { resultado: 'string', tempo: 'number' }, optional: { erros: 'number', dificuldade: 'string' } };
  if (key.includes('pong')) return { required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', dificuldade: 'string' } };
  if (key.includes('campo') && key.includes('minado')) return { required: ['resultado'], types: { resultado: 'string' }, optional: { tempo: 'number', dificuldade: 'string' } };
  return { requiredAny: ['resultado', 'pontuacao', 'tempo'] };
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

// ============ CONTROLLER ============
module.exports = {
  // Registra uma nova partida
  async registrarPartida(req, res) {
    try {
      const { usuario, nome, jogo, resultado, dificuldade, tempo, pontuacao, erros, data, dados } = req.body;
      const username = usuario || nome || null;

      // 1) Jogo obrigatório
      if (!jogo) {
        console.log('[Partida] Rejeitada: jogo não informado');
        return res.status(400).json({ error: 'Jogo obrigatório' });
      }

      // 2) Validação de schema
      const validation = validatePartidaBackend(Object.assign({}, req.body, { usuario: username }));
      if (!validation.valid) {
        console.log('[Partida] Validação falhou:', validation.errors);
        return res.status(400).json({ error: 'Partida inválida', details: validation.errors });
      }

      // 3) Resolver usuário
      const userRes = username ? await db.query('SELECT id FROM usuario WHERE nome = $1', [username]) : { rows: [] };
      const id_usuario = userRes.rows.length ? userRes.rows[0].id : null;

      // 4) Resolver jogo com tolerância
      let jogoRes = await db.query('SELECT id FROM jogo WHERE titulo = $1', [jogo]);
      if (!jogoRes.rows.length) {
        try { jogoRes = await db.query('SELECT id FROM jogo WHERE lower(titulo) = lower($1)', [jogo]); } catch (e) { jogoRes = { rows: [] }; }
      }
      if (!jogoRes.rows.length) {
        try { jogoRes = await db.query('SELECT id FROM jogo WHERE titulo ILIKE $1 LIMIT 1', ['%' + jogo + '%']); } catch (e) { jogoRes = { rows: [] }; }
      }
      if (!jogoRes.rows.length) {
        try { jogoRes = await db.query("SELECT id FROM jogo WHERE slug = $1 OR lower(slug) = lower($1) LIMIT 1", [jogo]); } catch (e) { jogoRes = { rows: [] }; }
      }
      if (!jogoRes.rows.length) {
        console.log('[Partida] Jogo não encontrado:', jogo);
        return res.status(400).json({ error: 'Jogo não encontrado', jogo_recebido: jogo });
      }
      const id_jogo = jogoRes.rows[0].id;

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

      // 7) Dedupe APENAS por match_id (sem janela de tempo, sem comparação de conteúdo)
      if (matchId) {
        try {
          const q = "SELECT * FROM partida WHERE (dados->>'match_id') = $1 LIMIT 1";
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
        [id_usuario, id_jogo, resultado || null, dificuldade || null, tempoNum, pontNum, errosNum, JSON.stringify(dadosToSave), data || new Date()]
      );
      console.log('[Partida] Inserida com sucesso, id:', rows[0].id);
      return res.status(201).json({ inserted: true, partida: rows[0] });

    } catch (err) {
      console.error('[Partida] Erro ao registrar partida:', err);
      return res.status(500).json({ error: 'Erro ao registrar partida' });
    }
  },

  async listarPartidas(req, res) {
    try {
      const { rows } = await db.query('SELECT p.*, u.nome as usuario_nome, j.titulo as jogo_titulo FROM partida p LEFT JOIN usuario u ON u.id = p.id_usuario LEFT JOIN jogo j ON j.id = p.id_jogo ORDER BY p.data DESC');
      // Normalize numeric fields and fallback names to ensure frontend gets consistent types/fields
      const normalized = rows.map(p => {
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
      });
      res.json(normalized);
    } catch (err) {
      console.error('[Partida] Erro ao listar partidas:', err);
      res.status(500).json({ error: 'Erro ao listar partidas' });
    }
  },

  async listarPorUsuario(req, res) {
    const { id_usuario } = req.params;
    try {
      const { rows } = await db.query('SELECT p.*, j.titulo as jogo_titulo FROM partida p JOIN jogo j ON j.id = p.id_jogo WHERE p.id_usuario = $1 ORDER BY p.data DESC', [id_usuario]);
      const normalized = rows.map(p => {
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
      });
      res.json(normalized);
    } catch (err) {
      console.error('[Partida] Erro ao listar por usuário:', err);
      res.status(500).json({ error: 'Erro ao listar partidas por usuário' });
    }
  },

  async listarPorJogo(req, res) {
    const { id_jogo } = req.params;
    try {
      const { rows } = await db.query('SELECT p.*, u.nome as usuario_nome FROM partida p LEFT JOIN usuario u ON u.id = p.id_usuario WHERE p.id_jogo = $1 ORDER BY p.data DESC', [id_jogo]);
      const normalized = rows.map(p => {
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
      });
      res.json(normalized);
    } catch (err) {
      console.error('[Partida] Erro ao listar por jogo:', err);
      res.status(500).json({ error: 'Erro ao listar partidas por jogo' });
    }
  }
};
