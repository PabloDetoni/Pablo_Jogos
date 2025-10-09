// backend/models/jogoModel.js
const db = require('../database');

const Jogo = {
  async getAll() {
    return db.query('SELECT * FROM jogo');
  },
  async getById(id) {
    return db.query('SELECT * FROM jogo WHERE id = $1', [id]);
  },
  async create({ titulo, genero, descricao }) {
    return db.query(
      'INSERT INTO jogo (titulo, genero, descricao) VALUES ($1, $2, $3) RETURNING *',
      [titulo, genero, descricao]
    );
  },
  async update(id, { titulo, genero, descricao }) {
    return db.query(
      'UPDATE jogo SET titulo = $1, genero = $2, descricao = $3 WHERE id = $4 RETURNING *',
      [titulo, genero, descricao, id]
    );
  },
  async delete(id) {
    return db.query('DELETE FROM jogo WHERE id = $1', [id]);
  },
};

module.exports = Jogo;
