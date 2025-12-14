// controllers/initializerController.js
// Responsável por garantir dados iniciais (admin, jogos padrão) e fornecer auth (login/register)
const Usuario = require('../models/usuarioModel');
const Admin = require('../models/adminModel');
const Jogo = require('../models/jogoModel');

// Valores padrão — ajuste conforme necessário
const DEFAULT_ADMIN = {
  email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@admin.com',
  nome: process.env.DEFAULT_ADMIN_NOME || 'Administrador',
  senha: process.env.DEFAULT_ADMIN_SENHA || 'admin123',
  nivel: Number(process.env.DEFAULT_ADMIN_NIVEL || 1)
};

// Garante que o admin existe no banco (idempotente)
async function ensureAdmin() {
  const { rows } = await Usuario.getByEmail(DEFAULT_ADMIN.email);
  let adminUser;
  if (!rows.length) {
    const { rows: created } = await Usuario.create({ nome: DEFAULT_ADMIN.nome, email: DEFAULT_ADMIN.email, senha: DEFAULT_ADMIN.senha, status: 'admin' });
    adminUser = created[0];
    console.log('Usuário admin criado!');
  } else {
    adminUser = rows[0];
  }

  const adminId = adminUser.id;
  const adminRows = await Admin.getById(adminId);
  if (!adminRows.rows.length) {
    await Admin.create({ id_usuario: adminId, nivel_permissao: DEFAULT_ADMIN.nivel });
    console.log('Admin inserido na tabela admin!');
  }
}

// Garante que os jogos principais existem no banco (idempotente)
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

  const { rows: existing } = await Jogo.getAll();
  for (const jogo of jogosPadrao) {
    if (!existing.find(j => (j.titulo || '').toLowerCase() === jogo.titulo.toLowerCase())) {
      try {
        await Jogo.create(jogo);
        console.log(`Jogo '${jogo.titulo}' criado!`);
      } catch (err) {
        if (err && err.message && err.message.includes('Slug')) {
          console.warn(`Jogo '${jogo.titulo}' não criado: slug já existe, ignorando.`);
        } else {
          console.error(`Erro ao criar jogo '${jogo.titulo}':`, err.message || err);
        }
      }
    }
  }
}

// Função de inicialização que garante todos os dados necessários
async function init() {
  await ensureAdmin();
  await ensureJogos();
}

// Login (mantido para compatibilidade com rotas atuais)
async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ success: false, message: 'Email e senha obrigatórios.' });
  const { rows } = await Usuario.getByEmail(email);
  if (!rows.length) return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
  const user = rows[0];
  if (senha !== user.senha) return res.status(401).json({ success: false, message: 'Senha incorreta.' });
  res.json({ success: true, user: { nome: user.nome, email: user.email, isAdmin: user.status === 'admin' } });
}

// Registro (mantido)
async function register(req, res) {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
  if (senha.length < 8) return res.status(400).json({ success: false, message: 'Senha muito curta.' });
  const { rows } = await Usuario.getByEmail(email);
  if (rows.length) return res.status(400).json({ success: false, message: 'Email já cadastrado.' });
  const { rows: created } = await Usuario.create({ nome, email, senha, status: 'user' });
  const user = created[0];
  res.json({ success: true, user: { nome: user.nome, email: user.email, isAdmin: false } });
}

module.exports = {
  init,
  ensureAdmin,
  ensureJogos,
  login,
  register
};
