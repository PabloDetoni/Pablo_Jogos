// Exporta helpers e dados globais para uso em middlewares
// Estes serão definidos pelo server.js no momento da inicialização


// Dados globais reais, sempre a mesma referência
const users = [
  { nome: "Administrador", email: "admin@admin.com", senha: "admin123", isAdmin: true, status: 'ativo', createdAt: '2024-06-01', ultimoLogin: '' }
];

const jogosStatus = [
  { nome: 'Jogo da Velha', bloqueado: false },
  { nome: 'PPT', bloqueado: false },
  { nome: 'Forca', bloqueado: false },
  { nome: '2048', bloqueado: false },
  { nome: 'Memória', bloqueado: false },
  { nome: 'Sudoku', bloqueado: false },
  { nome: 'Pong', bloqueado: false },
  { nome: 'Campo Minado', bloqueado: false }
];


const fs = require('fs');
const path = require('path');
const ADVANCED_RANKINGS_PATH = path.join(__dirname, 'advancedRankings.json');
let advancedRankings = {};

// Carrega rankings do arquivo se existir
try {
  if (fs.existsSync(ADVANCED_RANKINGS_PATH)) {
    advancedRankings = JSON.parse(fs.readFileSync(ADVANCED_RANKINGS_PATH, 'utf8'));
  }
} catch (e) {
  advancedRankings = {};
}

function saveAdvancedRankings() {
  try {
    fs.writeFileSync(ADVANCED_RANKINGS_PATH, JSON.stringify(advancedRankings, null, 2), 'utf8');
  } catch (e) {
    // erro silencioso
  }
}

// Log global de partidas
const partidasLog = [];

function getJogosStatus() {
  return jogosStatus;
}

function findUser(email) {
  return users.find(u => u.email === email);
}

module.exports = { users, jogosStatus, advancedRankings, partidasLog, findUser, getJogosStatus, saveAdvancedRankings };
