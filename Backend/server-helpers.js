const fs = require('fs');
const path = require('path');
// Blacklist para rankings (persistente)
const ADVANCED_RANKINGS_BLACKLIST_PATH = path.join(__dirname, 'advancedRankingsBlacklist.json');
let advancedRankingsBlacklist = {};

// Carrega blacklist do arquivo se existir
try {
  if (fs.existsSync(ADVANCED_RANKINGS_BLACKLIST_PATH)) {
    advancedRankingsBlacklist = JSON.parse(fs.readFileSync(ADVANCED_RANKINGS_BLACKLIST_PATH, 'utf8'));
  }
} catch (e) {
  advancedRankingsBlacklist = {};
}

function saveAdvancedRankingsBlacklist() {
  try {
    fs.writeFileSync(ADVANCED_RANKINGS_BLACKLIST_PATH, JSON.stringify(advancedRankingsBlacklist, null, 2), 'utf8');
  } catch (e) {
    // erro silencioso
  }
}

// Adiciona usuário à blacklist de vitórias consecutivas
function addToConsecutiveWinsBlacklist(jogo, dificuldade, nome) {
  if (!advancedRankingsBlacklist['mais_vitorias_consecutivas']) advancedRankingsBlacklist['mais_vitorias_consecutivas'] = {};
  if (!advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo]) advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo] = {};
  if (!advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade]) advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade] = [];
  if (!advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade].includes(nome)) {
    advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade].push(nome);
    saveAdvancedRankingsBlacklist();
  }
}

// Remove usuário da blacklist (caso necessário)
function removeFromConsecutiveWinsBlacklist(jogo, dificuldade, nome) {
  if (
    advancedRankingsBlacklist['mais_vitorias_consecutivas'] &&
    advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo] &&
    advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade]
  ) {
    advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade] =
      advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade].filter(n => n !== nome);
    saveAdvancedRankingsBlacklist();
  }
}

// Verifica se usuário está na blacklist
function isInConsecutiveWinsBlacklist(jogo, dificuldade, nome) {
  return !!(
    advancedRankingsBlacklist['mais_vitorias_consecutivas'] &&
    advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo] &&
    advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade] &&
    advancedRankingsBlacklist['mais_vitorias_consecutivas'][jogo][dificuldade].includes(nome)
  );
}
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


// const fs = require('fs'); // Removido duplicidade
// const path = require('path'); // Removido duplicidade
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

module.exports = {
  users,
  jogosStatus,
  advancedRankings,
  partidasLog,
  findUser,
  getJogosStatus,
  saveAdvancedRankings,
  advancedRankingsBlacklist,
  saveAdvancedRankingsBlacklist,
  addToConsecutiveWinsBlacklist,
  removeFromConsecutiveWinsBlacklist,
  isInConsecutiveWinsBlacklist
};
