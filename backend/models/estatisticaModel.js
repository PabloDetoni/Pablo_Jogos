// backend/models/estatisticaModel.js
const db = require('../database');

const Estatistica = {
  async getAll() {
    return db.query('SELECT * FROM estatistica_usuario_jogo');
  },
  async getById(id) {
    return db.query('SELECT * FROM estatistica_usuario_jogo WHERE id = $1', [id]);
  },
  async create({ id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros }) {
    return db.query(
      'INSERT INTO estatistica_usuario_jogo (id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros]
    );
  },
  async update(id, { id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros }) {
    return db.query(
      'UPDATE estatistica_usuario_jogo SET id_usuario = $1, id_jogo = $2, id_dificuldade = $3, vitorias = $4, vitorias_consecutivas = $5, pontuacao = $6, menor_tempo = $7, erros = $8 WHERE id = $9 RETURNING *',
      [id_usuario, id_jogo, id_dificuldade, vitorias, vitorias_consecutivas, pontuacao, menor_tempo, erros, id]
    );
  },
  async delete(id) {
    return db.query('DELETE FROM estatistica_usuario_jogo WHERE id = $1', [id]);
  },
};

module.exports = Estatistica;
