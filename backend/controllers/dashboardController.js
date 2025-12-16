// Controller para Dashboard e Ferramentas Administrativas
const db = require('../database');

module.exports = {
  // ==================== MÉTRICAS DO DASHBOARD ====================
  
  // Retorna todas as métricas gerais do sistema
  async getMetricasGerais(req, res) {
    try {
      const queries = await Promise.all([
        db.query('SELECT COUNT(*) as total FROM usuario'),
        db.query('SELECT COUNT(*) as total FROM jogo'),
        db.query('SELECT COUNT(*) as total FROM partida WHERE excluido = false OR excluido IS NULL'),
        db.query('SELECT COUNT(*) as total FROM trophy'),
        db.query('SELECT COUNT(*) as total FROM admin')
      ]);
      
      res.json({
        totalUsuarios: parseInt(queries[0].rows[0].total) || 0,
        totalJogos: parseInt(queries[1].rows[0].total) || 0,
        totalPartidas: parseInt(queries[2].rows[0].total) || 0,
        totalTrofeus: parseInt(queries[3].rows[0].total) || 0,
        totalAdmins: parseInt(queries[4].rows[0].total) || 0
      });
    } catch (err) {
      console.error('[Dashboard] Erro ao buscar métricas gerais:', err);
      res.status(500).json({ error: 'Erro ao buscar métricas gerais' });
    }
  },

  // Métricas por jogo (partidas, médias de vitórias, derrotas, empates)
  async getMetricasPorJogo(req, res) {
    try {
      const { rows } = await db.query(`
        SELECT 
          j.id,
          j.titulo,
          COUNT(p.id) as total_partidas,
          SUM(CASE WHEN LOWER(p.resultado) = 'vitoria' THEN 1 ELSE 0 END) as vitorias,
          SUM(CASE WHEN LOWER(p.resultado) = 'derrota' THEN 1 ELSE 0 END) as derrotas,
          SUM(CASE WHEN LOWER(p.resultado) = 'empate' THEN 1 ELSE 0 END) as empates,
          ROUND(AVG(CASE WHEN p.pontuacao IS NOT NULL THEN p.pontuacao END), 2) as media_pontuacao,
          ROUND(AVG(CASE WHEN p.tempo IS NOT NULL THEN p.tempo END), 2) as media_tempo
        FROM jogo j
        LEFT JOIN partida p ON p.id_jogo = j.id AND (p.excluido = false OR p.excluido IS NULL)
        GROUP BY j.id, j.titulo
        ORDER BY total_partidas DESC
      `);
      
      // Calcula médias percentuais
      const metricas = rows.map(r => {
        const total = parseInt(r.total_partidas) || 0;
        const vitorias = parseInt(r.vitorias) || 0;
        const derrotas = parseInt(r.derrotas) || 0;
        const empates = parseInt(r.empates) || 0;
        
        return {
          id: r.id,
          titulo: r.titulo,
          totalPartidas: total,
          vitorias,
          derrotas,
          empates,
          mediaVitorias: total > 0 ? ((vitorias / total) * 100).toFixed(1) : 0,
          mediaDerrotas: total > 0 ? ((derrotas / total) * 100).toFixed(1) : 0,
          mediaEmpates: total > 0 ? ((empates / total) * 100).toFixed(1) : 0,
          mediaPontuacao: parseFloat(r.media_pontuacao) || null,
          mediaTempo: parseFloat(r.media_tempo) || null
        };
      });
      
      res.json(metricas);
    } catch (err) {
      console.error('[Dashboard] Erro ao buscar métricas por jogo:', err);
      res.status(500).json({ error: 'Erro ao buscar métricas por jogo' });
    }
  },

  // Métricas de atividade (usuário mais ativo, jogo mais jogado, etc)
  async getMetricasAtividade(req, res) {
    try {
      // Usuário com mais partidas
      const usuarioMaisPartidas = await db.query(`
        SELECT u.id, u.nome, COUNT(p.id) as total_partidas
        FROM usuario u
        JOIN partida p ON p.id_usuario = u.id AND (p.excluido = false OR p.excluido IS NULL)
        GROUP BY u.id, u.nome
        ORDER BY total_partidas DESC
        LIMIT 1
      `);
      
      // Usuário com mais troféus
      const usuarioMaisTrofeus = await db.query(`
        SELECT u.id, u.nome, COUNT(t.id) as total_trofeus
        FROM usuario u
        JOIN trophy t ON t.usuario_id = u.id
        GROUP BY u.id, u.nome
        ORDER BY total_trofeus DESC
        LIMIT 1
      `);
      
      // Jogo mais jogado
      const jogoMaisJogado = await db.query(`
        SELECT j.id, j.titulo, COUNT(p.id) as total_partidas
        FROM jogo j
        JOIN partida p ON p.id_jogo = j.id AND (p.excluido = false OR p.excluido IS NULL)
        GROUP BY j.id, j.titulo
        ORDER BY total_partidas DESC
        LIMIT 1
      `);
      
      // Última partida registrada
      const ultimaPartida = await db.query(`
        SELECT p.*, u.nome as usuario_nome, j.titulo as jogo_titulo
        FROM partida p
        LEFT JOIN usuario u ON u.id = p.id_usuario
        LEFT JOIN jogo j ON j.id = p.id_jogo
        WHERE p.excluido = false OR p.excluido IS NULL
        ORDER BY p.data DESC
        LIMIT 1
      `);
      
      res.json({
        usuarioMaisPartidas: usuarioMaisPartidas.rows[0] || null,
        usuarioMaisTrofeus: usuarioMaisTrofeus.rows[0] || null,
        jogoMaisJogado: jogoMaisJogado.rows[0] || null,
        ultimaPartida: ultimaPartida.rows[0] || null
      });
    } catch (err) {
      console.error('[Dashboard] Erro ao buscar métricas de atividade:', err);
      res.status(500).json({ error: 'Erro ao buscar métricas de atividade' });
    }
  },

  // Top 3 ranking geral (baseado em vitórias totais)
  async getTopRanking(req, res) {
    try {
      // Top 3 geral por vitórias
      const topGeral = await db.query(`
        SELECT u.id, u.nome, COUNT(p.id) as total_vitorias
        FROM usuario u
        JOIN partida p ON p.id_usuario = u.id 
          AND LOWER(p.resultado) = 'vitoria'
          AND (p.excluido = false OR p.excluido IS NULL)
        GROUP BY u.id, u.nome
        ORDER BY total_vitorias DESC
        LIMIT 3
      `);
      
      // Top 3 por jogo
      const jogos = await db.query('SELECT id, titulo FROM jogo ORDER BY titulo');
      const topPorJogo = {};
      
      for (const jogo of jogos.rows) {
        const topJogo = await db.query(`
          SELECT u.id, u.nome, COUNT(p.id) as total_vitorias
          FROM usuario u
          JOIN partida p ON p.id_usuario = u.id 
            AND p.id_jogo = $1
            AND LOWER(p.resultado) = 'vitoria'
            AND (p.excluido = false OR p.excluido IS NULL)
          GROUP BY u.id, u.nome
          ORDER BY total_vitorias DESC
          LIMIT 3
        `, [jogo.id]);
        
        topPorJogo[jogo.titulo] = topJogo.rows;
      }
      
      res.json({
        topGeral: topGeral.rows,
        topPorJogo
      });
    } catch (err) {
      console.error('[Dashboard] Erro ao buscar top ranking:', err);
      res.status(500).json({ error: 'Erro ao buscar top ranking' });
    }
  },

  // ==================== FERRAMENTAS ADMINISTRATIVAS ====================
  
  // Gera backup completo do sistema (JSON)
  async gerarBackup(req, res) {
    try {
      const [usuarios, jogos, partidas, trofeus, tiposTrofeu, admins] = await Promise.all([
        db.query('SELECT * FROM usuario ORDER BY id'),
        db.query('SELECT * FROM jogo ORDER BY id'),
        db.query('SELECT * FROM partida ORDER BY id'),
        db.query('SELECT * FROM trophy ORDER BY id'),
        db.query('SELECT * FROM trophy_type ORDER BY id'),
        db.query('SELECT * FROM admin ORDER BY id_usuario')
      ]);
      
      const backup = {
        metadata: {
          geradoEm: new Date().toISOString(),
          versao: '1.0',
          sistema: 'Pablo_Jogos'
        },
        dados: {
          usuarios: usuarios.rows,
          jogos: jogos.rows,
          partidas: partidas.rows,
          trofeus: trofeus.rows,
          tiposTrofeu: tiposTrofeu.rows,
          admins: admins.rows
        },
        estatisticas: {
          totalUsuarios: usuarios.rows.length,
          totalJogos: jogos.rows.length,
          totalPartidas: partidas.rows.length,
          totalTrofeus: trofeus.rows.length,
          totalAdmins: admins.rows.length
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.json`);
      res.json(backup);
    } catch (err) {
      console.error('[Ferramentas] Erro ao gerar backup:', err);
      res.status(500).json({ error: 'Erro ao gerar backup' });
    }
  },

  // Gera backup em formato SQL
  async gerarBackupSQL(req, res) {
    try {
      const [usuarios, jogos, partidas, trofeus, tiposTrofeu, admins] = await Promise.all([
        db.query('SELECT * FROM usuario ORDER BY id'),
        db.query('SELECT * FROM jogo ORDER BY id'),
        db.query('SELECT * FROM partida ORDER BY id'),
        db.query('SELECT * FROM trophy ORDER BY id'),
        db.query('SELECT * FROM trophy_type ORDER BY id'),
        db.query('SELECT * FROM admin ORDER BY id_usuario')
      ]);
      
      let sql = `-- Backup gerado em ${new Date().toISOString()}\n`;
      sql += `-- Sistema Pablo_Jogos\n\n`;
      
      // Função auxiliar para escapar valores SQL
      const escapeSQL = (val) => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return `'${String(val).replace(/'/g, "''")}'`;
      };
      
      // Usuarios
      sql += '-- USUARIOS\n';
      for (const u of usuarios.rows) {
        sql += `INSERT INTO usuario (id, nome, email, senha, status, criado_em, atualizado_em) VALUES (${u.id}, ${escapeSQL(u.nome)}, ${escapeSQL(u.email)}, ${escapeSQL(u.senha)}, ${escapeSQL(u.status)}, ${escapeSQL(u.criado_em)}, ${escapeSQL(u.atualizado_em)}) ON CONFLICT (id) DO NOTHING;\n`;
      }
      
      // Jogos
      sql += '\n-- JOGOS\n';
      for (const j of jogos.rows) {
        sql += `INSERT INTO jogo (id, titulo, genero, descricao, slug, criado_em, atualizado_em) VALUES (${j.id}, ${escapeSQL(j.titulo)}, ${escapeSQL(j.genero)}, ${escapeSQL(j.descricao)}, ${escapeSQL(j.slug)}, ${escapeSQL(j.criado_em)}, ${escapeSQL(j.atualizado_em)}) ON CONFLICT (id) DO NOTHING;\n`;
      }
      
      // Admins
      sql += '\n-- ADMINS\n';
      for (const a of admins.rows) {
        sql += `INSERT INTO admin (id_usuario, nivel_permissao, criado_em) VALUES (${a.id_usuario}, ${a.nivel_permissao}, ${escapeSQL(a.criado_em)}) ON CONFLICT (id_usuario) DO NOTHING;\n`;
      }
      
      // Tipos de Troféu
      sql += '\n-- TIPOS DE TROFEU\n';
      for (const t of tiposTrofeu.rows) {
        sql += `INSERT INTO trophy_type (id, chave, titulo, descricao, dados, criado_em) VALUES (${t.id}, ${escapeSQL(t.chave)}, ${escapeSQL(t.titulo)}, ${escapeSQL(t.descricao)}, ${escapeSQL(t.dados)}, ${escapeSQL(t.criado_em)}) ON CONFLICT (id) DO NOTHING;\n`;
      }
      
      // Troféus
      sql += '\n-- TROFEUS\n';
      for (const t of trofeus.rows) {
        sql += `INSERT INTO trophy (id, usuario_id, trophy_type_id, granted_at, dados) VALUES (${t.id}, ${t.usuario_id}, ${t.trophy_type_id}, ${escapeSQL(t.granted_at)}, ${escapeSQL(t.dados)}) ON CONFLICT (id) DO NOTHING;\n`;
      }
      
      // Partidas
      sql += '\n-- PARTIDAS\n';
      for (const p of partidas.rows) {
        sql += `INSERT INTO partida (id, id_usuario, id_jogo, resultado, dificuldade, tempo, pontuacao, erros, dados, data, atualizado_em, excluido) VALUES (${p.id}, ${p.id_usuario || 'NULL'}, ${p.id_jogo || 'NULL'}, ${escapeSQL(p.resultado)}, ${escapeSQL(p.dificuldade)}, ${p.tempo || 'NULL'}, ${p.pontuacao || 'NULL'}, ${p.erros || 'NULL'}, ${escapeSQL(p.dados)}, ${escapeSQL(p.data)}, ${escapeSQL(p.atualizado_em)}, ${p.excluido || 'FALSE'}) ON CONFLICT (id) DO NOTHING;\n`;
      }
      
      // Reset sequences
      sql += '\n-- RESET SEQUENCES\n';
      sql += `SELECT setval('usuario_id_seq', (SELECT COALESCE(MAX(id), 1) FROM usuario));\n`;
      sql += `SELECT setval('jogo_id_seq', (SELECT COALESCE(MAX(id), 1) FROM jogo));\n`;
      sql += `SELECT setval('partida_id_seq', (SELECT COALESCE(MAX(id), 1) FROM partida));\n`;
      sql += `SELECT setval('trophy_id_seq', (SELECT COALESCE(MAX(id), 1) FROM trophy));\n`;
      sql += `SELECT setval('trophy_type_id_seq', (SELECT COALESCE(MAX(id), 1) FROM trophy_type));\n`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=backup_${new Date().toISOString().split('T')[0]}.sql`);
      res.send(sql);
    } catch (err) {
      console.error('[Ferramentas] Erro ao gerar backup SQL:', err);
      res.status(500).json({ error: 'Erro ao gerar backup SQL' });
    }
  },

  // Reset do sistema (mantém admin principal e jogos padrão)
  async resetSistema(req, res) {
    const { confirmacao, adminId } = req.body;
    
    // Verifica confirmação dupla
    if (confirmacao !== 'CONFIRMAR_RESET') {
      return res.status(400).json({ error: 'Confirmação inválida. Envie confirmacao: "CONFIRMAR_RESET"' });
    }
    
    // Verifica se é admin principal (id_usuario = 1 ou nivel_permissao >= 2)
    if (!adminId) {
      return res.status(400).json({ error: 'adminId é obrigatório' });
    }
    
    try {
      // Verifica se o admin existe e tem permissão
      const adminCheck = await db.query(
        'SELECT * FROM admin WHERE id_usuario = $1',
        [adminId]
      );
      
      if (!adminCheck.rows.length) {
        return res.status(403).json({ error: 'Usuário não é admin' });
      }
      
      // Apenas admin principal (id 1) ou nível >= 2 pode resetar
      const isAdminPrincipal = parseInt(adminId) === 1;
      const temPermissaoElevada = adminCheck.rows[0].nivel_permissao >= 2;
      
      if (!isAdminPrincipal && !temPermissaoElevada) {
        return res.status(403).json({ error: 'Apenas o admin principal pode executar reset do sistema' });
      }
      
      // Inicia transação
      await db.query('BEGIN');
      
      try {
        // 1. Apaga troféus concedidos
        const trofeusApagados = await db.query('DELETE FROM trophy RETURNING id');
        
        // 2. Apaga partidas
        const partidasApagadas = await db.query('DELETE FROM partida RETURNING id');
        
        // 3. Apaga usuários exceto o admin principal (id 1)
        const usuariosApagados = await db.query('DELETE FROM usuario WHERE id != 1 RETURNING id');
        
        // 4. Apaga admins exceto o principal
        await db.query('DELETE FROM admin WHERE id_usuario != 1');
        
        // Commit
        await db.query('COMMIT');
        
        console.log('[Ferramentas] Reset do sistema executado por admin:', adminId);
        
        res.json({
          success: true,
          message: 'Sistema resetado com sucesso',
          detalhes: {
            trofeusApagados: trofeusApagados.rowCount,
            partidasApagadas: partidasApagadas.rowCount,
            usuariosApagados: usuariosApagados.rowCount,
            mantidos: {
              adminPrincipal: true,
              jogos: true
            }
          }
        });
      } catch (err) {
        await db.query('ROLLBACK');
        throw err;
      }
    } catch (err) {
      console.error('[Ferramentas] Erro ao resetar sistema:', err);
      res.status(500).json({ error: 'Erro ao resetar sistema' });
    }
  },

  // Limpar partidas por jogo
  async limparPartidasPorJogo(req, res) {
    const { jogoId, hard } = req.body;
    
    if (!jogoId) {
      return res.status(400).json({ error: 'jogoId é obrigatório' });
    }
    
    try {
      let result;
      if (hard === true) {
        result = await db.query('DELETE FROM partida WHERE id_jogo = $1 RETURNING id', [jogoId]);
      } else {
        result = await db.query('UPDATE partida SET excluido = true, atualizado_em = NOW() WHERE id_jogo = $1 RETURNING id', [jogoId]);
      }
      
      console.log('[Ferramentas] Partidas limpas do jogo:', jogoId, '- Total:', result.rowCount);
      res.json({ success: true, partidasAfetadas: result.rowCount });
    } catch (err) {
      console.error('[Ferramentas] Erro ao limpar partidas por jogo:', err);
      res.status(500).json({ error: 'Erro ao limpar partidas' });
    }
  },

  // Limpar partidas por usuário
  async limparPartidasPorUsuario(req, res) {
    const { usuarioId, hard } = req.body;
    
    if (!usuarioId) {
      return res.status(400).json({ error: 'usuarioId é obrigatório' });
    }
    
    try {
      let result;
      if (hard === true) {
        result = await db.query('DELETE FROM partida WHERE id_usuario = $1 RETURNING id', [usuarioId]);
      } else {
        result = await db.query('UPDATE partida SET excluido = true, atualizado_em = NOW() WHERE id_usuario = $1 RETURNING id', [usuarioId]);
      }
      
      console.log('[Ferramentas] Partidas limpas do usuário:', usuarioId, '- Total:', result.rowCount);
      res.json({ success: true, partidasAfetadas: result.rowCount });
    } catch (err) {
      console.error('[Ferramentas] Erro ao limpar partidas por usuário:', err);
      res.status(500).json({ error: 'Erro ao limpar partidas' });
    }
  },

  // Recalcular/verificar integridade do ranking (não persiste, apenas verifica)
  async recalcularRanking(req, res) {
    try {
      // Como ranking é calculado dinamicamente, apenas retorna status de integridade
      const partidasCount = await db.query('SELECT COUNT(*) as total FROM partida WHERE excluido = false OR excluido IS NULL');
      const usuariosComPartidas = await db.query(`
        SELECT COUNT(DISTINCT id_usuario) as total 
        FROM partida 
        WHERE id_usuario IS NOT NULL AND (excluido = false OR excluido IS NULL)
      `);
      
      // Verifica partidas órfãs (sem usuário ou jogo válido)
      const partidasOrfas = await db.query(`
        SELECT COUNT(*) as total FROM partida p
        WHERE (p.excluido = false OR p.excluido IS NULL)
        AND (
          p.id_usuario IS NOT NULL AND NOT EXISTS (SELECT 1 FROM usuario u WHERE u.id = p.id_usuario)
          OR p.id_jogo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM jogo j WHERE j.id = p.id_jogo)
        )
      `);
      
      res.json({
        success: true,
        message: 'Verificação de ranking concluída',
        dados: {
          totalPartidas: parseInt(partidasCount.rows[0].total),
          usuariosComPartidas: parseInt(usuariosComPartidas.rows[0].total),
          partidasOrfas: parseInt(partidasOrfas.rows[0].total),
          status: parseInt(partidasOrfas.rows[0].total) === 0 ? 'OK' : 'ATENCAO_PARTIDAS_ORFAS'
        }
      });
    } catch (err) {
      console.error('[Ferramentas] Erro ao verificar ranking:', err);
      res.status(500).json({ error: 'Erro ao verificar ranking' });
    }
  }
};
