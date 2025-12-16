// backend/models/trophyTypeModel.js
const db = require('../database');

const TrophyType = {
  async getAll() {
    return db.query('SELECT * FROM trophy_type');
  },
  async getById(id) {
    return db.query('SELECT * FROM trophy_type WHERE id = $1', [id]);
  },
  async getByTitulo(titulo) {
    return db.query('SELECT * FROM trophy_type WHERE titulo = $1', [titulo]);
  },
  async getByChave(chave) {
    return db.query('SELECT * FROM trophy_type WHERE chave = $1', [chave]);
  },
  async create({ id, chave, titulo, descricao, dados }) {
    if (id !== undefined && id !== null) {
      return db.query('INSERT INTO trophy_type (id, chave, titulo, descricao, dados) VALUES ($1, $2, $3, $4, $5) RETURNING *', [id, chave, titulo, descricao, dados || '{}']);
    }
    return db.query('INSERT INTO trophy_type (chave, titulo, descricao, dados) VALUES ($1, $2, $3, $4) RETURNING *', [chave, titulo, descricao, dados || '{}']);
  },
  async update(id, { chave, titulo, descricao, dados }) {
    return db.query('UPDATE trophy_type SET chave = $1, titulo = $2, descricao = $3, dados = $4 WHERE id = $5 RETURNING *', [chave, titulo, descricao, dados || '{}', id]);
  },
  async delete(id) {
    return db.query('DELETE FROM trophy_type WHERE id = $1', [id]);
  }
};

module.exports = TrophyType;
