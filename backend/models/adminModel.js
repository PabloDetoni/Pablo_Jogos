// backend/models/adminModel.js
const db = require('../database');

const Admin = {
  async getAll() {
    return db.query('SELECT * FROM admin');
  },
  async getById(id_usuario) {
    return db.query('SELECT * FROM admin WHERE id_usuario = $1', [id_usuario]);
  },
  async create({ id_usuario, nivel_permissao }) {
    return db.query(
      'INSERT INTO admin (id_usuario, nivel_permissao) VALUES ($1, $2) RETURNING *',
      [id_usuario, nivel_permissao]
    );
  },
  async update(id_usuario, { nivel_permissao }) {
    return db.query(
      'UPDATE admin SET nivel_permissao = $1 WHERE id_usuario = $2 RETURNING *',
      [nivel_permissao, id_usuario]
    );
  },
  async delete(id_usuario) {
    return db.query('DELETE FROM admin WHERE id_usuario = $1', [id_usuario]);
  },
};

module.exports = Admin;
