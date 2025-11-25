// backend/models/jogoModel.js
const db = require('../database');

function slugify(str) {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

const Jogo = {
  async getAll() {
    return db.query('SELECT * FROM jogo');
  },
  async getById(id) {
    return db.query('SELECT * FROM jogo WHERE id = $1', [id]);
  },
  async getBySlug(slug) {
    return db.query('SELECT * FROM jogo WHERE slug = $1', [slug]);
  },
  async create({ id, titulo, genero, descricao }) {
    const slug = slugify(titulo);
    // Verifica unicidade do slug
    const existe = await db.query('SELECT 1 FROM jogo WHERE slug = $1', [slug]);
    if (existe.rows.length) throw new Error('Slug já existe');
    return db.query(
      'INSERT INTO jogo (id, titulo, genero, descricao, slug) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, titulo, genero, descricao, slug]
    );
  },
  async update(id, { titulo, genero, descricao }) {
    // Não altera o slug!
    return db.query(
      'UPDATE jogo SET titulo = $1, genero = $2, descricao = $3 WHERE id = $4 RETURNING *',
      [titulo, genero, descricao, id]
    );
  },
  async delete(id) {
    return db.query('DELETE FROM jogo WHERE id = $1 RETURNING slug', [id]);
  },
};

module.exports = Jogo;
