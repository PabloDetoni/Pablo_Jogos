// backend/models/usuarioModel.js
const db = require('../database');

const Usuario = {
  async getAll() {
    return db.query('SELECT * FROM usuario');
  },
  async getById(id) {
    return db.query('SELECT * FROM usuario WHERE id = $1', [id]);
  },
  async getByEmail(email) {
    return db.query('SELECT * FROM usuario WHERE email = $1', [email]);
  },
  async create({ id, nome, email, senha, status }) {
    if (id) {
      return db.query(
        'INSERT INTO usuario (id, nome, email, senha, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [id, nome, email, senha, status]
      );
    } else {
      return db.query(
        'INSERT INTO usuario (nome, email, senha, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [nome, email, senha, status]
      );
    }
  },
  async update(id, { nome, email, senha, status }) {
    // Não permite editar o admin (id 1)
    if (parseInt(id) === 1) return { rows: [] };
    return db.query(
      'UPDATE usuario SET nome = $1, email = $2, senha = $3, status = $4 WHERE id = $5 RETURNING *',
      [nome, email, senha, status, id]
    );
  },
  async delete(id) {
    return db.query('DELETE FROM usuario WHERE id = $1', [id]);
  },
};

module.exports = Usuario;
