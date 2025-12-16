// backend/models/trophyModel.js
const db = require('../database');

const Trophy = {
  async getAll() {
    return db.query('SELECT t.*, u.nome as usuario_nome, tt.titulo as trophy_title FROM trophy t LEFT JOIN usuario u ON u.id = t.usuario_id LEFT JOIN trophy_type tt ON tt.id = t.trophy_type_id');
  },
  async getById(id) {
    return db.query('SELECT * FROM trophy WHERE id = $1', [id]);
  },
  async getByUserId(usuario_id) {
    return db.query('SELECT t.*, tt.titulo as trophy_title FROM trophy t LEFT JOIN trophy_type tt ON tt.id = t.trophy_type_id WHERE t.usuario_id = $1', [usuario_id]);
  },
  async create({ id, id_usuario, usuario_id, id_trophy_type, trophy_type_id, data_ganho, granted_at, dados }) {
    // Normaliza nomes de parâmetros vindos do controller
    const usuario = usuario_id || id_usuario;
    const ttype = trophy_type_id || id_trophy_type;
    const granted = granted_at || data_ganho || new Date();
    const payloadDados = dados || '{}';

    if (id !== undefined && id !== null) {
      return db.query('INSERT INTO trophy (id, usuario_id, trophy_type_id, granted_at, dados) VALUES ($1, $2, $3, $4, $5) RETURNING *', [id, usuario, ttype, granted, payloadDados]);
    }
    return db.query('INSERT INTO trophy (usuario_id, trophy_type_id, granted_at, dados) VALUES ($1, $2, $3, $4) RETURNING *', [usuario, ttype, granted, payloadDados]);
  },
  async delete(id) {
    return db.query('DELETE FROM trophy WHERE id = $1', [id]);
  }
};

module.exports = Trophy;
