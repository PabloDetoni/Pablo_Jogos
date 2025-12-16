// Controller para ranking avançado — agora calcula rankings a partir da tabela `partida` em vez de usar `ranking_avancado`
const db = require('../database');

// Normalizadores e helpers
function normalizeString(s) {
  if (s === undefined || s === null) return '';
  try {
    return s.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9 ]/g, '').trim();
  } catch (e) {
    return s.toString().toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  }
}
function tokensOf(s) { return (s && s.toString()) ? (s.toString().toLowerCase().match(/[a-z0-9]+/g) || []) : []; }

module.exports = {
  // Busca ranking calculado a partir de partidas
  async buscarRanking(req, res) {
    let { jogo, tipo, dificuldade, usuario, status, dataInicial, dataFinal } = req.body;
    if (dificuldade === undefined || dificuldade === '' || dificuldade === 'null') dificuldade = null;

    try {
      // Busca partidas com joins necessários
      const q = `SELECT p.*, u.nome as usuario_nome, u.status as usuario_status, j.titulo as jogo_titulo
        FROM partida p
        LEFT JOIN usuario u ON u.id = p.id_usuario
        LEFT JOIN jogo j ON j.id = p.id_jogo
        ORDER BY p.data DESC`;
      const { rows: partidasRaw } = await db.query(q);

      // Normaliza e converte numeric fields
      const partidas = partidasRaw.map(p => {
        const copy = Object.assign({}, p);
        copy._titulo = (p.jogo_titulo || p.titulo || '').toString();
        copy._jogo = (p.jogo || '').toString();
        copy._tituloNorm = normalizeString(copy._titulo);
        copy._jogoNorm = normalizeString(copy._jogo);
        copy._dificNorm = p.dificuldade ? normalizeString(p.dificuldade) : null;
        copy.tempo = (p.tempo !== undefined && p.tempo !== null && p.tempo !== '') ? Number(p.tempo) : null;
        if (isNaN(copy.tempo)) copy.tempo = null;
        copy.pontuacao = (p.pontuacao !== undefined && p.pontuacao !== null && p.pontuacao !== '') ? Number(p.pontuacao) : null;
        if (isNaN(copy.pontuacao)) copy.pontuacao = null;
        copy.erros = (p.erros !== undefined && p.erros !== null && p.erros !== '') ? Number(p.erros) : null;
        if (isNaN(copy.erros)) copy.erros = null;
        return copy;
      });

      // Filters
      const jogoFiltro = (jogo || '').toString();
      const jogoFiltroNorm = normalizeString(jogoFiltro);
      const jogoFiltroTokens = tokensOf(jogoFiltro);
      const dificuldadeFiltroNorm = dificuldade == null ? null : normalizeString(dificuldade);

      const partidasDoJogo = partidas.filter(p => {
        if (!jogoFiltroNorm) return false;
        if (p._tituloNorm === jogoFiltroNorm || p._jogoNorm === jogoFiltroNorm) return true;
        if (p._tituloNorm.includes(jogoFiltroNorm) || p._jogoNorm.includes(jogoFiltroNorm)) return true;
        if (jogoFiltroNorm.includes(p._tituloNorm) || jogoFiltroNorm.includes(p._jogoNorm)) return true;
        const tTitulo = tokensOf(p._titulo);
        const tJogo = tokensOf(p._jogo);
        if (jogoFiltroTokens.length && jogoFiltroTokens.some(t => tTitulo.includes(t) || tJogo.includes(t))) return true;
        return false;
      });

      const partidasFiltradas = partidasDoJogo.filter(p => {
        if (dificuldadeFiltroNorm === null) return true;
        const pd = p.dificuldade || null;
        if (pd === null) return false;
        const pdNorm = normalizeString(pd);
        if (pdNorm === dificuldadeFiltroNorm) return true;
        const pdTokens = tokensOf(pd);
        const dfTokens = tokensOf(dificuldade);
        if (dfTokens.length && dfTokens.some(t => pdTokens.includes(t))) return true;
        return false;
      });

      // Agrupar por usuário
      const agruparPorUsuario = (rows) => {
        const map = new Map();
        for (const r of rows) {
          const nome = (r.usuario_nome || r.nome || r.usuario || 'Desconhecido').toString();
          if (!map.has(nome)) map.set(nome, []);
          map.get(nome).push(r);
        }
        return map;
      };

      // Compute rankings similar to frontend logic
      if (tipo === 'pontuacao') {
        const withScore = partidasFiltradas.filter(p => p.pontuacao !== null);
        withScore.sort((a,b) => (b.pontuacao || 0) - (a.pontuacao || 0));
        const out = withScore.map(r => ({ nome: r.usuario_nome || r.nome || r.usuario || 'Desconhecido', valor: r.pontuacao, tempo: r.tempo, erros: r.erros, status: r.usuario_status || 'ativo' }));
        return res.json({ ranking: out });
      }

      if (tipo === 'menor_tempo') {
        const valid = partidasFiltradas.filter(p => typeof p.tempo === 'number' && !isNaN(p.tempo));
        const map = agruparPorUsuario(valid);
        const arr = [];
        for (const [nome, rows] of map.entries()) {
          const minErros = rows.reduce((acc, cur) => Math.min(acc, (cur.erros != null ? Number(cur.erros) : Infinity)), Infinity);
          const candidatos = rows.filter(r => (r.erros != null ? Number(r.erros) : Infinity) === minErros);
          const minTempo = candidatos.reduce((acc, cur) => Math.min(acc, (cur.tempo != null ? Number(cur.tempo) : Infinity)), Infinity);
          if (minTempo !== Infinity) arr.push({ nome, tempo: minTempo, erros: (minErros === Infinity ? null : minErros), valor: null, status: (rows[0].usuario_status || 'ativo') });
        }
        arr.sort((a,b) => {
          const ea = a.erros == null ? Infinity : a.erros;
          const eb = b.erros == null ? Infinity : b.erros;
          if (ea !== eb) return ea - eb;
          return (a.tempo || Infinity) - (b.tempo || Infinity);
        });
        return res.json({ ranking: arr });
      }

      if (tipo === 'mais_vitorias_total' || tipo === 'mais_vitorias_dificuldade') {
        const vitorias = new Map();
        for (const p of partidasFiltradas) {
          if ((p.resultado || '').toString().toLowerCase() === 'vitoria') {
            const nome = (p.usuario_nome || p.nome || p.usuario || 'Desconhecido').toString();
            vitorias.set(nome, (vitorias.get(nome) || 0) + 1);
          }
        }
        const arr = Array.from(vitorias.entries()).map(([nome, valor]) => ({ nome, valor, status: 'ativo' }));
        arr.sort((a,b) => b.valor - a.valor);
        return res.json({ ranking: arr });
      }

      if (tipo === 'mais_vitorias_consecutivas') {
        const map = agruparPorUsuario(partidasFiltradas);
        const arr = [];
        for (const [nome, rows] of map.entries()) {
          const ordenadas = rows.slice().sort((a,b) => new Date(a.data) - new Date(b.data));
          let maxSeq = 0, curSeq = 0;
          for (const r of ordenadas) {
            if ((r.resultado || '').toString().toLowerCase() === 'vitoria') {
              curSeq++;
              if (curSeq > maxSeq) maxSeq = curSeq;
            } else {
              curSeq = 0;
            }
          }
          if (maxSeq > 0) arr.push({ nome, valor: maxSeq, status: 'ativo' });
        }
        arr.sort((a,b) => b.valor - a.valor);
        return res.json({ ranking: arr });
      }

      // Fallback: mais ativos
      const map = agruparPorUsuario(partidasFiltradas);
      const arr = Array.from(map.entries()).map(([nome, rows]) => ({ nome, valor: rows.length, status: 'ativo' }));
      arr.sort((a,b) => b.valor - a.valor);
      return res.json({ ranking: arr });

    } catch (err) {
      console.error('[RankingAvancado] Erro ao calcular ranking a partir de partidas:', err);
      return res.status(500).json({ error: 'Erro ao buscar ranking avançado' });
    }
  },

  // endpoint de adicionar/atualizar foi descontinuado: recomendamos calcular a partir de partidas
  async adicionarOuAtualizar(req, res) {
    return res.status(410).json({ error: 'Endpoint removido. Rankings agora são calculados a partir de partidas. Use /api/partida para registrar partidas.' });
  }
};
