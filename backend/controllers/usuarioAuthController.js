// backend/controllers/usuarioAuthController.js
const Usuario = require('../models/usuarioModel');
const Admin = require('../models/adminModel');
const Jogo = require('../models/jogoModel');

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_NOME = 'Administrador';
const ADMIN_SENHA = 'admin123'; // senha padrão pedida
const ADMIN_NIVEL = 1; // nível padrão

// Garante que o admin existe no banco
async function ensureAdmin() {
  const { rows } = await Usuario.getByEmail(ADMIN_EMAIL);
  let adminUser;
  if (!rows.length) {
    // Salva senha em texto puro
    const { rows: created } = await Usuario.create({ nome: ADMIN_NOME, email: ADMIN_EMAIL, senha: ADMIN_SENHA, status: 'admin' });
    adminUser = created[0];
    console.log('Usuário admin criado!');
  } else {
    adminUser = rows[0];
  }
  // Garante que está na tabela admin
  const adminId = adminUser.id;
  const adminRows = await Admin.getById(adminId);
  if (!adminRows.rows.length) {
    await Admin.create({ id_usuario: adminId, nivel_permissao: ADMIN_NIVEL });
    console.log('Admin inserido na tabela admin!');
  }
}

// Garante que os jogos principais existem no banco
async function ensureJogos() {
  const jogosPadrao = [ 
    { titulo: 'PPT', genero: 'Clássico', descricao: 'Pedra Papel Tesoura', slug: 'ppt' },
    { titulo: 'Forca', genero: 'Palavras', descricao: 'Jogo da Forca', slug: 'forca'},
    { titulo: '2048', genero: 'Puzzle', descricao: 'Jogo 2048', slug: '2048'},
    { titulo: 'Memória', genero: 'Puzzle', descricao: 'Jogo da Memória', slug: 'memoria'},
    { titulo: 'Sudoku', genero: 'Puzzle', descricao: 'Jogo Sudoku', slug: 'sudoku'},
    { titulo: 'Pong', genero: 'Arcade', descricao: 'Jogo Pong', slug: 'pong'},
    { titulo: 'Campo Minado', genero: 'Puzzle', descricao: 'Campo Minado', slug: 'campo_minado'},
    { titulo: 'Velha', genero: 'Clássico', descricao: 'Jogo da Velha', slug: 'velha'}
  
  ];
  for (const jogo of jogosPadrao) {
    const { rows } = await Jogo.getAll();
    if (!rows.find(j => j.titulo === jogo.titulo)) {
      try {
        await Jogo.create(jogo);
        console.log(`Jogo '${jogo.titulo}' criado!`);
      } catch (err) {
        // Se o slug já existir (pode ocorrer por execução anterior), apenas ignorar e continuar
        if (err && err.message && err.message.includes('Slug')) {
          console.warn(`Jogo '${jogo.titulo}' não criado: slug já existe, ignorando.`);
        } else {
          throw err;
        }
      }
    }
  }
}

module.exports = {
  // Login
  async login(req, res) {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ success: false, message: 'Email e senha obrigatórios.' });
    const { rows } = await Usuario.getByEmail(email);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
    const user = rows[0];
    // Comparação direta, sem hash
    if (senha !== user.senha) return res.status(401).json({ success: false, message: 'Senha incorreta.' });
    res.json({ success: true, user: { nome: user.nome, email: user.email, isAdmin: user.status === 'admin' } });
  },
  // Registro
  async register(req, res) {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
    if (senha.length < 8) return res.status(400).json({ success: false, message: 'Senha muito curta.' });
    const { rows } = await Usuario.getByEmail(email);
    if (rows.length) return res.status(400).json({ success: false, message: 'Email já cadastrado.' });
    // Salva senha em texto puro
    const { rows: created } = await Usuario.create({ nome, email, senha, status: 'user' });
    const user = created[0];
    res.json({ success: true, user: { nome: user.nome, email: user.email, isAdmin: false } });
  },
  ensureAdmin,
  ensureJogos
};
